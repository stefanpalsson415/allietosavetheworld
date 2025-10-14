import React, { useState } from 'react';
import { NotionButton, NotionBadge } from '../../../common/NotionUI';
import { 
  Upload, FileText, Users, AlertCircle, CheckCircle, 
  Download, X, Loader2, Info, ArrowRight, FileSpreadsheet,
  Heart, BarChart3, AlertTriangle, Trash2
} from 'lucide-react';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import GEDCOMParser from '../../../../services/GEDCOMParser';

const ImportUtility = ({ familyId, onImportComplete, onClose }) => {
  const [importing, setImporting] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('upload'); // upload, preview, importing, complete
  const [importProgress, setImportProgress] = useState(0);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('ImportUtility: Starting file upload', { 
      fileName: file.name, 
      fileSize: file.size,
      fileType: file.type 
    });

    setError(null);
    setFileInfo({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.name.endsWith('.ged') ? 'GEDCOM' : 'CSV'
    });

    try {
      const text = await file.text();
      console.log('ImportUtility: File read complete', { 
        contentLength: text?.length,
        firstChars: text?.substring(0, 100) 
      });
      
      // Validate we got text content
      if (!text || text.trim().length === 0) {
        throw new Error('File appears to be empty. Please select a valid GEDCOM or CSV file.');
      }
      
      if (file.name.endsWith('.ged')) {
        console.log('ImportUtility: Parsing as GEDCOM');
        const parsed = await parseGEDCOM(text);
        setParseResult(parsed);
      } else if (file.name.endsWith('.csv')) {
        console.log('ImportUtility: Parsing as CSV');
        const parsed = await parseCSV(text);
        setParseResult(parsed);
      } else {
        throw new Error('Unsupported file format. Please upload a .ged or .csv file.');
      }
      
      setStep('preview');
    } catch (err) {
      setError(err.message || 'Failed to parse file. Please check the file format.');
      console.error('ImportUtility Parse error:', err, err.stack);
      setFileInfo(null);
    }
  };

  const parseGEDCOM = async (content) => {
    console.log('parseGEDCOM: Starting parse', { contentLength: content?.length });
    
    // Use the robust GEDCOM parser
    const parser = new GEDCOMParser();
    console.log('parseGEDCOM: Parser instantiated');
    
    const result = await parser.parse(content);
    console.log('parseGEDCOM: Parse complete', { 
      success: result?.success,
      error: result?.error,
      hasData: !!result?.data,
      nodeCount: result?.data?.nodes?.length,
      relationshipCount: result?.data?.relationships?.length
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to parse GEDCOM file');
    }
    
    // Validate result structure
    if (!result.data || !result.data.nodes || !result.data.relationships) {
      console.error('parseGEDCOM: Invalid data structure', result);
      throw new Error('Invalid GEDCOM data structure');
    }
    
    console.log('parseGEDCOM: Transforming nodes');
    // Transform the parsed data to match our format
    const individuals = result.data.nodes
      .filter(node => {
        const isPerson = node && node.type === 'person';
        console.log('parseGEDCOM: Node filter', { 
          nodeId: node?.id, 
          nodeType: node?.type, 
          isPerson 
        });
        return isPerson;
      })
      .map((node, index) => {
        console.log(`parseGEDCOM: Mapping node ${index}`, { 
          nodeId: node.id,
          hasProperties: !!node.properties,
          hasMetadata: !!node.metadata
        });
        return {
          id: node.id,
          firstName: node.properties?.firstName || '',
          lastName: node.properties?.lastName || '',
          displayName: node.properties?.displayName || '',
          gender: node.properties?.gender || 'unknown',
          birthDate: node.properties?.birthDate || null,
          birthPlace: node.properties?.birthPlace || '',
          deathDate: node.properties?.deathDate || null,
          deathPlace: node.properties?.deathPlace || '',
          isLiving: node.properties?.isLiving !== false,
          occupation: node.properties?.occupation || '',
          education: node.properties?.education || '',
          gedcomId: node.metadata?.gedcomId || node.id
        };
      });
    
    const relationships = result.data.relationships.map(rel => ({
      person1: rel.from,
      person2: rel.to,
      type: rel.type,
      metadata: rel.properties || {}
    }));
    
    return {
      individuals,
      relationships,
      stats: {
        ...result.stats, // Spread first to allow our overrides
        totalPeople: individuals.length,
        totalRelationships: relationships.length, // This will override the 0 from parser
        totalFamilies: result.stats?.totalFamilies || Math.floor(relationships.length / 3),
        generations: result.stats?.generations || 'Unknown'
      },
      errors: result.errors,
      warnings: result.warnings
    };
  };

  const parseCSV = async (content) => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or invalid');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const individuals = [];

    // Expected headers mapping
    const headerMap = {
      'first name': 'firstName',
      'firstname': 'firstName',
      'last name': 'lastName',
      'lastname': 'lastName',
      'gender': 'gender',
      'sex': 'gender',
      'birth date': 'birthDate',
      'birthdate': 'birthDate',
      'birth place': 'birthPlace',
      'birthplace': 'birthPlace',
      'death date': 'deathDate',
      'deathdate': 'deathDate',
      'death place': 'deathPlace',
      'deathplace': 'deathPlace',
      'father': 'father',
      'mother': 'mother',
      'spouse': 'spouse',
      'occupation': 'occupation',
      'email': 'email',
      'phone': 'phone'
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) continue;

      const person = { id: `CSV_${i}` };
      
      headers.forEach((header, index) => {
        const field = headerMap[header];
        if (field && values[index]) {
          if (field === 'gender') {
            person[field] = values[index].toLowerCase().startsWith('m') ? 'male' : 
                           values[index].toLowerCase().startsWith('f') ? 'female' : 'other';
          } else {
            person[field] = values[index];
          }
        }
      });

      if (person.firstName || person.lastName) {
        individuals.push(person);
      }
    }

    // Build relationships from parent/spouse references
    const relationships = [];
    individuals.forEach((person, index) => {
      if (person.father) {
        const fatherIndex = individuals.findIndex(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase() === person.father.toLowerCase()
        );
        if (fatherIndex !== -1) {
          relationships.push({
            person1: individuals[fatherIndex].id,
            person2: person.id,
            type: 'parent'
          });
        }
      }
      
      if (person.mother) {
        const motherIndex = individuals.findIndex(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase() === person.mother.toLowerCase()
        );
        if (motherIndex !== -1) {
          relationships.push({
            person1: individuals[motherIndex].id,
            person2: person.id,
            type: 'parent'
          });
        }
      }
      
      if (person.spouse) {
        const spouseIndex = individuals.findIndex(p => 
          `${p.firstName} ${p.lastName}`.toLowerCase() === person.spouse.toLowerCase()
        );
        if (spouseIndex !== -1) {
          relationships.push({
            person1: person.id,
            person2: individuals[spouseIndex].id,
            type: 'spouse'
          });
        }
      }
    });

    return {
      individuals,
      relationships,
      stats: {
        totalPeople: individuals.length,
        totalRelationships: relationships.length,
        generations: calculateGenerations(individuals, relationships)
      }
    };
  };

  const calculateGenerations = (individuals, relationships) => {
    // Simple generation calculation based on parent-child relationships
    const generations = new Set();
    const visited = new Set();
    
    const findGeneration = (personId, generation = 0) => {
      if (visited.has(personId)) return;
      visited.add(personId);
      generations.add(generation);
      
      // Find children
      relationships
        .filter(r => r.person1 === personId && r.type === 'parent')
        .forEach(r => findGeneration(r.person2, generation + 1));
    };
    
    // Start from people without parents
    individuals.forEach(person => {
      const hasParents = relationships.some(r => 
        r.person2 === person.id && r.type === 'parent'
      );
      if (!hasParents) {
        findGeneration(person.id);
      }
    });
    
    return Math.max(...Array.from(generations), 0) + 1;
  };

  const clearExistingData = async () => {
    if (!window.confirm('⚠️ This will delete ALL existing family tree data. Are you sure you want to continue?')) {
      return;
    }
    
    setImporting(true);
    try {
      console.log('Clearing existing family tree data...');
      const result = await FamilyTreeService.clearFamilyTree(familyId);
      console.log(`Cleared ${result.membersDeleted} members and ${result.relationshipsDeleted} relationships`);
      alert(`✅ Successfully cleared ${result.membersDeleted} members and ${result.relationshipsDeleted} relationships`);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('❌ Error clearing data: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const startImport = async () => {
    setStep('importing');
    setImporting(true);
    setImportProgress(0);

    try {
      const totalItems = parseResult.individuals.length + parseResult.relationships.length;
      
      // Prepare members data for batch import
      const members = parseResult.individuals.map(person => ({
        firstName: person.firstName || 'Unknown',
        lastName: person.lastName || '',
        displayName: person.displayName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
        gender: person.gender || 'other',
        birthDate: person.birthDate || '',
        birthPlace: person.birthPlace || '',
        deathDate: person.deathDate || '',
        deathPlace: person.deathPlace || '',
        occupation: person.occupation || '',
        email: person.email || '',
        phone: person.phone || '',
        importId: person.id,
        importSource: fileInfo.type,
        id: person.id // Use the GEDCOM ID as the member ID for relationship mapping
      }));
      
      // Prepare relationships data for batch import  
      const relationships = parseResult.relationships.map(rel => ({
        fromMemberId: rel.person1,
        toMemberId: rel.person2,
        type: rel.type,
        person1ImportId: rel.person1,
        person2ImportId: rel.person2
      }));
      
      console.log(`Starting batch import of ${members.length} individuals...`);
      
      // Use progress tracking interval for smoother updates
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        if (currentProgress < 45) {
          currentProgress += 2;
          setImportProgress(currentProgress);
        }
      }, 500);
      
      // Import members using batch method
      const memberResult = await FamilyTreeService.batchImportMembers(familyId, members, 100);
      
      clearInterval(progressInterval);
      setImportProgress(50);
      
      if (memberResult.errors.length > 0) {
        console.warn('Some members failed to import:', memberResult.errors);
      }
      
      console.log(`Imported ${memberResult.imported} new members, skipped ${memberResult.skipped || 0} duplicates`);
      console.log(`Starting batch import of ${relationships.length} relationships...`);
      
      // Start progress for relationships
      const relProgressInterval = setInterval(() => {
        if (currentProgress < 95) {
          currentProgress += 2;
          setImportProgress(currentProgress);
        }
      }, 500);
      
      // Import relationships using batch method
      const relResult = await FamilyTreeService.batchImportRelationships(familyId, relationships, 100);
      
      clearInterval(relProgressInterval);
      setImportProgress(100);
      
      if (relResult.errors.length > 0) {
        console.warn('Some relationships failed to import:', relResult.errors);
      }
      
      console.log(`Imported ${relResult.imported} new relationships, skipped ${relResult.skipped || 0} duplicates`);
      
      // Calculate generations after importing relationships
      console.log('Calculating generations...');
      setImportProgress(96);
      try {
        const genResult = await FamilyTreeService.calculateGenerations(familyId);
        console.log(`Calculated generations for ${genResult.membersUpdated} members`);
      } catch (genError) {
        console.warn('Failed to calculate generations:', genError);
      }
      setImportProgress(100);
      
      // Show summary message
      const totalImported = memberResult.imported + relResult.imported;
      const totalSkipped = (memberResult.skipped || 0) + (relResult.skipped || 0);
      if (totalSkipped > 0) {
        console.log(`\n✅ Import Summary: ${totalImported} new items imported, ${totalSkipped} duplicates skipped`);
      } else {
        console.log(`\n✅ Import Summary: ${totalImported} items imported successfully`);
      }

      setStep('complete');
      if (onImportComplete) {
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `First Name,Last Name,Gender,Birth Date,Birth Place,Death Date,Death Place,Father,Mother,Spouse,Occupation,Email,Phone
John,Doe,Male,1950-01-15,New York NY,,,Robert Doe,Mary Smith,Jane Doe,Engineer,john@example.com,555-1234
Jane,Doe,Female,1952-03-22,Boston MA,,,William Smith,Elizabeth Jones,John Doe,Teacher,jane@example.com,555-5678
Robert,Doe,Male,1920-05-10,Chicago IL,1990-12-25,Chicago IL,,,Mary Smith,Farmer,,
Mary,Smith,Female,1922-07-08,Detroit MI,1995-03-15,Detroit MI,,,Robert Doe,Homemaker,,`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'family_tree_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Import Family Tree Data</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-900 font-medium mb-1">Supported Formats</p>
                    <p className="text-sm text-blue-700">
                      • GEDCOM (.ged) - Standard genealogy format<br />
                      • CSV (.csv) - Comma-separated values with headers
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-base font-medium text-indigo-600 hover:text-indigo-700">
                    Click to upload
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    type="file"
                    accept=".ged,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">GEDCOM or CSV files up to 10MB</p>
              </div>

              <div className="flex items-center justify-center">
                <button
                  onClick={downloadTemplate}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'preview' && parseResult && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-green-900 font-medium">File parsed successfully!</p>
                    <p className="text-sm text-green-700">
                      {fileInfo.name} ({fileInfo.size})
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{parseResult.stats.totalPeople}</p>
                  <p className="text-sm text-gray-600">People</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FileSpreadsheet className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{parseResult.stats.totalRelationships}</p>
                  <p className="text-sm text-gray-600">Relationships</p>
                </div>
                {parseResult.stats.totalFamilies !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Heart className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{parseResult.stats.totalFamilies}</p>
                    <p className="text-sm text-gray-600">Families</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <BarChart3 className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{parseResult.stats.generations}</p>
                  <p className="text-sm text-gray-600">Generations</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="font-medium text-gray-900 mb-3">Preview (First 20 People)</h3>
                <div className="space-y-2">
                  {parseResult.individuals.slice(0, 20).map((person, index) => {
                    const displayName = person.displayName || 
                                       `${person.firstName || ''} ${person.lastName || ''}`.trim() || 
                                       'Unknown';
                    const birthYear = person.birthDate ? 
                      (typeof person.birthDate === 'object' && person.birthDate.parsed ? 
                        new Date(person.birthDate.parsed).getFullYear() : 
                        person.birthDate.toString().match(/\d{4}/)?.[0] || 
                        person.birthDate) : 
                      null;
                    
                    return (
                      <div key={person.id || index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">
                          {displayName}
                        </span>
                        <span className="text-gray-500">
                          {birthYear ? `b. ${birthYear}` : 'No birth date'}
                        </span>
                      </div>
                    );
                  })}
                  {parseResult.individuals.length > 20 && (
                    <p className="text-sm text-gray-500 italic mt-2">
                      ... and {parseResult.individuals.length - 20} more
                    </p>
                  )}
                </div>
              </div>

              {parseResult.individuals.length > 100 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-900 font-medium">Large Import Detected</p>
                      <p className="text-sm text-amber-700">
                        This file contains {parseResult.individuals.length.toLocaleString()} people and will take several minutes to import.
                        Consider importing in smaller batches if you experience issues.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {parseResult.warnings && parseResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-900 font-medium">
                        {parseResult.warnings.length} Warning{parseResult.warnings.length > 1 ? 's' : ''}
                      </p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside mt-1 max-h-32 overflow-y-auto">
                        {parseResult.warnings.slice(0, 10).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                        {parseResult.warnings.length > 10 && (
                          <li className="italic">... and {parseResult.warnings.length - 10} more warnings</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'importing' && (
            <div className="space-y-6 text-center py-8">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">Importing family tree data...</p>
                <p className="text-sm text-gray-600">This may take a few minutes for large files</p>
              </div>
              <div className="max-w-xs mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{importProgress}% complete</p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6 text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">Import successful!</p>
                <p className="text-sm text-gray-600">
                  Your family tree has been updated with {parseResult.stats.totalPeople} people
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          {step === 'upload' && (
            <NotionButton onClick={onClose} variant="secondary">
              Cancel
            </NotionButton>
          )}
          
          {step === 'preview' && (
            <>
              <NotionButton 
                onClick={() => setStep('upload')} 
                variant="secondary"
              >
                Back
              </NotionButton>
              <NotionButton
                onClick={clearExistingData}
                variant="secondary"
                className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                disabled={importing}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Clear Existing Data
              </NotionButton>
              <NotionButton
                onClick={startImport}
                variant="primary"
                icon={<ArrowRight className="h-4 w-4" />}
                disabled={importing}
              >
                Import {parseResult.stats.totalPeople} People
              </NotionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportUtility;