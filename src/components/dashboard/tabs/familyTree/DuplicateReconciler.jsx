import React, { useState, useEffect } from 'react';
import { NotionButton, NotionBadge } from '../../../common/NotionUI';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import { 
  X, Users, AlertTriangle, Check, ChevronRight, 
  Calendar, MapPin, Mail, Phone, Camera, Merge
} from 'lucide-react';
import { db } from '../../../../services/firebase';
import { collection, doc, getDocs, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';

const DuplicateReconciler = ({ familyId, treeData, onClose, onReconcileComplete }) => {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [merging, setMerging] = useState(false);
  const [reconcileStats, setReconcileStats] = useState({
    found: 0,
    merged: 0
  });

  useEffect(() => {
    findDuplicates();
  }, []);

  const findDuplicates = async () => {
    setLoading(true);
    try {
      if (!treeData?.members || treeData.members.length === 0) {
        setDuplicateGroups([]);
        setLoading(false);
        return;
      }

      // Group members by similar names and emails
      const nameGroups = {};
      const emailGroups = {};
      
      treeData.members.forEach(member => {
        // Normalize names for comparison
        const displayName = member.profile?.displayName || '';
        const firstName = member.profile?.firstName || '';
        const lastName = member.profile?.lastName || '';
        const email = member.profile?.email?.toLowerCase().trim();
        
        // Create various name keys to check
        const nameKeys = [
          displayName.toLowerCase().trim(),
          `${firstName} ${lastName}`.toLowerCase().trim(),
          firstName.toLowerCase().trim()
        ].filter(key => key && key.length > 0);
        
        // Group by name
        nameKeys.forEach(key => {
          if (!nameGroups[key]) {
            nameGroups[key] = [];
          }
          nameGroups[key].push(member);
        });
        
        // Group by email if exists
        if (email) {
          if (!emailGroups[email]) {
            emailGroups[email] = [];
          }
          emailGroups[email].push(member);
        }
      });
      
      // Find actual duplicates
      const duplicates = [];
      const processedIds = new Set();
      
      // Check name groups
      Object.entries(nameGroups).forEach(([name, members]) => {
        if (members.length > 1) {
          const groupIds = members.map(m => m.id).sort().join('-');
          if (!processedIds.has(groupIds)) {
            processedIds.add(groupIds);
            duplicates.push({
              id: groupIds,
              key: name,
              type: 'name',
              members: members,
              confidence: calculateConfidence(members)
            });
          }
        }
      });
      
      // Check email groups
      Object.entries(emailGroups).forEach(([email, members]) => {
        if (members.length > 1) {
          const groupIds = members.map(m => m.id).sort().join('-');
          if (!processedIds.has(groupIds)) {
            processedIds.add(groupIds);
            duplicates.push({
              id: groupIds,
              key: email,
              type: 'email',
              members: members,
              confidence: 'high' // Email matches are high confidence
            });
          }
        }
      });
      
      // Sort by confidence and member count
      duplicates.sort((a, b) => {
        const confOrder = { high: 3, medium: 2, low: 1 };
        const confDiff = confOrder[b.confidence] - confOrder[a.confidence];
        if (confDiff !== 0) return confDiff;
        return b.members.length - a.members.length;
      });
      
      setDuplicateGroups(duplicates);
      setReconcileStats(prev => ({ ...prev, found: duplicates.length }));
    } catch (error) {
      console.error('Error finding duplicates:', error);
    }
    setLoading(false);
  };

  const calculateConfidence = (members) => {
    // Calculate confidence based on matching fields
    let matches = 0;
    const fields = ['firstName', 'lastName', 'email', 'birthDate', 'birthPlace'];
    
    for (let i = 0; i < members.length - 1; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const m1 = members[i].profile || {};
        const m2 = members[j].profile || {};
        
        fields.forEach(field => {
          if (m1[field] && m2[field] && m1[field] === m2[field]) {
            matches++;
          }
        });
      }
    }
    
    const maxPossible = (members.length * (members.length - 1) / 2) * fields.length;
    const ratio = matches / maxPossible;
    
    if (ratio > 0.6) return 'high';
    if (ratio > 0.3) return 'medium';
    return 'low';
  };

  const findBestMember = (members) => {
    // Score each member based on data completeness
    const scored = members.map(member => {
      let score = 0;
      const profile = member.profile || {};
      
      // Award points for having data
      if (profile.photoUrl) score += 10;
      if (profile.email) score += 8;
      if (profile.birthDate) score += 5;
      if (profile.birthPlace) score += 3;
      if (profile.occupation) score += 3;
      if (profile.biography) score += 5;
      if (profile.firstName && profile.lastName) score += 5;
      if (member.metadata?.customFields?.role) score += 5;
      if (member.metadata?.generation !== undefined) score += 3;
      
      // Award points for relationships
      const relationshipCount = treeData.relationships?.filter(r => 
        r.fromMemberId === member.id || r.toMemberId === member.id
      ).length || 0;
      score += relationshipCount * 2;
      
      return { member, score };
    });
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].member;
  };

  const handleMerge = async (group, primaryMemberId) => {
    setMerging(true);
    try {
      const treeId = `tree_${familyId}`;
      const membersRef = collection(db, 'familyTrees', treeId, 'members');
      
      // Find primary member data
      const primaryMember = group.members.find(m => m.id === primaryMemberId);
      const otherMembers = group.members.filter(m => m.id !== primaryMemberId);
      
      // Get fresh data for primary member
      const primaryRef = doc(membersRef, primaryMemberId);
      const primaryDoc = await getDoc(primaryRef);
      
      if (!primaryDoc.exists()) {
        throw new Error('Primary member not found');
      }
      
      let mergedData = { ...primaryDoc.data() };
      
      // Merge data from other members
      for (const otherMember of otherMembers) {
        const otherRef = doc(membersRef, otherMember.id);
        const otherDoc = await getDoc(otherRef);
        
        if (otherDoc.exists()) {
          const otherData = otherDoc.data();
          
          // Merge profile data (prefer non-empty values)
          if (otherData.profile) {
            Object.keys(otherData.profile).forEach(key => {
              if (otherData.profile[key] && !mergedData.profile[key]) {
                mergedData.profile[key] = otherData.profile[key];
              }
            });
          }
          
          // Merge metadata
          if (otherData.metadata) {
            mergedData.metadata = mergedData.metadata || {};
            Object.keys(otherData.metadata).forEach(key => {
              if (otherData.metadata[key] && !mergedData.metadata[key]) {
                mergedData.metadata[key] = otherData.metadata[key];
              }
            });
          }
          
          // Update relationships to point to primary member
          const relationshipsRef = collection(db, 'familyTrees', treeId, 'relationships');
          const relationshipsSnapshot = await getDocs(relationshipsRef);
          
          const updatePromises = [];
          relationshipsSnapshot.docs.forEach(relDoc => {
            const relData = relDoc.data();
            let updated = false;
            
            if (relData.fromMemberId === otherMember.id) {
              relData.fromMemberId = primaryMemberId;
              updated = true;
            }
            if (relData.toMemberId === otherMember.id) {
              relData.toMemberId = primaryMemberId;
              updated = true;
            }
            
            if (updated) {
              updatePromises.push(updateDoc(relDoc.ref, relData));
            }
          });
          
          await Promise.all(updatePromises);
          
          // Delete the duplicate member
          await deleteDoc(otherRef);
        }
      }
      
      // Update primary member with merged data
      await updateDoc(primaryRef, mergedData);
      
      // Update stats
      setReconcileStats(prev => ({ ...prev, merged: prev.merged + 1 }));
      
      // Remove this group from the list
      setDuplicateGroups(prev => prev.filter(g => g.id !== group.id));
      setSelectedGroup(null);
      
      console.log(`Successfully merged ${otherMembers.length} duplicates into ${primaryMember.profile.displayName}`);
    } catch (error) {
      console.error('Error merging duplicates:', error);
      alert('Error merging duplicates. Please try again.');
    }
    setMerging(false);
  };

  const getConfidenceBadgeColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const renderMemberCard = (member, isPrimary = false) => {
    const profile = member.profile || {};
    const hasPhoto = !!profile.photoUrl;
    const hasEmail = !!profile.email;
    const hasBirthDate = !!profile.birthDate;
    const hasBirthPlace = !!profile.birthPlace;
    const hasRole = !!member.metadata?.customFields?.role;
    
    return (
      <div className={`border rounded-lg p-4 ${isPrimary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
        <div className="flex items-start gap-3">
          {hasPhoto ? (
            <img 
              src={profile.photoUrl} 
              alt={profile.displayName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
          )}
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {profile.displayName || 'Unnamed'}
              {isPrimary && (
                <NotionBadge color="blue" className="ml-2">Primary</NotionBadge>
              )}
            </h4>
            
            <div className="mt-1 space-y-1 text-sm text-gray-600">
              {hasEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </div>
              )}
              {hasBirthDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(profile.birthDate).toLocaleDateString()}
                </div>
              )}
              {hasBirthPlace && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {profile.birthPlace}
                </div>
              )}
              {hasRole && (
                <div className="text-xs">
                  Role: {member.metadata.customFields.role}
                </div>
              )}
            </div>
            
            {/* Data completeness indicators */}
            <div className="mt-2 flex gap-2">
              <div className={`w-2 h-2 rounded-full ${hasPhoto ? 'bg-green-500' : 'bg-gray-300'}`} title="Photo" />
              <div className={`w-2 h-2 rounded-full ${hasEmail ? 'bg-green-500' : 'bg-gray-300'}`} title="Email" />
              <div className={`w-2 h-2 rounded-full ${hasBirthDate ? 'bg-green-500' : 'bg-gray-300'}`} title="Birth Date" />
              <div className={`w-2 h-2 rounded-full ${hasBirthPlace ? 'bg-green-500' : 'bg-gray-300'}`} title="Birth Place" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-700">Finding duplicate family members...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" />
                Duplicate Family Members
              </h2>
              <p className="text-gray-600 mt-1">
                Found {duplicateGroups.length} potential duplicate{duplicateGroups.length !== 1 ? 's' : ''}
                {reconcileStats.merged > 0 && ` • Merged ${reconcileStats.merged} so far`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {duplicateGroups.length === 0 ? (
            <div className="p-12 text-center">
              <Check className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Duplicates Found
              </h3>
              <p className="text-gray-600">
                Your family tree is clean! No duplicate members were detected.
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {duplicateGroups.map(group => {
                const isExpanded = selectedGroup?.id === group.id;
                const bestMember = findBestMember(group.members);
                
                return (
                  <div key={group.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <button
                      onClick={() => setSelectedGroup(isExpanded ? null : group)}
                      className="w-full p-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div className="text-left">
                          <h3 className="font-medium text-gray-900">
                            {group.type === 'email' ? 'Email Match' : 'Name Match'}: "{group.key}"
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.members.length} potential duplicates
                          </p>
                        </div>
                        <NotionBadge color={getConfidenceBadgeColor(group.confidence)}>
                          {group.confidence} confidence
                        </NotionBadge>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`} />
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-sm text-yellow-800">
                            These members appear to be duplicates. Select the primary profile to keep, 
                            and the others will be merged into it. All relationships and data will be preserved.
                          </p>
                        </div>

                        {/* Member Cards */}
                        <div className="space-y-3">
                          {group.members.map(member => (
                            <div key={member.id} className="relative">
                              {renderMemberCard(member, member.id === bestMember.id)}
                              {member.id === bestMember.id && (
                                <div className="absolute -top-2 right-4">
                                  <NotionBadge color="green">Recommended</NotionBadge>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Merge Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                          <NotionButton
                            onClick={() => setSelectedGroup(null)}
                            variant="outline"
                          >
                            Cancel
                          </NotionButton>
                          <NotionButton
                            onClick={() => handleMerge(group, bestMember.id)}
                            variant="primary"
                            icon={<Merge className="h-4 w-4" />}
                            disabled={merging}
                          >
                            {merging ? 'Merging...' : `Merge into ${bestMember.profile.displayName}`}
                          </NotionButton>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {duplicateGroups.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Review each group carefully before merging. This action cannot be undone.
              </p>
              <NotionButton
                onClick={onReconcileComplete}
                variant="primary"
              >
                Done
              </NotionButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DuplicateReconciler;