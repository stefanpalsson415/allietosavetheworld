import React, { useState, useEffect } from 'react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';
import { NotionTabs, NotionButton, NotionBadge } from '../../common/NotionUI';
import { 
  Trees, Users, Clock, MapPin, BookOpen, Search, Plus, 
  MessageCircle, Sparkles, Camera, FileText, Heart, Star,
  Share2, Download, Settings, ChevronRight, Grid3x3, Filter
} from 'lucide-react';
import FamilyTreeService from '../../../services/FamilyTreeService';
import FamilyTreeSyncService from '../../../services/FamilyTreeSyncService';
import FamilyTreeVisualization from './familyTree/FamilyTreeVisualization';
import FamilyMemberProfile from './familyTree/FamilyMemberProfile';
import MemoryLane from './familyTree/MemoryLane';
import DiscoveryHub from './familyTree/DiscoveryHub';
import FamilyProjects from './familyTree/FamilyProjects';
import QuickAddMember from './familyTree/QuickAddMember';
import AddFamilyMemberFlow from './familyTree/AddFamilyMemberFlow';
import ImportUtility from './familyTree/ImportUtility';
import DuplicateReconciler from './familyTree/DuplicateReconciler';

console.log('FamilyTreeTab: Imports loaded', {
  FamilyTreeVisualization: !!FamilyTreeVisualization,
  FamilyMemberProfile: !!FamilyMemberProfile,
  MemoryLane: !!MemoryLane,
  DiscoveryHub: !!DiscoveryHub,
  FamilyProjects: !!FamilyProjects,
  QuickAddMember: !!QuickAddMember,
  ImportUtility: !!ImportUtility
});

