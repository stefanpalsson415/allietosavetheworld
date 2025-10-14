import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import BucksService from '../../../services/BucksService';
import ChoreService from '../../../services/ChoreService';
import RewardService from '../../../services/RewardService';
import { db } from '../../../services/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { 
  Tabs, 
  Check, 
  Gift, 
  DollarSign, 
  UserPlus, 
  Edit3, 
  Trash2, 
  ArrowUpCircle,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Calendar,
  Star,
  CheckCircle,
  Database,
  XCircle,
  Info,
  CheckSquare,
  Square,
  Camera,
  Minus,
  Heart,
  User,
  Shirt,
  Package,
  ChevronRight,
  TrendingUp,
  ShoppingBag
} from 'lucide-react';
import { useChore } from '../../../contexts/ChoreContext';
import { useFamily } from '../../../contexts/FamilyContext';
import UserAvatar from '../../common/UserAvatar';
import defaultChores from '../../../data/defaultChores';
import defaultRewards from '../../../data/defaultRewards';
import SpotifyChoreCard from '../../chore/SpotifyChoreCard';
import SpotifyRewardCard, { getCategoryColor } from '../../reward/SpotifyRewardCard';
import DatabaseDebugger from '../../../utils/DatabaseDebugger';
import UnifiedChoreEditor from '../../chore/UnifiedChoreEditor';
import UnifiedRewardEditor from '../../reward/UnifiedRewardEditor';

const KidsSectionAdminTab = () => {
  const { 
    selectedUser, 
    familyMembers, 
    familyId 
  } = useFamily();
  const navigate = useNavigate();
  
  const {
    choreTemplates,
    loadChoreTemplates,
    pendingApprovals,
    rewardTemplates,
    loadRewardTemplates,
    pendingRewardApprovals,
    createChoreTemplate,
    createRewardTemplate,
    approveChore,
    rejectChore,
    approveReward,
    rejectReward,
    adjustBucksBalance
  } = useChore();
  
  // State
  const [activeTab, setActiveTab] = useState('chores');
  const [choreFilter, setChoreFilter] = useState('all');
  const [rewardFilter, setRewardFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [showEditRewardModal, setShowEditRewardModal] = useState(false);
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
  
  // Unified Chore Editor state
  const [showChoreEditor, setShowChoreEditor] = useState(false);
  const [selectedChoreIds, setSelectedChoreIds] = useState([]);
  
  // Unified Reward Editor state
  const [showRewardEditor, setShowRewardEditor] = useState(false);
  const [selectedRewardIds, setSelectedRewardIds] = useState([]);
  
  // Other states
  const [rewardToEdit, setRewardToEdit] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingChoreId, setLoadingChoreId] = useState(null);
  const [loadingChoreAction, setLoadingChoreAction] = useState(null);
  const [loadingRewardId, setLoadingRewardId] = useState(null);
  const [loadingRewardAction, setLoadingRewardAction] = useState(null);
  
  // Index error handling
  const [hasIndexError, setHasIndexError] = useState(false);
  const [showIndexBanner, setShowIndexBanner] = useState(true);
  
  // Import state
  const [isImportingChores, setIsImportingChores] = useState(false);
  const [isImportingRewards, setIsImportingRewards] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [importProgress, setImportProgress] = useState({ total: 0, completed: 0 });
  
  // Child profiles state
  const [childProfiles, setChildProfiles] = useState({});
  const [editingChildProfile, setEditingChildProfile] = useState(null);
  const [profileFormData, setProfileFormData] = useState({});
  const [giftSummaries, setGiftSummaries] = useState({});
  const [wardrobeSummaries, setWardrobeSummaries] = useState({});
  
  // New reward form data (chore data is handled in ChoreManagementPanel)
  
  const [newRewardData, setNewRewardData] = useState({
    title: '',
    description: '',
    price: 50,
    category: 'items',
    isActive: true,
    imageUrl: null
  });
  
  // File input refs for image uploads
  const choreImageInputRef = useRef(null);
  const rewardImageInputRef = useRef(null);
  
  // Note: Chore image handling is now done in ChoreManagementPanel
  
  // Handle image selection for rewards
  const handleRewardImageChange = (e, isEdit = false) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target && event.target.result;
        if (isEdit) {
          setRewardToEdit(prev => ({ ...prev, imageUrl }));
        } else {
          setNewRewardData(prev => ({ ...prev, imageUrl }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Child balances
  const [childBalances, setChildBalances] = useState({});
  const [adjustBalanceChildId, setAdjustBalanceChildId] = useState(null);
  const [adjustBalanceAmount, setAdjustBalanceAmount] = useState(0);
  const [adjustBalanceReason, setAdjustBalanceReason] = useState('');
  const [showAdjustBalanceModal, setShowAdjustBalanceModal] = useState(false);
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  // New state for completed chores and reward photos
  const [completedChores, setCompletedChores] = useState([]);
  const [allRewardPhotos, setAllRewardPhotos] = useState([]);
  const [showEventScheduler, setShowEventScheduler] = useState(false);
  const [schedulingReward, setSchedulingReward] = useState(null);
  
  // Get child family members only
  const childrenOnly = familyMembers?.filter(member => member.role === 'child') || [];
  
  // Load templates and pending approvals
  useEffect(() => {
    if (familyId) {
      loadChoreTemplates();
      loadRewardTemplates();
    }
  }, [familyId, loadChoreTemplates, loadRewardTemplates]);
  
  // Select first child by default if none selected
  useEffect(() => {
    if (childrenOnly.length > 0 && !selectedChildId) {
      setSelectedChildId(childrenOnly[0].id);
    }
  }, [childrenOnly, selectedChildId]);
  
  // Load child balances
  useEffect(() => {
    const loadBalances = async () => {
      try {
        if (familyId && childrenOnly.length > 0) {
          const balances = {};
          
          // Get balance for each child
          for (const child of childrenOnly) {
            try {
              const balance = await BucksService.getBalance(child.id);
              balances[child.id] = balance.currentBalance || 0;
            } catch (error) {
              console.error(`Error getting balance for child ${child.id}:`, error);
              balances[child.id] = 0;
            }
          }
          
          setChildBalances(balances);
        }
      } catch (error) {
        console.error("Error loading child balances:", error);
      }
    };
    
    loadBalances();
  }, [familyId, childrenOnly]);
  
  // Load completed chores
  const loadCompletedChores = async () => {
    try {
      if (!familyId) return;
      
      // Get today's completed chores for all children
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const chores = await ChoreService.getCompletedChoresForFamily(familyId, today);
      setCompletedChores(chores);
    } catch (error) {
      console.error("Error loading completed chores:", error);
    }
  };
  
  // Load reward photos
  const loadRewardPhotos = async () => {
    try {
      if (!familyId) return;
      
      // Get all reward instances with photos
      const photos = await RewardService.getRewardPhotosForFamily(familyId);
      setAllRewardPhotos(photos);
    } catch (error) {
      console.error("Error loading reward photos:", error);
    }
  };
  
  // Load data when tab changes or family changes
  useEffect(() => {
    if (familyId && activeTab === 'approvals') {
      loadCompletedChores();
      loadRewardPhotos();
    }
  }, [familyId, activeTab]);
  
  // Load child profiles and summaries when on profiles tab
  useEffect(() => {
    if (familyId && activeTab === 'profiles') {
      const loadProfilesAndSummaries = async () => {
        try {
          const profiles = {};
          const giftSums = {};
          const wardrobeSums = {};
          
          for (const child of childrenOnly) {
            // Load profile
            const profileRef = doc(db, 'families', familyId, 'childProfiles', child.id);
            const profileDoc = await getDoc(profileRef);
            if (profileDoc.exists()) {
              profiles[child.id] = profileDoc.data();
            }
            
            // Load gift summary
            try {
              const giftIdeasRef = collection(db, 'families', familyId, 'members', child.id, 'giftIdeas');
              const giftSnapshot = await getDocs(giftIdeasRef);
              const interests = await getDocs(collection(db, 'families', familyId, 'childInterests'));
              const childInterest = interests.docs.find(doc => doc.data().childId === child.id);
              
              giftSums[child.id] = {
                topWishes: giftSnapshot.size,
                interests: childInterest?.data()?.loves?.length || 0,
                topCategories: childInterest?.data()?.loves?.map(l => l.name) || []
              };
            } catch (e) {
              console.log('No gift data for', child.name);
            }
            
            // Load wardrobe summary
            try {
              const wardrobeRef = collection(db, 'families', familyId, 'wardrobes', child.id, 'items');
              const wardrobeSnapshot = await getDocs(wardrobeRef);
              const items = wardrobeSnapshot.docs.map(doc => doc.data());
              
              wardrobeSums[child.id] = {
                totalItems: items.length,
                nearlyOutgrown: items.filter(i => i.growthProgress > 70).length,
                needsSoon: items.filter(i => i.growthProgress > 80).map(i => i.type).filter((v, i, a) => a.indexOf(v) === i)
              };
            } catch (e) {
              console.log('No wardrobe data for', child.name);
            }
          }
          
          setChildProfiles(profiles);
          setGiftSummaries(giftSums);
          setWardrobeSummaries(wardrobeSums);
        } catch (error) {
          console.error('Error loading profiles and summaries:', error);
        }
      };
      loadProfilesAndSummaries();
    }
  }, [familyId, activeTab, childrenOnly]);
  
  // Handle editing child profile
  useEffect(() => {
    if (editingChildProfile && childProfiles[editingChildProfile]) {
      setProfileFormData(childProfiles[editingChildProfile]);
    }
  }, [editingChildProfile, childProfiles]);
  
  // Function to detect Firestore index errors in caught exceptions
  const detectIndexError = (error) => {
    if (!error) return false;
    
    // Common Firestore missing index error patterns
    const indexErrorPatterns = [
      /no index defined for this query/i,
      /missing index/i,
      /requires an index/i,
      /please create an index/i,
      /index.*not configured/i,
      /failed to find a matching index/i
    ];
    
    // Check error message against patterns
    if (error.message) {
      return indexErrorPatterns.some(pattern => pattern.test(error.message));
    }
    
    // Handle error as string
    if (typeof error === 'string') {
      return indexErrorPatterns.some(pattern => pattern.test(error));
    }
    
    return false;
  };

  // Function to check if an item is a likely duplicate
  const isLikelyDuplicate = (existingItems, newItem) => {
    if (!existingItems || existingItems.length === 0) return false;
    
    return existingItems.some(existing => {
      // For chores, consider title AND timeOfDay together
      // This way "Brush teeth - morning" and "Brush teeth - evening" are different
      if (newItem.timeOfDay && existing.timeOfDay) {
        return existing.title === newItem.title && existing.timeOfDay === newItem.timeOfDay;
      }
      
      // For rewards, consider title AND category together
      if (newItem.category && existing.category) {
        return existing.title === newItem.title && existing.category === newItem.category;
      }
      
      // Default case - just compare titles
      return existing.title === newItem.title;
    });
  };
  
  // Import defaults action
  const handleImportDefaults = async (type) => {
    try {
      // Reset states
      setImportError(null);
      setImportSuccess(null);
      setImportProgress({ total: 0, completed: 0 });
      // Reset index error if previously shown
      setHasIndexError(false);
      
      console.log(`[DEBUG] Starting import of ${type}`);
      console.log(`[DEBUG] Family ID:`, familyId);
      
      // Check database structure first
      console.log(`[DEBUG] Checking database structure before import`);
      const collectionsToCheck = ['choreTemplates', 'rewardTemplates'];
      for (const collectionName of collectionsToCheck) {
        const collectionStatus = await DatabaseDebugger.checkCollection(collectionName);
        console.log(`[DEBUG] Collection ${collectionName} status:`, collectionStatus);
      }
      
      // Check existing templates for this family
      const existingTemplates = await DatabaseDebugger.checkFamilyTemplates(familyId);
      console.log(`[DEBUG] Existing templates for family ${familyId}:`, existingTemplates);
      
      if (type === 'chores') {
        console.log(`[DEBUG] Setting isImportingChores to true`);
        setIsImportingChores(true);
        setImportProgress({ total: defaultChores.length, completed: 0 });
      } else if (type === 'rewards') {
        console.log(`[DEBUG] Setting isImportingRewards to true`);
        setIsImportingRewards(true);
        setImportProgress({ total: defaultRewards.length, completed: 0 });
      }
      
      if (type === 'chores') {
        console.log(`[DEBUG] Starting import of ${defaultChores.length} chores`);

        // Import default chores one by one to track progress
        const results = [];
        let completedCount = 0;
        
        // First, fetch existing chore templates to check for duplicates
        const existingChores = choreTemplates || [];
        
        // Filter out chores that already exist
        const filteredChores = defaultChores.filter(chore => 
          !isLikelyDuplicate(existingChores, chore)
        );
        
        // Update progress total to reflect only non-duplicate chores
        setImportProgress({ total: filteredChores.length, completed: 0 });
        
        if (filteredChores.length === 0) {
          console.log(`[DEBUG] All chores already exist - skipping import`);
          setImportSuccess(`All chores already exist in your templates - nothing to import`);
          setIsImportingChores(false);
          return;
        }
        
        for (let i = 0; i < filteredChores.length; i++) {
          const chore = filteredChores[i];
          console.log(`[DEBUG] Importing chore ${i + 1}/${filteredChores.length}: ${chore.title}`);
          
          try {
            // Map rewardValue to bucksReward for consistent naming
            const choreData = {
              ...chore,
              isActive: true,
              familyId,
              bucksReward: chore.rewardValue // Ensure both field names are available
            };
            
            console.log(`[DEBUG] Chore data for ${chore.title}:`, choreData);
            const templateId = await createChoreTemplate(choreData, null);
            results.push({ status: 'fulfilled', value: templateId });
            completedCount++;
            
            // Update progress
            setImportProgress({ total: defaultChores.length, completed: completedCount });
          } catch (error) {
            console.error(`[DEBUG] Error importing chore ${chore.title}:`, error);
            results.push({ status: 'rejected', reason: error });
          }
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Log results
        console.log(`[DEBUG] Chore import results:`, results);
        
        // Log any specific errors
        const failedImports = results.filter(result => result.status === 'rejected');
        if (failedImports.length > 0) {
          console.error(`Failed to import ${failedImports.length} out of ${defaultChores.length} chores`);
          failedImports.forEach((result, index) => {
            console.error(`Import error for chore ${index}:`, result.reason);
          });
        }
        
        const successfulImports = results.filter(result => result.status === 'fulfilled');
        console.log(`[DEBUG] Successfully imported ${successfulImports.length} out of ${defaultChores.length} chores`);
        
        // Set success message
        setImportSuccess(`Successfully imported ${successfulImports.length} out of ${filteredChores.length} chores (skipped ${defaultChores.length - filteredChores.length} duplicates)`);
        
        // Reload templates regardless of individual failures
        console.log(`[DEBUG] Reloading chore templates`);
        await loadChoreTemplates();
      } else if (type === 'rewards') {
        console.log(`[DEBUG] Starting import of ${defaultRewards.length} rewards`);
        
        // Import default rewards one by one to track progress
        const results = [];
        let completedCount = 0;
        
        // First, fetch existing reward templates to check for duplicates
        const existingRewards = rewardTemplates || [];
        
        // Filter out rewards that already exist
        const filteredRewards = defaultRewards.filter(reward => 
          !isLikelyDuplicate(existingRewards, reward)
        );
        
        // Update progress total to reflect only non-duplicate rewards
        setImportProgress({ total: filteredRewards.length, completed: 0 });
        
        if (filteredRewards.length === 0) {
          console.log(`[DEBUG] All rewards already exist - skipping import`);
          setImportSuccess(`All rewards already exist in your templates - nothing to import`);
          setIsImportingRewards(false);
          return;
        }
        
        for (let i = 0; i < filteredRewards.length; i++) {
          const reward = filteredRewards[i];
          console.log(`[DEBUG] Importing reward ${i + 1}/${filteredRewards.length}: ${reward.title}`);
          
          try {
            // Map price to bucksPrice for consistent naming
            const rewardData = {
              ...reward,
              isActive: true,
              familyId,
              bucksPrice: reward.price // Ensure both field names are available
            };
            
            console.log(`[DEBUG] Reward data for ${reward.title}:`, rewardData);
            const templateId = await createRewardTemplate(rewardData, null);
            results.push({ status: 'fulfilled', value: templateId });
            completedCount++;
            
            // Update progress
            setImportProgress({ total: defaultRewards.length, completed: completedCount });
          } catch (error) {
            console.error(`[DEBUG] Error importing reward ${reward.title}:`, error);
            results.push({ status: 'rejected', reason: error });
          }
          
          // Add a small delay to avoid overwhelming the database
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Log results
        console.log(`[DEBUG] Reward import results:`, results);
        
        // Log any specific errors
        const failedImports = results.filter(result => result.status === 'rejected');
        if (failedImports.length > 0) {
          console.error(`Failed to import ${failedImports.length} out of ${defaultRewards.length} rewards`);
          failedImports.forEach((result, index) => {
            console.error(`Import error for reward ${index}:`, result.reason);
          });
        }
        
        const successfulImports = results.filter(result => result.status === 'fulfilled');
        console.log(`[DEBUG] Successfully imported ${successfulImports.length} out of ${defaultRewards.length} rewards`);
        
        // Set success message
        setImportSuccess(`Successfully imported ${successfulImports.length} out of ${filteredRewards.length} rewards (skipped ${defaultRewards.length - filteredRewards.length} duplicates)`);
        
        // Reload templates regardless of individual failures
        console.log(`[DEBUG] Reloading reward templates`);
        await loadRewardTemplates();
      }
      
      // Check templates after import
      console.log(`[DEBUG] Checking templates after import`);
      const templatesAfterImport = await DatabaseDebugger.checkFamilyTemplates(familyId);
      console.log(`[DEBUG] Templates after import for family ${familyId}:`, templatesAfterImport);
    } catch (error) {
      console.error(`Error during ${type} import:`, error);
      
      // Check if this is an index error
      if (detectIndexError(error)) {
        console.log("Detected Firestore index error:", error);
        setHasIndexError(true);
        setShowIndexBanner(true);
        setImportError("Firestore index error detected. Please see the information banner above for details.");
      } else {
        setImportError(error.message || `Failed to import ${type}`);
      }
      
      setImportSuccess(null);
    } finally {
      if (type === 'chores') {
        console.log(`[DEBUG] Setting isImportingChores to false`);
        setIsImportingChores(false);
      } else if (type === 'rewards') {
        console.log(`[DEBUG] Setting isImportingRewards to false`);
        setIsImportingRewards(false);
      }
      
      // Reset progress after a delay to show the final state
      setTimeout(() => {
        setImportProgress({ total: 0, completed: 0 });
      }, 3000);
    }
  };
  
  // Filtered templates
  const getFilteredChores = () => {
    let filtered = [...(choreTemplates || [])];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(chore => 
        chore.title.toLowerCase().includes(query) || 
        chore.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (choreFilter !== 'all') {
      if (choreFilter === 'active') {
        filtered = filtered.filter(chore => chore.isActive);
      } else if (choreFilter === 'inactive') {
        filtered = filtered.filter(chore => !chore.isActive);
      } else if (choreFilter === 'morning' || 
                 choreFilter === 'afternoon' || 
                 choreFilter === 'evening' || 
                 choreFilter === 'anytime') {
        filtered = filtered.filter(chore => chore.timeOfDay === choreFilter);
      }
    }
    
    // Sort by time of day in specific order: morning, afternoon, evening, anytime, unassigned
    filtered.sort((a, b) => {
      const timeOfDayOrder = {
        'morning': 1,
        'afternoon': 2,
        'evening': 3,
        'anytime': 4,
        undefined: 5 // For unassigned time of day
      };
      
      // Get order value or 5 if not defined (unassigned)
      const aOrder = timeOfDayOrder[a.timeOfDay] || 5;
      const bOrder = timeOfDayOrder[b.timeOfDay] || 5;
      
      return aOrder - bOrder;
    });
    
    return filtered;
  };
  
  const getFilteredRewards = () => {
    let filtered = [...(rewardTemplates || [])];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(reward => 
        reward.title.toLowerCase().includes(query) || 
        reward.description.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (rewardFilter !== 'all') {
      if (rewardFilter === 'active') {
        filtered = filtered.filter(reward => reward.isActive);
      } else if (rewardFilter === 'inactive') {
        filtered = filtered.filter(reward => !reward.isActive);
      } else if (['items', 'activities', 'privileges', 'special events'].includes(rewardFilter)) {
        filtered = filtered.filter(reward => reward.category === rewardFilter);
      }
    }
    
    return filtered;
  };
  
  // Note: Chore saving is now handled in ChoreManagementPanel
  
  // Save edited reward
  const handleSaveReward = async (reward) => {
    try {
      // Update existing reward or create new one
      if (rewardToEdit) {
        // Update reward using RewardService
        await RewardService.updateRewardTemplate(rewardToEdit.id, {
          title: reward.title,
          description: reward.description,
          bucksPrice: reward.price,
          category: reward.category,
          isActive: reward.isActive,
          imageUrl: reward.imageUrl,
          updatedAt: new Date()
        }, null);
      } else {
        // Pass familyId as part of the template data
        await createRewardTemplate({
          ...reward,
          familyId,
          imageUrl: reward.imageUrl,
          availableToIds: reward.availableToIds || []
        }, null);
      }
      
      // Close modal and reset form
      setShowAddRewardModal(false);
      setShowEditRewardModal(false);
      setRewardToEdit(null);
      setNewRewardData({
        title: '',
        description: '',
        price: 50,
        category: 'items',
        isActive: true,
        imageUrl: null,
        availableToIds: []
      });
      
      // Reload templates
      loadRewardTemplates();
    } catch (error) {
      console.error("Error saving reward:", error);
      
      // Check for Firestore index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
        // You can also show a more specific error in the UI if needed
      }
    }
  };
  
  // Handle chore selection for bulk editing
  const toggleChoreSelection = (choreId) => {
    setSelectedChoreIds(prev => 
      prev.includes(choreId) 
        ? prev.filter(id => id !== choreId)
        : [...prev, choreId]
    );
  };
  
  const selectAllChores = () => {
    const allChoreIds = getFilteredChores().map(c => c.id);
    setSelectedChoreIds(allChoreIds);
  };
  
  const clearSelection = () => {
    setSelectedChoreIds([]);
  };
  
  // Handle reward selection for bulk editing
  const toggleRewardSelection = (rewardId) => {
    setSelectedRewardIds(prev => 
      prev.includes(rewardId) 
        ? prev.filter(id => id !== rewardId)
        : [...prev, rewardId]
    );
  };
  
  const selectAllRewards = () => {
    const allRewardIds = getFilteredRewards().map(r => r.id);
    setSelectedRewardIds(allRewardIds);
  };
  
  const clearRewardSelection = () => {
    setSelectedRewardIds([]);
  };
  
  // Handle adjusting balance
  const handleAdjustBalance = async () => {
    if (!adjustBalanceChildId || !adjustBalanceAmount) return;
    
    try {
      await adjustBucksBalance(
        adjustBalanceChildId,
        Number(adjustBalanceAmount),
        adjustBalanceReason || 'Manual adjustment',
        selectedUser.id
      );
      
      // Close modal and reset form
      setShowAdjustBalanceModal(false);
      setAdjustBalanceChildId(null);
      setAdjustBalanceAmount(0);
      setAdjustBalanceReason('');
      
      // Update the balance for the adjusted child
      try {
        const balance = await BucksService.getBalance(adjustBalanceChildId);
        setChildBalances(prev => ({
          ...prev,
          [adjustBalanceChildId]: balance.currentBalance || 0
        }));
      } catch (error) {
        console.error("Error refreshing balance after adjustment:", error);
        
        // Check for index errors
        if (detectIndexError(error)) {
          setHasIndexError(true);
          setShowIndexBanner(true);
        }
      }
    } catch (error) {
      console.error("Error adjusting balance:", error);
      
      // Check for index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
      }
    }
  };
  
  // Function to toggle chore active status
  const toggleChoreActive = async (choreId, isCurrentlyActive) => {
    setLoadingChoreId(choreId);
    setLoadingChoreAction('active');
    
    try {
      // Update the chore template's active status
      await ChoreService.updateChoreTemplate(choreId, {
        isActive: !isCurrentlyActive
      });
      
      // If we're activating the chore, also create schedules for assigned children
      if (!isCurrentlyActive) {
        const choreTemplate = await ChoreService.getChoreTemplate(choreId);
        
        // Get assigned children
        const assignedToIds = choreTemplate.assignedToIds || [];
        
        // Only proceed if there are assigned children
        if (assignedToIds.length > 0) {
          // Get chore details to create appropriate schedule
          const timeOfDay = choreTemplate.timeOfDay || 'anytime';
          
          // Determine the frequency based on the template's recurrence setting
          let frequency = 'daily'; // Default
          let daysOfWeek = [];
          
          if (choreTemplate.recurrence === 'weekly') {
            frequency = 'weekly';
            // Set to Monday by default for weekly recurrence
            daysOfWeek = [1]; // 1 = Monday
          } else if (choreTemplate.recurrence === 'weekdays') {
            frequency = 'weekly';
            // Mon-Fri
            daysOfWeek = [1, 2, 3, 4, 5];
          } else if (choreTemplate.recurrence === 'asNeeded') {
            // For as-needed chores, we'll still create a daily schedule
            // but they won't generate automatically every day
            frequency = 'daily';
          }
          
          // Create schedules only for assigned children
          for (const childId of assignedToIds) {
            try {
              // Find child data to log proper name
              const childData = childrenOnly.find(child => child.id === childId) || { name: 'Child' };
              
              // Create a schedule for this chore for this child
              await ChoreService.createChoreSchedule(
                familyId,
                choreId,
                childId,
                {
                  type: 'repeating',
                  frequency: frequency,
                  daysOfWeek: daysOfWeek,
                  timeOfDay: timeOfDay
                }
              );
              console.log(`Created ${frequency} schedule for chore ${choreId} for ${childData.name}`);
            } catch (scheduleError) {
              console.error(`Error creating schedule for child ${childId}:`, scheduleError);
            }
          }
        } else {
          console.log(`Chore ${choreId} is now active but not assigned to any children`);
        }
        
        // Generate chore instances for today to make them immediately visible
        try {
          await ChoreService.generateChoreInstances(familyId);
          console.log("Generated chore instances for today");
        } catch (instanceError) {
          console.error("Error generating chore instances:", instanceError);
        }
      }
      
      // Reload templates
      loadChoreTemplates();
    } catch (error) {
      console.error("Error toggling chore active status:", error);
      
      // Check for index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
      }
    } finally {
      setLoadingChoreId(null);
      setLoadingChoreAction(null);
    }
  };
  
  // Function to delete a chore template
  const deleteChoreTemplate = async (choreId) => {
    try {
      // Archive the chore template (soft delete)
      await ChoreService.archiveChoreTemplate(choreId);
      
      // Reload templates
      loadChoreTemplates();
    } catch (error) {
      console.error("Error deleting chore template:", error);
      
      // Check for index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
      }
    }
  };
  
  // Function to toggle reward active status
  const toggleRewardActive = async (rewardId, isCurrentlyActive) => {
    setLoadingRewardId(rewardId);
    setLoadingRewardAction('active');
    
    try {
      // Update the reward template's active status
      await RewardService.updateRewardTemplate(rewardId, {
        isActive: !isCurrentlyActive
      });
      
      // Reload templates
      loadRewardTemplates();
    } catch (error) {
      console.error("Error toggling reward active status:", error);
      
      // Check for index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
      }
    } finally {
      setLoadingRewardId(null);
      setLoadingRewardAction(null);
    }
  };
  
  // Function to delete a reward template
  const deleteRewardTemplate = async (rewardId) => {
    try {
      console.log(`Deleting reward template: ${rewardId}`);
      // First check if RewardService has a deactivateRewardTemplate method
      if (typeof RewardService.deactivateRewardTemplate === 'function') {
        await RewardService.deactivateRewardTemplate(rewardId);
      } else {
        // Otherwise use updateRewardTemplate to set isActive: false as a soft delete
        await RewardService.updateRewardTemplate(rewardId, {
          isActive: false,
          isArchived: true,
          updatedAt: new Date()
        });
      }
      
      // Reload templates
      loadRewardTemplates();
    } catch (error) {
      console.error("Error deleting reward template:", error);
      
      // Check for index errors
      if (detectIndexError(error)) {
        setHasIndexError(true);
        setShowIndexBanner(true);
      }
    }
  };
  
  // Render tabs
  return (
    <div className="max-w-6xl mx-auto">
      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-md w-full">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">{confirmDialog.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{confirmDialog.message}</p>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  confirmDialog.onCancel();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Firestore Index Error Banner */}
      {hasIndexError && showIndexBanner && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
          <div className="flex items-start">
            <Database className="h-6 w-6 text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
            <div className="flex-grow">
              <h3 className="font-medium text-amber-800 mb-1 flex items-center">
                <span>Firestore Indexes Required</span>
                <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full ml-2">Action Required</span>
              </h3>
              <p className="text-amber-700 mb-2 text-sm">
                Some operations require database indexes that haven't been created yet. Indexes help Firestore 
                efficiently search and filter your data.
              </p>
              <div className="bg-white p-3 rounded border border-amber-200 mb-3 text-xs text-amber-800">
                <p className="mb-1"><strong>What are Firestore indexes?</strong></p>
                <p>Indexes are special database structures that improve query performance. When you run complex queries 
                (like filtering by multiple fields), Firestore requires custom indexes.</p>
              </div>
              <div className="space-y-2 text-sm text-amber-700">
                <p className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                  When you see this error, indexes need to be created in the Firebase Console
                </p>
                <p className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                  Follow the link in the error message to automatically configure the needed index
                </p>
                <p className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                  Once created, indexes take a few minutes to build - try again soon
                </p>
                <p className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1.5 text-amber-600" />
                  <span>See <a href="/HOW_TO_DEPLOY_INDEXES.md" className="underline text-amber-800 font-medium">HOW_TO_DEPLOY_INDEXES.md</a> for detailed instructions</span>
                </p>
              </div>
              <div className="mt-3 flex justify-end">
                <button 
                  onClick={() => setShowIndexBanner(false)}
                  className="flex items-center text-xs font-medium px-2.5 py-1.5 rounded-md text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>
          {activeTab === 'chores' && (
            <select
              value={choreFilter}
              onChange={(e) => setChoreFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Chores</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="morning">Morning Chores</option>
              <option value="afternoon">Afternoon Chores</option>
              <option value="evening">Evening Chores</option>
              <option value="anytime">Anytime Chores</option>
            </select>
          )}
          {activeTab === 'rewards' && (
            <select
              value={rewardFilter}
              onChange={(e) => setRewardFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Rewards</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="items">Items</option>
              <option value="activities">Activities</option>
              <option value="privileges">Privileges</option>
              <option value="special events">Special Events</option>
            </select>
          )}
          {activeTab === 'approvals' && (
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Children</option>
              {childrenOnly.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'chores'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('chores')}
        >
          <div className="flex items-center">
            <Check size={16} className="mr-2" />
            <span>Chores</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'rewards'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('rewards')}
        >
          <div className="flex items-center">
            <Gift size={16} className="mr-2" />
            <span>Rewards</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'approvals'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('approvals')}
        >
          <div className="flex items-center">
            <AlertCircle size={16} className="mr-2" />
            <span>Pending Approvals</span>
            {(pendingApprovals?.length > 0 || pendingRewardApprovals?.length > 0) && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {(pendingApprovals?.length || 0) + (pendingRewardApprovals?.length || 0)}
              </span>
            )}
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'balances'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('balances')}
        >
          <div className="flex items-center">
            <DollarSign size={16} className="mr-2" />
            <span>Palsson Bucks Accounts</span>
          </div>
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'profiles'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('profiles')}
        >
          <div className="flex items-center">
            <User size={16} className="mr-2" />
            <span>Child Profiles</span>
          </div>
        </button>
      </div>
      
      {/* Chores Management Tab */}
      {activeTab === 'chores' && (
        <div className={`transition-all duration-300 ${showChoreEditor ? 'ml-80' : ''}`}>
          {/* Bulk selection toolbar */}
          {selectedChoreIds.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckSquare size={20} className="text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {selectedChoreIds.length} chore{selectedChoreIds.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearSelection}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowChoreEditor(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Edit Selected
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:justify-between mb-4">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <h2 className="text-lg font-medium">Manage Chore Templates</h2>
              {choreTemplates?.length > 0 && (
                <button
                  onClick={selectedChoreIds.length === getFilteredChores().length ? clearSelection : selectAllChores}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {selectedChoreIds.length === getFilteredChores().length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <div className="relative group">
                <div className="absolute -top-12 left-0 transform -translate-y-full w-64 bg-black text-white text-xs rounded-md py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                  <strong>Quick Start:</strong> Import our professionally designed chore templates based on child development best practices
                </div>
              <button
                onClick={() => handleImportDefaults('chores')}
                disabled={isImportingChores}
                title="Add recommended chores from our collection of best practices"
                className={`px-4 py-2 ${isImportingChores ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-300'} rounded-md text-sm font-medium transition-colors flex items-center justify-center`}
              >
                {isImportingChores ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    <span className="text-xs">{importProgress.total > 0 ? 
                      `${importProgress.completed}/${importProgress.total}` : 
                      'Importing...'}</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={16} className="mr-1.5" />
                    <span>{defaultChores.filter(chore => 
                      !isLikelyDuplicate(choreTemplates || [], chore)
                    ).length === 0 ? 'Imported' : 'Import Templates'}</span>
                  </>
                )}
              </button>
              </div>
              <button
                onClick={() => {
                  setSelectedChoreIds([]); // Clear selection for new chore
                  setShowChoreEditor(true);
                }}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300"
              >
                <Plus size={16} className="mr-1.5" />
                Add Chore
              </button>
            </div>
          </div>
          
          {/* Helper text for empty state */}
          {!importError && !importSuccess && !isImportingChores && choreTemplates?.length === 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Get started quickly by importing our recommended chore templates. You can customize them after import.</p>
            </div>
          )}
          
          {/* Error notification */}
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-medium">Import Error</p>
                <p className="text-sm">{importError}</p>
              </div>
              <button 
                onClick={() => setImportError(null)}
                className="ml-4 text-red-500 hover:text-red-700"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Success notification with extra info */}
          {importSuccess && activeTab === 'chores' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center shadow-sm">
              <CheckCircle size={18} className="mr-2 flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-medium">Import Successful!</p>
                <p className="text-sm">{importSuccess}</p>
                <p className="text-xs text-green-600 mt-1">These templates provide a great starting point. Feel free to customize them to match your family's needs.</p>
              </div>
              <button 
                onClick={() => setImportSuccess(null)}
                className="ml-4 text-green-500 hover:text-green-700"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Progress indicator */}
          {isImportingChores && importProgress.total > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
              <div className="flex items-center mb-2">
                <Clock size={18} className="mr-2 flex-shrink-0" />
                <p className="font-medium">Importing Chore Templates</p>
                <p className="ml-auto">{importProgress.completed}/{importProgress.total}</p>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(importProgress.completed / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Chores grid - Changed to 3 columns max */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {getFilteredChores().map(chore => (
              <div key={chore.id} className="relative group">
                {/* Selection checkbox */}
                <div className="absolute top-2 right-2 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChoreSelection(chore.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedChoreIds.includes(chore.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white/90 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selectedChoreIds.includes(chore.id) ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </div>
                
                <SpotifyChoreCard 
                  chore={{
                    ...chore,
                    bucksAwarded: chore.rewardValue || chore.bucksReward || 1
                  }}
                  isAdmin={true}
                  onImageAdded={async (choreId, imageDataUrl, file) => {
                    try {
                      // In a real implementation, you would upload the file to storage
                      // and then update the chore with the image URL
                      console.log(`Uploading image for chore ${choreId}`);
                      
                      // For demo purposes, we'll just update the chore with the data URL
                      await ChoreService.updateChoreTemplate(choreId, {
                        imageUrl: imageDataUrl
                      });
                      
                      // Reload templates
                      loadChoreTemplates();
                    } catch (error) {
                      console.error("Error uploading image:", error);
                    }
                  }}
                  onDelete={deleteChoreTemplate}
                />
                
                {/* Admin controls overlay - positioned to avoid checkbox */}
                <div className="absolute top-14 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => {
                      setSelectedChoreIds([chore.id]); // Set single chore for editing
                      setShowChoreEditor(true);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:text-blue-600 transition-colors"
                    title="Edit & Schedule"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete Chore',
                        message: 'Are you sure you want to delete this chore? This action cannot be undone.',
                        onConfirm: () => deleteChoreTemplate(chore.id),
                        onCancel: () => {}
                      });
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 transition-colors"
                    title="Delete chore"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Status indicators at bottom */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-white/90 rounded-lg px-2 py-1">
                  {/* Assigned children */}
                  <div className="flex items-center -space-x-2">
                    {chore.assignedToIds && chore.assignedToIds.length > 0 ? (
                      childrenOnly
                        .filter(child => chore.assignedToIds.includes(child.id))
                        .slice(0, 3)
                        .map((child, index) => (
                          <div
                            key={child.id}
                            className="relative rounded-full w-6 h-6 border-2 border-white"
                            style={{ zIndex: 3 - index }}
                            title={child.name}
                          >
                            <UserAvatar user={child} size={24} />
                          </div>
                        ))
                    ) : (
                      <span className="text-xs text-gray-500">Unassigned</span>
                    )}
                    {chore.assignedToIds && chore.assignedToIds.length > 3 && (
                      <span className="text-xs text-gray-600 ml-2">+{chore.assignedToIds.length - 3}</span>
                    )}
                  </div>
                  
                  {/* Time and status */}
                  <div className="flex items-center space-x-2">
                    {/* Time of day */}
                    <span className="text-xs text-gray-600" title={`Time: ${chore.timeOfDay || 'anytime'}`}>
                      {{
                        morning: '🌅',
                        afternoon: '☀️',
                        evening: '🌙',
                        anytime: '⭐'
                      }[chore.timeOfDay || 'anytime']}
                    </span>
                    
                    {/* Active status */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      chore.isActive !== false 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {chore.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                
              </div>
            ))}
            
            {getFilteredChores().length === 0 && (
              <div className="col-span-3 py-8 text-center bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                <p className="text-blue-700 font-medium">No chores found matching your filters</p>
                <p className="text-blue-600 text-sm mt-1 mb-3">Want to get started quickly? Import our recommended templates!</p>
                <button 
                  onClick={() => handleImportDefaults('chores')}
                  disabled={isImportingChores}
                  title="Add recommended chores from our collection of best practices"
                  className={`mt-3 px-5 py-2.5 w-[220px] mx-auto ${isImportingChores ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'} rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
                >
                  {isImportingChores ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {importProgress.total > 0 ? 
                        `Importing ${importProgress.completed}/${importProgress.total}...` : 
                        'Preparing import...'}
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle size={18} className="mr-2" />
                      <span>{defaultChores.filter(chore => 
                        !isLikelyDuplicate(choreTemplates || [], chore)
                      ).length === 0 ? 'All Templates Imported' : 'Get Started with Default Templates'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Rewards Management Tab - UNIQUE ID: REWARD_TAB_SECTION */}
      {activeTab === 'rewards' && (
        <div className={`transition-all duration-300 ${showRewardEditor ? 'ml-80' : ''}`}>
          {/* Bulk selection toolbar */}
          {selectedRewardIds.length > 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckSquare size={20} className="text-purple-600" />
                <span className="text-sm font-medium text-purple-900">
                  {selectedRewardIds.length} reward{selectedRewardIds.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={clearRewardSelection}
                  className="text-sm text-purple-600 hover:text-purple-800 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowRewardEditor(true)}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Edit Selected
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:justify-between mb-4">
            <div className="flex items-center space-x-3 mb-2 md:mb-0">
              <h2 className="text-lg font-medium">Manage Reward Templates</h2>
              {rewardTemplates?.length > 0 && (
                <button
                  onClick={selectedRewardIds.length === getFilteredRewards().length ? clearRewardSelection : selectAllRewards}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  {selectedRewardIds.length === getFilteredRewards().length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
              <div className="relative group">
                <div className="absolute -top-12 left-0 transform -translate-y-full w-64 bg-black text-white text-xs rounded-md py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                  <strong>Quick Start:</strong> Import our collection of age-appropriate rewards that motivate positive behavior
                </div>
              <button
                onClick={() => handleImportDefaults('rewards')}
                disabled={isImportingRewards}
                title="Add recommended rewards from our collection of family favorites"
                className={`px-5 py-2.5 w-[220px] ${isImportingRewards ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'} rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
              >
                {isImportingRewards ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    {importProgress.total > 0 ? 
                      `Importing ${importProgress.completed}/${importProgress.total}...` : 
                      'Preparing import...'}
                  </>
                ) : (
                  <>
                    <ArrowUpCircle size={18} className="mr-2" />
                    <span>{defaultRewards.filter(reward => 
                      !isLikelyDuplicate(rewardTemplates || [], reward)
                    ).length === 0 ? 'All Templates Imported' : 'Import Default Templates'}</span>
                  </>
                )}
              </button>
              </div>
              <button
                onClick={() => {
                  setSelectedRewardIds([]); // Clear selection for new reward
                  setShowRewardEditor(true);
                }}
                className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center justify-center border border-gray-300"
              >
                <Plus size={16} className="mr-1.5" />
                Add Reward
              </button>
            </div>
          </div>
          
          {/* Helper text for empty state */}
          {!importError && !importSuccess && !isImportingRewards && rewardTemplates?.length === 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-700 flex items-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 mr-2">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">Save time by importing our recommended reward templates. You can adjust pricing and add your own custom rewards too!</p>
            </div>
          )}
          
          {/* Error notification */}
          {importError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
              <AlertCircle size={18} className="mr-2 flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-medium">Import Error</p>
                <p className="text-sm">{importError}</p>
              </div>
              <button 
                onClick={() => setImportError(null)}
                className="ml-4 text-red-500 hover:text-red-700"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Success notification with extra info */}
          {importSuccess && activeTab === 'rewards' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center shadow-sm">
              <CheckCircle size={18} className="mr-2 flex-shrink-0" />
              <div className="flex-grow">
                <p className="font-medium">Import Successful!</p>
                <p className="text-sm">{importSuccess}</p>
                <p className="text-xs text-green-600 mt-1">Your reward store is ready! You can now customize prices and descriptions to match your family's preferences.</p>
              </div>
              <button 
                onClick={() => setImportSuccess(null)}
                className="ml-4 text-green-500 hover:text-green-700"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Progress indicator */}
          {isImportingRewards && importProgress.total > 0 && (
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md text-purple-700">
              <div className="flex items-center mb-2">
                <Clock size={18} className="mr-2 flex-shrink-0" />
                <p className="font-medium">Importing Reward Templates</p>
                <p className="ml-auto">{importProgress.completed}/{importProgress.total}</p>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2.5">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(importProgress.completed / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Rewards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {getFilteredRewards().map(reward => (
              <div key={reward.id} className="relative group">
                {/* Selection checkbox */}
                <div className="absolute top-2 right-2 z-30">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRewardSelection(reward.id);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedRewardIds.includes(reward.id)
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/90 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {selectedRewardIds.includes(reward.id) ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </div>
                
                <SpotifyRewardCard 
                  reward={{
                    ...reward,
                    price: reward.price || reward.bucksPrice || 50
                  }}
                  isAdmin={true}
                  onImageAdded={async (rewardId, imageDataUrl, file) => {
                    try {
                      // In a real implementation, you would upload the file to storage
                      // and then update the reward with the image URL
                      console.log(`Uploading image for reward ${rewardId}`);
                      
                      // For demo purposes, we'll just update the reward with the data URL
                      await RewardService.updateRewardTemplate(rewardId, {
                        imageUrl: imageDataUrl
                      }, null);
                      
                      // Reload templates
                      loadRewardTemplates();
                    } catch (error) {
                      console.error("Error uploading image:", error);
                    }
                  }}
                  onDelete={deleteRewardTemplate}
                />
                
                {/* Admin controls overlay */}
                <div className="absolute top-2 left-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={() => {
                      setSelectedRewardIds([reward.id]); // Set single reward for editing
                      setShowRewardEditor(true);
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-gray-700 hover:text-purple-600 transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Delete Reward',
                        message: 'Are you sure you want to delete this reward? This action cannot be undone.',
                        onConfirm: () => deleteRewardTemplate(reward.id),
                        onCancel: () => {}
                      });
                    }}
                    className="p-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-700 transition-colors"
                    title="Delete reward"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => toggleRewardActive(reward.id, reward.isActive)}
                    className={`p-2 bg-white rounded-full shadow-md ${reward.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                    title={reward.isActive ? 'Active (click to deactivate)' : 'Inactive (click to activate)'}
                  >
                    <Check size={16} />
                  </button>
                </div>

                {/* Child availability display (non-interactive) */}
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    {childrenOnly
                      .filter(child => reward.availableToIds?.includes(child.id))
                      .map((child, index) => (
                        <div
                          key={child.id}
                          className="relative rounded-full w-10 h-10 border-2 border-purple-500"
                          style={{ zIndex: 10 - index, marginLeft: index > 0 ? '-4px' : '0' }}
                          title={`Available to ${child.name}`}
                        >
                          <UserAvatar user={child} size={38} />
                          <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                            <Check size={12} className="text-white" />
                          </div>
                        </div>
                      ))}
                    {reward.availableToIds?.length === 0 && (
                      <span className="text-xs text-gray-500">Not available</span>
                    )}
                  </div>
                </div>
                
                {/* Active/Inactive status badge (non-interactive) */}
                <div className={`absolute bottom-0 right-0 px-2 py-1 text-white text-xs rounded-tl-md ${
                  reward.isActive ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {reward.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
            
            {getFilteredRewards().length === 0 && (
              <div className="col-span-3 py-8 text-center bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
                <p className="text-purple-700 font-medium">No rewards found matching your filters</p>
                <p className="text-purple-600 text-sm mt-1 mb-3">Want to get started quickly? Import our recommended templates!</p>
                <button 
                  onClick={() => handleImportDefaults('rewards')}
                  disabled={isImportingRewards}
                  title="Add recommended rewards from our collection of family favorites"
                  className={`mt-3 px-5 py-2.5 w-[220px] mx-auto ${isImportingRewards ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-sm'} rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
                >
                  {isImportingRewards ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {importProgress.total > 0 ? 
                        `Importing ${importProgress.completed}/${importProgress.total}...` : 
                        'Preparing import...'}
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle size={18} className="mr-2" />
                      <span>{defaultRewards.filter(reward => 
                        !isLikelyDuplicate(rewardTemplates || [], reward)
                      ).length === 0 ? 'All Templates Imported' : 'Get Started with Default Templates'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Pending Approvals Tab */}
      {activeTab === 'approvals' && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Completed Chores - Auto-approved */}
            <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-green-400">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Check size={20} className="mr-2 text-green-500" />
                Completed Chores
                {completedChores?.length > 0 && (
                  <span className="ml-auto bg-green-100 text-green-800 text-xs py-1 px-2 rounded-full">
                    {completedChores.length} today
                  </span>
                )}
              </h2>
              
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">✨ Chores are automatically approved and paid. You can add/remove bucks or reject if needed.</p>
              </div>
              
              {completedChores?.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No completed chores today</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {completedChores
                    .filter(chore => !selectedChildId || chore.childId === selectedChildId)
                    .map(chore => {
                      const child = familyMembers.find(m => m.id === chore.childId);
                      return (
                        <div key={chore.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <UserAvatar 
                                user={child} 
                                size={28} 
                                className="mr-2" 
                              />
                              <div>
                                <span className="font-medium">{child?.name || 'Unknown'}</span>
                                <span className="text-xs text-gray-500 block">
                                  {new Date(chore.completedAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {chore.feedback?.sentiment && (
                                <span className="text-xs px-2 py-1 rounded-full" style={{
                                  backgroundColor: {
                                    'loved': '#FEE2E2',
                                    'ok': '#FEF3C7',
                                    'hated': '#DBEAFE'
                                  }[chore.feedback.sentiment],
                                  color: {
                                    'loved': '#DC2626',
                                    'ok': '#D97706',
                                    'hated': '#2563EB'
                                  }[chore.feedback.sentiment]
                                }}>
                                  {{'loved': '❤️ Loved', 'ok': '😐 OK', 'hated': '😔 Hated'}[chore.feedback.sentiment]}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <h3 className="font-medium">{chore.title || chore.template?.title}</h3>
                          {chore.description && <p className="text-sm text-gray-600">{chore.description}</p>}
                          
                          {/* Photo evidence */}
                          {(chore.feedback?.photoUrl || chore.photoUrl) && (
                            <div className="mt-2 mb-2">
                              <img 
                                src={chore.feedback?.photoUrl || chore.photoUrl} 
                                alt="Chore photo" 
                                className="h-32 w-auto object-cover rounded cursor-pointer hover:opacity-90"
                                onClick={() => window.open(chore.feedback?.photoUrl || chore.photoUrl, '_blank')}
                              />
                            </div>
                          )}
                          
                          {/* Feedback details */}
                          {chore.feedback && (
                            <div className="text-xs text-gray-600 space-y-1 mt-2">
                              {chore.feedback.effort && (
                                <div className="flex items-center gap-2">
                                  <span>Effort:</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{width: `${(chore.feedback.effort/5)*100}%`}} />
                                  </div>
                                  <span>{chore.feedback.effort}/5</span>
                                </div>
                              )}
                              {chore.feedback.enjoyment && (
                                <div className="flex items-center gap-2">
                                  <span>Fun:</span>
                                  <div className="flex">
                                    {[1,2,3,4,5].map(i => (
                                      <Heart key={i} size={12} className={i <= chore.feedback.enjoyment ? 'text-red-500 fill-red-500' : 'text-gray-300'} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {chore.feedback.notes && (
                                <p className="italic">💬 "{chore.feedback.notes}"</p>
                              )}
                            </div>
                          )}
                          
                          {/* Mood and completion data */}
                          {(chore.completionMood || chore.completionProof?.mood || chore.completionProof?.note) && (
                            <div className="text-xs text-gray-600 space-y-1 mt-2 p-2 bg-gray-50 rounded">
                              {(chore.completionMood || chore.completionProof?.mood) && (
                                <div className="flex items-center gap-2">
                                  <span>Difficulty:</span>
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                                    backgroundColor: {
                                      'veryEasy': '#D1FAE5',
                                      'easy': '#DBEAFE', 
                                      'neutral': '#FEF3C7',
                                      'hard': '#FED7AA',
                                      'veryHard': '#FEE2E2'
                                    }[chore.completionMood || chore.completionProof?.mood || 'neutral'],
                                    color: {
                                      'veryEasy': '#065F46',
                                      'easy': '#1E40AF',
                                      'neutral': '#92400E', 
                                      'hard': '#C2410C',
                                      'veryHard': '#991B1B'
                                    }[chore.completionMood || chore.completionProof?.mood || 'neutral']
                                  }}>
                                    {{
                                      'veryEasy': '😄 Very Easy',
                                      'easy': '🙂 Easy',
                                      'neutral': '😐 Just Right',
                                      'hard': '🙁 Hard',
                                      'veryHard': '😫 Very Hard'
                                    }[chore.completionMood || chore.completionProof?.mood || 'neutral']}
                                  </span>
                                </div>
                              )}
                              {chore.completionProof?.note && (
                                <p className="italic">📝 "{chore.completionProof.note}"</p>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center text-green-600">
                                <DollarSign size={16} className="mr-1" />
                                <span className="font-medium">{chore.actualBucksAwarded || chore.bucksReward || chore.template?.bucksReward || 1}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={async () => {
                                    const newAmount = (chore.actualBucksAwarded || chore.bucksReward || 1) + 1;
                                    await BucksService.adjustChoreReward(familyId, chore.childId, chore.id, 1, selectedUser.id);
                                    loadCompletedChores();
                                  }}
                                  className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
                                  title="Add 1 buck bonus"
                                >
                                  <Plus size={14} />
                                </button>
                                <button
                                  onClick={async () => {
                                    const currentAmount = chore.actualBucksAwarded || chore.bucksReward || 1;
                                    if (currentAmount > 0) {
                                      await BucksService.adjustChoreReward(familyId, chore.childId, chore.id, -1, selectedUser.id);
                                      loadCompletedChores();
                                    }
                                  }}
                                  className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                  title="Remove 1 buck"
                                >
                                  <Minus size={14} />
                                </button>
                              </div>
                            </div>
                            
                            {chore.status !== 'rejected' && (
                              <button
                                onClick={async () => {
                                  if (window.confirm('Are you sure you want to reject this completed chore? This will remove the bucks awarded.')) {
                                    await ChoreService.rejectCompletedChore(chore.id, selectedUser.id, { reason: 'Parent rejected' });
                                    loadCompletedChores();
                                  }
                                }}
                                className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                              >
                                Reject
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
            
            {/* Pending Reward Requests */}
            <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-purple-400">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Gift size={20} className="mr-2 text-purple-500" />
                Pending Reward Requests
                {pendingRewardApprovals?.length > 0 && (
                  <span className="ml-auto bg-purple-100 text-purple-800 text-xs py-1 px-2 rounded-full">
                    {pendingRewardApprovals.length}
                  </span>
                )}
              </h2>
              
              <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-700">🎁 Review and schedule reward requests from your kids.</p>
              </div>
              
              {pendingRewardApprovals?.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No pending reward requests</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {pendingRewardApprovals
                    .filter(reward => !selectedChildId || reward.childId === selectedChildId)
                    .map(reward => {
                      const child = familyMembers.find(m => m.id === reward.childId);
                      const template = reward.template || rewardTemplates?.find(t => t.id === reward.templateId);
                      const imageUrl = template?.imageUrl || reward.imageUrl;
                      const categoryEmoji = {
                        'activities': '🎮',
                        'items': '🎁',
                        'privileges': '👑',
                        'special events': '🌟'
                      }[reward.category || template?.category] || '🎯';
                      
                      return (
                        <div key={reward.id} className="border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50">
                          <div className="p-3">
                            {/* Header with child info and price - matching chore card style */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <UserAvatar 
                                  user={child} 
                                  size={28} 
                                  className="mr-2" 
                                />
                                <div>
                                  <span className="font-medium">{child?.name || 'Unknown'}</span>
                                  <span className="text-xs text-gray-500 block">
                                    {new Date(reward.requestedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{categoryEmoji}</span>
                              </div>
                            </div>
                            
                            {/* Main content area - image and details side by side */}
                            <div className="flex gap-3">
                              {/* Larger reward image matching chore card size */}
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-purple-100 flex items-center justify-center">
                                {imageUrl ? (
                                  <img 
                                    src={imageUrl} 
                                    alt={reward.title || template?.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl">{categoryEmoji}</span>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="font-medium">{reward.title || template?.title}</h3>
                                <p className="text-sm text-gray-600">{reward.description || template?.description}</p>
                                
                                {/* Category badge and notes */}
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                    {reward.category || template?.category || 'reward'}
                                  </span>
                                  {reward.notes && (
                                    <span className="text-xs text-gray-500 italic">💬 "{reward.notes}"</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Price badge on the right */}
                              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 h-fit">
                                <DollarSign size={14} className="text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">
                                  {reward.bucksPrice || template?.price || 50}
                                </span>
                              </div>
                            </div>
                            
                            {/* Event details if scheduled */}
                            {reward.eventDetails && (
                              <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar size={14} className="text-blue-600" />
                                  <span className="font-medium">Event Details</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                  📅 {new Date(reward.eventDetails.date).toLocaleDateString()} at {reward.eventDetails.time}
                                </p>
                                {reward.eventDetails.attendees && (
                                  <p className="text-xs text-gray-600">
                                    👥 Attendees: {reward.eventDetails.attendees.map(id => 
                                      familyMembers.find(m => m.id === id)?.name
                                    ).filter(Boolean).join(', ')}
                                  </p>
                                )}
                                {reward.eventDetails.location && (
                                  <p className="text-xs text-gray-600">📍 {reward.eventDetails.location}</p>
                                )}
                              </div>
                            )}
                            
                            {/* Completed reward photos */}
                            {reward.completionPhotos && reward.completionPhotos.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-600 mb-1">📸 Reward photos:</p>
                                <div className="flex gap-2 overflow-x-auto">
                                  {reward.completionPhotos.map((photo, idx) => (
                                    <img 
                                      key={idx}
                                      src={photo} 
                                      alt={`Reward photo ${idx + 1}`}
                                      className="h-16 w-16 object-cover rounded cursor-pointer hover:opacity-90"
                                      onClick={() => window.open(photo, '_blank')}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action buttons section with better separation */}
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <button
                              onClick={() => rejectReward(reward.id, selectedUser.id, { reason: 'Not available' })}
                              className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                            >
                              Reject
                            </button>
                            
                            <div className="flex gap-2">
                              {/* Quick approve for simple rewards */}
                              {(reward.category || template?.category) !== 'special events' && (
                                <button
                                  onClick={() => approveReward(reward.id, selectedUser.id, {})}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              
                              {/* Schedule event button */}
                              <button
                                onClick={() => {
                                  setSchedulingReward(reward);
                                  setShowEventScheduler(true);
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center"
                              >
                                <Calendar size={14} className="mr-1" />
                                Schedule
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
          
          {/* Photo Gallery Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-medium mb-4 flex items-center">
              <Camera size={20} className="mr-2 text-gray-600" />
              Family Photo Memories
              <span className="ml-auto text-sm text-gray-500">📚 Future: Auto-generate photo books!</span>
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {/* Collect all photos from completed chores and rewards */}
              {[...completedChores.filter(c => c.feedback?.photoUrl || c.photoUrl)
                  .map(c => ({
                    url: c.feedback?.photoUrl || c.photoUrl,
                    type: 'chore',
                    title: c.title || c.template?.title,
                    child: familyMembers.find(m => m.id === c.childId)?.name,
                    date: c.completedAt
                  })),
                ...allRewardPhotos.map(p => ({
                  url: p.url,
                  type: 'reward',
                  title: p.rewardTitle,
                  child: p.childName,
                  date: p.date
                }))
              ].sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 18)
                .map((photo, idx) => (
                  <div key={idx} className="relative group cursor-pointer" onClick={() => window.open(photo.url, '_blank')}>
                    <img 
                      src={photo.url} 
                      alt={photo.title}
                      className="w-full h-24 object-cover rounded-lg hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-end">
                      <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity w-full">
                        <p className="text-xs truncate">{photo.title}</p>
                        <p className="text-xs">{photo.child}</p>
                      </div>
                    </div>
                    <div className={`absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      photo.type === 'chore' ? 'bg-green-500' : 'bg-purple-500'
                    } text-white`}>
                      {photo.type === 'chore' ? '✓' : '🎁'}
                    </div>
                  </div>
                ))}
            </div>
            
            {(completedChores.filter(c => c.feedback?.photoUrl || c.photoUrl).length + allRewardPhotos.length) === 0 && (
              <p className="text-center text-gray-500 py-8">No photos yet! Kids can add photos when completing chores or enjoying rewards.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Palsson Bucks Accounts Tab */}
      {activeTab === 'balances' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Manage Palsson Bucks Accounts</h2>
            <button
              onClick={() => {
                setAdjustBalanceChildId(childrenOnly[0]?.id);
                setShowAdjustBalanceModal(true);
              }}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center"
              disabled={childrenOnly.length === 0}
            >
              <Plus size={16} className="mr-1.5" />
              Adjust Balance
            </button>
          </div>
          
          {/* Balance cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {childrenOnly.map(child => (
              <div 
                key={child.id} 
                className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-gray-200">
                  <div className="flex items-center">
                    <UserAvatar user={child} size={48} className="mr-3" />
                    <div>
                      <h3 className="font-medium">{child.name}</h3>
                      <p className="text-sm text-gray-600">Palsson Bucks Account</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 text-sm">Current Balance</span>
                    <div className="flex items-center text-green-600 font-bold text-xl">
                      <DollarSign size={20} className="mr-0.5" />
                      <span>{childBalances[child.id] || 0}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setAdjustBalanceChildId(child.id);
                          setAdjustBalanceAmount(5);
                          setAdjustBalanceReason('Bonus reward');
                          setShowAdjustBalanceModal(true);
                        }}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center"
                      >
                        <Plus size={12} className="mr-1" />
                        Add Bonus
                      </button>
                      
                      <button
                        onClick={() => {
                          setAdjustBalanceChildId(child.id);
                          setAdjustBalanceAmount(0);
                          setAdjustBalanceReason('');
                          setShowAdjustBalanceModal(true);
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center"
                      >
                        <Edit3 size={12} className="mr-1" />
                        Adjust
                      </button>
                      
                      <button
                        onClick={async () => {
                          setSelectedChildId(child.id);
                          setShowTransactionHistoryModal(true);
                          
                          try {
                            // Load transaction history for this child
                            const history = await BucksService.getTransactionHistory(familyId, child.id, 50);
                            setTransactions(history);
                          } catch (error) {
                            console.error("Error loading transaction history:", error);
                          }
                        }}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs flex items-center"
                      >
                        <Clock size={12} className="mr-1" />
                        History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {childrenOnly.length === 0 && (
              <div className="col-span-3 py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No child accounts found</p>
                <button 
                  onClick={() => {/* Add child account workflow */}}
                  className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  Add Family Member
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Child Profiles Tab */}
      {activeTab === 'profiles' && (
        <div>
          <div className="mb-6">
            <h2 className="text-lg font-medium mb-2">Child Profiles</h2>
            <p className="text-gray-600 text-sm">Manage clothing sizes, gift preferences, and personal information for each child</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenOnly.map(child => {
              const childData = childProfiles[child.id] || {};
              
              return (
                <div key={child.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <UserAvatar user={child} size={40} />
                        <div>
                          <h3 className="font-medium text-gray-900">{child.name}</h3>
                          <p className="text-sm text-gray-500">{child.age ? `${child.age} years old` : 'Age not set'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingChildProfile(child.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    {/* Clothing Sizes */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Shirt size={16} className="mr-2 text-indigo-500" />
                        Clothing Sizes
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shirt/Top:</span>
                          <span className="font-medium">{childData.shirtSize || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pants:</span>
                          <span className="font-medium">{childData.pantsSize || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Shoes:</span>
                          <span className="font-medium">{childData.shoeSize || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Jacket:</span>
                          <span className="font-medium">{childData.jacketSize || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Gift Preferences Summary */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Package size={16} className="mr-2 text-pink-500" />
                        Gift Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        {giftSummaries[child.id] ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Top Wishes:</span>
                              <span className="font-medium text-pink-600">{giftSummaries[child.id].topWishes || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Interests:</span>
                              <span className="font-medium">{giftSummaries[child.id].interests || 0}</span>
                            </div>
                            {giftSummaries[child.id].topCategories?.length > 0 && (
                              <div>
                                <span className="text-gray-600">Loves:</span>
                                <p className="font-medium mt-1 text-xs">
                                  {giftSummaries[child.id].topCategories.slice(0, 3).join(', ')}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic">No survey data yet</p>
                        )}
                        
                        <button
                          onClick={() => navigate(`/dashboard?tab=gifts`)}
                          className="mt-2 text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                        >
                          View all gift ideas
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Wardrobe Summary */}
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Shirt size={16} className="mr-2 text-indigo-500" />
                        Wardrobe Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        {wardrobeSummaries[child.id] ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Items:</span>
                              <span className="font-medium">{wardrobeSummaries[child.id].totalItems || 0}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Nearly Outgrown:</span>
                              <span className="font-medium text-orange-600">{wardrobeSummaries[child.id].nearlyOutgrown || 0}</span>
                            </div>
                            {wardrobeSummaries[child.id].needsSoon?.length > 0 && (
                              <div>
                                <span className="text-gray-600">Needs Soon:</span>
                                <p className="font-medium mt-1 text-xs text-orange-600">
                                  {wardrobeSummaries[child.id].needsSoon.join(', ')}
                                </p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic">No wardrobe data yet</p>
                        )}
                        
                        <button
                          onClick={() => navigate(`/dashboard?tab=wardrobe`)}
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                          Manage wardrobe
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-gray-500">
                        Last updated: {childData.lastUpdated 
                          ? new Date(childData.lastUpdated).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {childrenOnly.length === 0 && (
              <div className="col-span-3 py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
                <User size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">No child profiles to manage</p>
                <p className="text-sm text-gray-400 mt-1">Add children to your family to manage their profiles</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Chore modals removed - now using ChoreManagementPanel */}

      {/* Add Reward Modal */}
      {showAddRewardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Reward</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newRewardData.title}
                  onChange={(e) => setNewRewardData({...newRewardData, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Reward title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={newRewardData.description}
                  onChange={(e) => setNewRewardData({...newRewardData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Describe the reward"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <div className="px-3 py-2 bg-gray-100 text-gray-500">
                      <DollarSign size={16} />
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      value={newRewardData.price}
                      onChange={(e) => setNewRewardData({...newRewardData, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={newRewardData.category}
                    onChange={(e) => setNewRewardData({...newRewardData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="items">Items</option>
                    <option value="activities">Activities</option>
                    <option value="privileges">Privileges</option>
                    <option value="special events">Special Events</option>
                  </select>
                </div>
              </div>
              
              {/* Image upload section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Image</label>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => rewardImageInputRef.current?.click()}
                  >
                    {newRewardData.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={newRewardData.imageUrl} 
                          alt="Reward preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button 
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNewRewardData({...newRewardData, imageUrl: null});
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={rewardImageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleRewardImageChange(e)}
                    />
                    <p className="text-sm text-gray-600">Drag an image from Photos app or click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">Recommended: Square image for best display</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowAddRewardModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Cancel
              </button>
              <button 
                onClick={() => handleSaveReward(newRewardData)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                Save Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reward Modal */}
      {showEditRewardModal && rewardToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Reward</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={rewardToEdit.title}
                  onChange={(e) => setRewardToEdit({...rewardToEdit, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Reward title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={rewardToEdit.description}
                  onChange={(e) => setRewardToEdit({...rewardToEdit, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  placeholder="Describe the reward"
                ></textarea>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <div className="px-3 py-2 bg-gray-100 text-gray-500">
                      <DollarSign size={16} />
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      value={rewardToEdit.price || rewardToEdit.bucksPrice || 50}
                      onChange={(e) => setRewardToEdit({...rewardToEdit, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select 
                    value={rewardToEdit.category}
                    onChange={(e) => setRewardToEdit({...rewardToEdit, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="items">Items</option>
                    <option value="activities">Activities</option>
                    <option value="privileges">Privileges</option>
                    <option value="special events">Special Events</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
                <select 
                  value={rewardToEdit.isActive ? "active" : "inactive"}
                  onChange={(e) => setRewardToEdit({...rewardToEdit, isActive: e.target.value === "active"})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              {/* Image upload section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward Image</label>
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                    onClick={() => rewardImageInputRef.current?.click()}
                  >
                    {rewardToEdit.imageUrl ? (
                      <div className="relative w-full h-full">
                        <img 
                          src={rewardToEdit.imageUrl} 
                          alt="Reward preview" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button 
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRewardToEdit({...rewardToEdit, imageUrl: null});
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={rewardImageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => handleRewardImageChange(e, true)}
                    />
                    <p className="text-sm text-gray-600">Drag an image from Photos app or click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">Recommended: Square image for best display</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => {
                  setShowEditRewardModal(false);
                  setRewardToEdit(null);
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Cancel
              </button>
              <button 
                onClick={() => handleSaveReward(rewardToEdit)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                Update Reward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistoryModal && selectedChildId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-auto mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Transaction History for {familyMembers.find(m => m.id === selectedChildId)?.name || 'Child'}
              </h2>
              <button 
                onClick={() => setShowTransactionHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <button 
                onClick={async () => {
                  try {
                    // Load transaction history for the selected child
                    const history = await BucksService.getTransactionHistory(familyId, selectedChildId, 50);
                    setTransactions(history);
                  } catch (error) {
                    console.error("Error loading transaction history:", error);
                  }
                }}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center"
              >
                <ArrowUpCircle size={16} className="mr-1.5" />
                Refresh History
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.type === 'earned' ? 'bg-green-100 text-green-800' : transaction.type === 'spent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {transaction.type === 'earned' ? 'Earned' : transaction.type === 'spent' ? 'Spent' : 'Adjusted'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.amount >= 0 ? '+' : ''}{transaction.amount} Bucks
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {transaction.balance} Bucks
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found. Click "Refresh History" to load transactions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Adjust Palsson Bucks Balance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
                <select 
                  value={adjustBalanceChildId || ''}
                  onChange={(e) => setAdjustBalanceChildId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select a child</option>
                  {childrenOnly.map(child => (
                    <option key={child.id} value={child.id}>{child.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                  <div className="px-3 py-2 bg-gray-100 text-gray-500">
                    <DollarSign size={16} />
                  </div>
                  <input 
                    type="number" 
                    value={adjustBalanceAmount}
                    onChange={(e) => setAdjustBalanceAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 focus:outline-none"
                    placeholder="Enter positive or negative value"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Use positive values to add bucks, negative to subtract</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input 
                  type="text" 
                  value={adjustBalanceReason}
                  onChange={(e) => setAdjustBalanceReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Reason for adjustment"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowAdjustBalanceModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                Cancel
              </button>
              <button 
                onClick={handleAdjustBalance}
                disabled={!adjustBalanceChildId || adjustBalanceAmount === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unified Chore Editor */}
      <UnifiedChoreEditor
        isOpen={showChoreEditor}
        onClose={() => {
          setShowChoreEditor(false);
          // Don't clear selection when closing - user may want to continue selecting
        }}
        selectedChoreIds={selectedChoreIds}
        choreTemplates={choreTemplates}
        onSave={() => {
          loadChoreTemplates();
          // Clear selection after successful save
          setSelectedChoreIds([]);
          setShowChoreEditor(false);
        }}
      />
      
      {/* Unified Reward Editor */}
      <UnifiedRewardEditor
        isOpen={showRewardEditor}
        onClose={() => {
          setShowRewardEditor(false);
          // Don't clear selection when closing - user may want to continue selecting
        }}
        selectedRewardIds={selectedRewardIds}
        rewardTemplates={rewardTemplates}
        onSave={() => {
          loadRewardTemplates();
          // Clear selection after successful save
          setSelectedRewardIds([]);
          setShowRewardEditor(false);
        }}
      />
      
      {/* Event Scheduler Modal */}
      {showEventScheduler && schedulingReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Schedule Reward Event</h2>
            
            <div className="mb-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <h3 className="font-medium">{schedulingReward.title || schedulingReward.template?.title}</h3>
                <p className="text-sm text-gray-600">{schedulingReward.description || schedulingReward.template?.description}</p>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              
              const eventDetails = {
                date: formData.get('date'),
                time: formData.get('time'),
                location: formData.get('location'),
                attendees: Array.from(formData.getAll('attendees')),
                notes: formData.get('notes')
              };
              
              // Approve the reward with event details
              await approveReward(schedulingReward.id, selectedUser.id, { 
                eventDetails,
                status: 'scheduled'
              });
              
              // Create calendar event
              // TODO: Integrate with calendar service
              
              setShowEventScheduler(false);
              setSchedulingReward(null);
              
              // Reload data
              loadRewardTemplates();
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      name="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    <input 
                      type="time" 
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    placeholder="Where will this happen?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Who's Going?</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {familyMembers.map(member => (
                      <label key={member.id} className="flex items-center">
                        <input 
                          type="checkbox" 
                          name="attendees"
                          value={member.id}
                          defaultChecked={member.id === schedulingReward.childId}
                          className="mr-2"
                        />
                        <UserAvatar user={member} size={24} className="mr-2" />
                        <span className="text-sm">{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea 
                    name="notes"
                    rows="2"
                    placeholder="Any special instructions?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setShowEventScheduler(false);
                    setSchedulingReward(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Child Profile Modal */}
      {editingChildProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit {childrenOnly.find(c => c.id === editingChildProfile)?.name}'s Profile</h2>
            
            <div className="space-y-6">
              {/* Clothing Sizes Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Shirt size={18} className="mr-2 text-indigo-500" />
                  Clothing Sizes
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shirt/Top Size</label>
                    <input
                      type="text"
                      value={profileFormData.shirtSize || ''}
                      onChange={(e) => setProfileFormData({...profileFormData, shirtSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 6, S, 10-12"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pants Size</label>
                    <input
                      type="text"
                      value={profileFormData.pantsSize || ''}
                      onChange={(e) => setProfileFormData({...profileFormData, pantsSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 6, 28x30"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shoe Size</label>
                    <input
                      type="text"
                      value={profileFormData.shoeSize || ''}
                      onChange={(e) => setProfileFormData({...profileFormData, shoeSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., 13, 6.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jacket Size</label>
                    <input
                      type="text"
                      value={profileFormData.jacketSize || ''}
                      onChange={(e) => setProfileFormData({...profileFormData, jacketSize: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., M, 10-12"
                    />
                  </div>
                </div>
              </div>
              
              {/* Gift Preferences Section */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Package size={18} className="mr-2 text-pink-500" />
                  Quick Actions
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setEditingChildProfile(null);
                      // Navigate to gift wishes tab for this child
                      window.location.href = `/dashboard?tab=gifts&child=${editingChildProfile}`;
                    }}
                    className="w-full px-4 py-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">View Gift Wishes</span>
                    <ChevronRight size={18} />
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditingChildProfile(null);
                      // Navigate to closet companion for this child
                      window.location.href = `/dashboard?tab=wardrobe&child=${editingChildProfile}`;
                    }}
                    className="w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium">View Wardrobe</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setEditingChildProfile(null);
                  setProfileFormData({});
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const profileRef = doc(db, 'families', familyId, 'childProfiles', editingChildProfile);
                    await setDoc(profileRef, {
                      ...profileFormData,
                      lastUpdated: new Date().toISOString()
                    }, { merge: true });
                    
                    setChildProfiles(prev => ({
                      ...prev,
                      [editingChildProfile]: {
                        ...prev[editingChildProfile],
                        ...profileFormData,
                        lastUpdated: new Date().toISOString()
                      }
                    }));
                    
                    setEditingChildProfile(null);
                    setProfileFormData({});
                  } catch (error) {
                    console.error('Error saving profile:', error);
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KidsSectionAdminTab;