const FamilyTreeTab = () => {
  console.log('FamilyTreeTab: Component rendering');
  
  // All hooks must be called at the top level, outside of any conditional blocks
  const { familyId, familyName, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const { openDrawerWithPrompt } = useChatDrawer();
  
  console.log('FamilyTreeTab: Initial data:', {
    familyId,
    familyName,
    familyMembersCount: familyMembers?.length || 0,
    familyMembers
  });
  
  const [activeView, setActiveView] = useState('tree');
  const [familyTreeData, setFamilyTreeData] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [treeStats, setTreeStats] = useState({
    totalMembers: 0,
    generations: 0,
    stories: 0,
    photos: 0
  });
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showAddMemberFlow, setShowAddMemberFlow] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState('classic'); // classic, graph, timeline, geographic, constellation
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDuplicateReconciler, setShowDuplicateReconciler] = useState(false);
  const [filterGeneration, setFilterGeneration] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  console.log('FamilyTreeTab: State initialized', {
    activeView,
    familyTreeData,
    selectedMember,
    loading,
    treeStats,
    showQuickAdd,
    showImport,
    viewMode,
    syncing
  });

  const loadFamilyTree = async () => {
    console.log('FamilyTreeTab: Starting to load family tree', familyId);
    try {
      setLoading(true);
      let treeData = await FamilyTreeService.getFamilyTree(familyId);
      console.log('FamilyTreeTab: Tree data loaded', treeData);
      
      // Initialize tree if it doesn't exist
      if (!treeData) {
        console.log('FamilyTreeTab: Initializing family tree for the first time');
        await FamilyTreeService.initializeFamilyTree(familyId, {
          uid: currentUser.uid || currentUser.email,
          displayName: currentUser.displayName || currentUser.name || currentUser.email
        });
        
        // Sync existing family members
        console.log('FamilyTreeTab: Syncing existing family members after initialization');
        await FamilyTreeSyncService.syncExistingFamilyMembers(familyId);
        
        treeData = await FamilyTreeService.getFamilyTree(familyId);
        console.log('FamilyTreeTab: Tree initialized and synced', treeData);
      } else if (treeData && (!treeData.members || treeData.members.length === 0)) {
        // Tree exists but has no members - sync existing family members
        console.log('FamilyTreeTab: Tree exists but has no members, syncing family members');
        console.log('FamilyTreeTab: Current family members from context:', familyMembers);
        
        await FamilyTreeSyncService.syncExistingFamilyMembers(familyId);
        
        // Reload tree data after sync
        treeData = await FamilyTreeService.getFamilyTree(familyId);
        console.log('FamilyTreeTab: Tree data after sync', treeData);
      }
      
      setFamilyTreeData(treeData || {});
      
      // Calculate stats - but only if we have tree data
      if (treeData) {
        try {
          const stats = await FamilyTreeService.getTreeStats(familyId);
          console.log('FamilyTreeTab: Stats loaded', stats);
          
          // If generations is 0 or seems too low, calculate it from the data
          if (treeData.members && treeData.members.length > 0 && (!stats.generations || stats.generations < 2)) {
            const { calculateGenerations, getGenerationStats } = await import('../../../utils/calculateGenerations');
            const calculatedGens = calculateGenerations(treeData.members, treeData.relationships || []);
            const genStats = getGenerationStats(treeData.members, calculatedGens);
            
            setTreeStats({
              ...stats,
              totalMembers: treeData.members.length,
              generations: genStats.totalGenerations,
              stories: stats.stories || 0,
              photos: stats.photos || 0
            });
          } else {
            setTreeStats(stats || {
              totalMembers: 0,
              generations: 0,
              stories: 0,
              photos: 0
            });
          }
        } catch (statsError) {
          console.error('FamilyTreeTab: Error loading stats:', statsError);
        }
      }
    } catch (error) {
      console.error('FamilyTreeTab: Error loading family tree:', error);
      // Set empty data so UI can render
      setFamilyTreeData({});
      setTreeStats({
        totalMembers: 0,
        generations: 0,
        stories: 0,
        photos: 0
      });
    } finally {
      console.log('FamilyTreeTab: Loading complete');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('FamilyTreeTab: Component mounted');
    console.log('FamilyTreeTab: useEffect triggered', { familyId, currentUser });
    console.log('FamilyTreeTab: Family members:', familyMembers);
    if (familyId && currentUser) {
      loadFamilyTree();
    } else {
      console.log('FamilyTreeTab: Missing familyId or currentUser', { 
        hasFamilyId: !!familyId, 
        hasUser: !!currentUser 
      });
      setLoading(false);
    }
  }, [familyId, currentUser]);

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    if (window.innerWidth < 768) {
      setActiveView('profile');
    }
  };

  const handleAskAllie = (member, customPrompt = null) => {
    let prompt = customPrompt;
    
    if (!prompt && member) {
      const name = member.profile?.displayName || member.displayName || 'this family member';
      const birthYear = member.profile?.birthDate ? new Date(member.profile.birthDate).getFullYear() : null;
      const birthPlace = member.profile?.birthPlace;
      const deathYear = member.profile?.deathDate ? new Date(member.profile.deathDate).getFullYear() : null;
      const occupation = member.profile?.occupation;
      
      // Build a detailed prompt with available information
      let detailsArray = [];
      if (birthYear && birthPlace) {
        detailsArray.push(`born ${birthYear} in ${birthPlace}`);
      } else if (birthYear) {
        detailsArray.push(`born ${birthYear}`);
      } else if (birthPlace) {
        detailsArray.push(`born in ${birthPlace}`);
      }
      
      if (deathYear) {
        detailsArray.push(`died ${deathYear}`);
      }
      
      if (occupation) {
        detailsArray.push(`worked as ${occupation}`);
      }
      
      const details = detailsArray.length > 0 ? ` (${detailsArray.join(', ')})` : '';
      
      prompt = `Please search the internet and research ${name}${details}. Find information about their life, achievements, family connections, and historical context. If they lived in a specific place or time period, include relevant historical events and context from that era. Look for genealogical records, newspaper archives, or other historical documents that might mention them.`;
    } else if (!prompt) {
      prompt = `Help me research our family history and find interesting connections or missing information in our family tree.`;
    }
    
    openDrawerWithPrompt(prompt, {
      context: 'familyTree',
      memberId: member?.id,
      treeId: familyTreeData?.id
    });
  };

  const handleAddMember = async (memberData) => {
    try {
      await FamilyTreeService.addFamilyMember(familyId, memberData);
      await loadFamilyTree();
      setShowQuickAdd(false);
    } catch (error) {
      console.error('Error adding family member:', error);
    }
  };

  const handleSyncExistingMembers = async () => {
    try {
      setSyncing(true);
      console.log('FamilyTreeTab: Manual sync triggered for familyId:', familyId);
      console.log('FamilyTreeTab: Current familyMembers from context:', familyMembers);
      
      // First, clear existing tree data to remove duplicates
      const treeId = `tree_${familyId}`;
      console.log('FamilyTreeTab: Clearing existing tree data to prevent duplicates...');
      await FamilyTreeService.clearFamilyTree(familyId);
      
      const syncResult = await FamilyTreeSyncService.syncExistingFamilyMembers(familyId);
      console.log('FamilyTreeTab: Sync result:', syncResult);
      
      await loadFamilyTree();
      console.log('FamilyTreeTab: Manual sync complete');
    } catch (error) {
      console.error('Error syncing family members:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleExportTree = () => {
    if (!familyTreeData) {
      console.log('No tree data to export');
      return;
    }

    // Create export data
    const exportData = {
      familyName: familyName || 'Family Tree',
      exportDate: new Date().toISOString(),
      members: familyTreeData.members || [],
      relationships: familyTreeData.relationships || [],
      stats: treeStats
    };

    // Convert to JSON
    const jsonStr = JSON.stringify(exportData, null, 2);
    
    // Create blob and download
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${familyName || 'family'}_tree_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('Family tree exported successfully');
  };

  const tabs = [
    { id: 'tree', label: 'Family Tree', icon: Trees },
    { id: 'profile', label: 'Story Studio', icon: BookOpen },
    { id: 'timeline', label: 'Memory Lane', icon: Clock },
    { id: 'discovery', label: 'Discovery Hub', icon: Search },
    { id: 'projects', label: 'Family Projects', icon: Heart }
  ];

  const viewModes = [
    { id: 'classic', label: 'Classic Tree', icon: Trees },
    { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
    { id: 'timeline', label: 'Timeline River', icon: Clock },
    { id: 'geographic', label: 'Geographic Journey', icon: MapPin },
    { id: 'constellation', label: 'Family Constellation', icon: Star },
    { id: 'table', label: 'Table View', icon: Grid3x3 }
  ];

  console.log('FamilyTreeTab: Rendering, loading:', loading, 'familyId:', familyId);

  if (loading) {
    console.log('FamilyTreeTab: Showing loading state');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your family story...</p>
        </div>
      </div>
    );
  }

  // Show message if no familyId
  if (!familyId) {
    console.log('FamilyTreeTab: No family ID');
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Trees className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Selected</h3>
          <p className="text-gray-600">Please select a family to view the family tree.</p>
        </div>
      </div>
    );
  }
  
  console.log('FamilyTreeTab: Rendering main content');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trees className="h-7 w-7 text-green-600" />
              Family Tree
            </h2>
            <p className="text-gray-600 mt-1">
              Build your family's living story together
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <NotionButton
              onClick={() => setShowAddMemberFlow(true)}
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
            >
              Add Family Member
            </NotionButton>
            
            <NotionButton
              onClick={() => handleAskAllie(null)}
              variant="outline"
              icon={<MessageCircle className="h-4 w-4" />}
            >
              Ask Allie
            </NotionButton>
            
            <NotionButton
              onClick={handleSyncExistingMembers}
              variant="subtle"
              icon={<Users className="h-4 w-4" />}
              disabled={syncing}
            >
              {syncing ? 'Syncing...' : 'Sync Family'}
            </NotionButton>
            
            <NotionButton
              onClick={() => setShowImport(true)}
              variant="subtle"
              icon={<FileText className="h-4 w-4" />}
            >
              Import
            </NotionButton>
            
            <NotionButton
              onClick={handleExportTree}
              variant="subtle"
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </NotionButton>
            
            {treeStats.totalMembers > 5 && (
              <NotionButton
                onClick={() => setShowDuplicateReconciler(true)}
                variant="subtle"
                icon={<Users className="h-4 w-4" />}
              >
                Find Duplicates
              </NotionButton>
            )}
          </div>
        </div>

        {/* Search Box for Large Trees */}
        {treeStats.totalMembers > 20 && (
          <div className="mt-6">
            <div className="flex gap-3 items-start">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search family members..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (e.target.value) {
                      let results = familyTreeData.members;
                      
                      // Apply text search
                      results = results.filter(m => 
                        m.profile.displayName.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        m.profile.firstName?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        m.profile.lastName?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        m.profile.occupation?.toLowerCase().includes(e.target.value.toLowerCase()) ||
                        m.profile.birthPlace?.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      
                      // Apply filters
                      if (filterGeneration !== 'all') {
                        results = results.filter(m => 
                          (m.metadata?.generation || 0).toString() === filterGeneration
                        );
                      }
                      if (filterGender !== 'all') {
                        results = results.filter(m => 
                          m.profile.gender === filterGender
                        );
                      }
                      
                      setSearchResults(results.slice(0, 20));
                    } else {
                      setSearchResults([]);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Advanced Filters */}
              <NotionButton
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                variant="outline"
                icon={<Settings className="h-4 w-4" />}
              >
                Filters
              </NotionButton>
            </div>
            
            {/* Advanced Search Panel */}
            {showAdvancedSearch && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Generation</label>
                    <select
                      value={filterGeneration}
                      onChange={(e) => setFilterGeneration(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Generations</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i} value={i}>Generation {i}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Genders</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Quick Actions</label>
                    <div className="flex gap-2">
                      <NotionButton
                        onClick={() => {
                          const recentMembers = familyTreeData.members
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .slice(0, 10);
                          setSearchResults(recentMembers);
                        }}
                        variant="subtle"
                        size="sm"
                      >
                        Recently Added
                      </NotionButton>
                      <NotionButton
                        onClick={() => {
                          const incompleteMembers = familyTreeData.members
                            .filter(m => !m.profile.birthDate || !m.profile.birthPlace)
                            .slice(0, 20);
                          setSearchResults(incompleteMembers);
                        }}
                        variant="subtle"
                        size="sm"
                      >
                        Incomplete Profiles
                      </NotionButton>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="relative mt-2">
                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {searchResults.map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedMember(member);
                        setSearchTerm('');
                        setSearchResults([]);
                        if (viewMode === 'classic' && familyTreeData.members.length > 50) {
                          // Switch to knowledge graph for better navigation
                          setViewMode('graph');
                        }
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      {member.profile.photoUrl ? (
                        <img src={member.profile.photoUrl} className="w-8 h-8 rounded-full" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                          {member.profile.displayName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{member.profile.displayName}</div>
                        <div className="text-xs text-gray-500">
                          Generation {member.metadata?.generation || 0}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Members</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{treeStats.totalMembers}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">Generations</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{treeStats.generations}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">Stories</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{treeStats.stories}</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Camera className="h-4 w-4" />
              <span className="text-sm">Photos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{treeStats.photos}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <NotionTabs
          tabs={tabs}
          activeTab={activeView}
          onChange={setActiveView}
        />
      </div>

      {/* View Mode Selector (for Tree View) */}
      {activeView === 'tree' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Grid3x3 className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">View Mode</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {viewModes.map(mode => (
              <NotionButton
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                variant={viewMode === mode.id ? 'primary' : 'outline'}
                size="sm"
                icon={<mode.icon className="h-3 w-3" />}
              >
                {mode.label}
              </NotionButton>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeView === 'tree' && familyTreeData && familyTreeData.members && familyTreeData.members.length > 0 && (
          <FamilyTreeVisualization
            treeData={familyTreeData}
            viewMode={viewMode}
            onMemberSelect={handleMemberSelect}
            selectedMember={selectedMember}
            onAskAllie={handleAskAllie}
            onViewProfile={(member) => {
              setSelectedMember(member);
              setActiveView('profile');
            }}
          />
        )}
        
        {activeView === 'tree' && (!familyTreeData || !familyTreeData.members || familyTreeData.members.length === 0) && (
          <div className="p-12 text-center">
            <Trees className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Family Tree</h3>
            <p className="text-gray-600 mb-6">Add your first family member to begin your journey</p>
            <div className="flex gap-3 justify-center">
              <NotionButton
                onClick={() => setShowQuickAdd(true)}
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
              >
                Add First Member
              </NotionButton>
              
              <NotionButton
                onClick={handleSyncExistingMembers}
                variant="outline"
                icon={<Users className="h-4 w-4" />}
                disabled={syncing}
              >
                {syncing ? 'Syncing...' : 'Import Existing Family'}
              </NotionButton>
            </div>
          </div>
        )}
        
        {activeView === 'profile' && familyId && (
          <FamilyMemberProfile
            member={selectedMember}
            familyId={familyId}
            onAskAllie={handleAskAllie}
            onClose={() => setSelectedMember(null)}
          />
        )}
        
        {activeView === 'timeline' && familyId && (
          <MemoryLane
            familyId={familyId}
            treeData={familyTreeData}
            onMemberSelect={handleMemberSelect}
            onAskAllie={handleAskAllie}
          />
        )}
        
        {activeView === 'discovery' && familyId && (
          <DiscoveryHub
            familyId={familyId}
            treeData={familyTreeData}
            onMemberSelect={handleMemberSelect}
            onAskAllie={handleAskAllie}
          />
        )}
        
        {activeView === 'projects' && familyId && (
          <FamilyProjects
            familyId={familyId}
            currentUser={currentUser}
            onAskAllie={handleAskAllie}
          />
        )}
      </div>

      {/* Add Member Flow Modal - New Interactive Experience */}
      {showAddMemberFlow && (
        <AddFamilyMemberFlow
          isOpen={showAddMemberFlow}
          onClose={() => setShowAddMemberFlow(false)}
          existingMembers={familyTreeData?.members || []}
          onMemberAdded={async (newMember) => {
            await loadFamilyTree();
            setShowAddMemberFlow(false);
          }}
        />
      )}
      
      {/* Quick Add Modal - Legacy */}
      {showQuickAdd && (
        <QuickAddMember
          isOpen={showQuickAdd}
          onClose={() => setShowQuickAdd(false)}
          onAdd={handleAddMember}
          existingMembers={familyTreeData?.members || []}
        />
      )}

      {/* Import Modal */}
      {showImport && familyId && (
        <ImportUtility
          familyId={familyId}
          onImportComplete={() => {
            setShowImport(false);
            loadFamilyTree();
          }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Duplicate Reconciler Modal */}
      {showDuplicateReconciler && (
        <DuplicateReconciler
          familyId={familyId}
          treeData={familyTreeData}
          onClose={() => setShowDuplicateReconciler(false)}
          onReconcileComplete={() => {
            setShowDuplicateReconciler(false);
            loadFamilyTree();
          }}
        />
      )}

      {/* Floating Allie Hint */}
      {!selectedMember && activeView === 'tree' && treeStats.totalMembers === 0 && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-lg shadow-lg p-4 max-w-sm animate-pulse">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Need help getting started?</p>
              <p className="text-xs mt-1 opacity-90">
                Ask Allie to help you add your first family members or import from other sources!
              </p>
              <button
                onClick={() => handleAskAllie(null)}
                className="text-xs underline mt-2 hover:no-underline"
              >
                Ask Allie now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyTreeTab;