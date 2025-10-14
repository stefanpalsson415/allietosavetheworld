import { db } from './firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import FamilyTreeService from './FamilyTreeService';
import stefanAvatar from '../assets/stefan-palsson.jpg';
import kimberlyAvatar from '../assets/kimberly-palsson.jpg';

class FamilyTreeSyncService {
  async syncExistingFamilyMembers(familyId) {
    try {
      console.log('FamilyTreeSyncService: Starting sync for family', familyId);
      
      // First, try to get family document to check members array
      const familyDocRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyDocRef);
      
      let membersToSync = [];
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        console.log('FamilyTreeSyncService: Family document found', familyData);
        
        // Check if family has members array
        if (familyData.familyMembers && familyData.familyMembers.length > 0) {
          console.log('FamilyTreeSyncService: Found members in family document:', familyData.familyMembers.length);
          membersToSync = familyData.familyMembers;
        }
      }
      
      // Also check the members subcollection
      const familyMembersRef = collection(db, 'families', familyId, 'members');
      const membersSnapshot = await getDocs(familyMembersRef);
      
      if (!membersSnapshot.empty) {
        console.log('FamilyTreeSyncService: Found', membersSnapshot.size, 'members in subcollection');
        const subcollectionMembers = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Merge with existing members, avoiding duplicates
        const existingIds = new Set(membersToSync.map(m => m.id || m.email));
        for (const member of subcollectionMembers) {
          if (!existingIds.has(member.id) && !existingIds.has(member.email)) {
            membersToSync.push(member);
          }
        }
      }
      
      if (membersToSync.length === 0) {
        console.log('FamilyTreeSyncService: No family members found to sync');
        return;
      }
      
      console.log('FamilyTreeSyncService: Total members to sync:', membersToSync.length);
      
      // Get or initialize the family tree
      let treeData = await FamilyTreeService.getFamilyTree(familyId);
      
      if (!treeData) {
        console.log('FamilyTreeSyncService: Creating new family tree');
        // Use the first member as creator
        const firstMember = membersSnapshot.docs[0].data();
        await FamilyTreeService.initializeFamilyTree(familyId, {
          uid: firstMember.userId || firstMember.email,
          displayName: firstMember.name || firstMember.email
        });
        treeData = await FamilyTreeService.getFamilyTree(familyId);
      }
      
      // Check which members already exist in the tree
      const existingTreeMembers = treeData.members || [];
      const existingEmails = new Set(existingTreeMembers.map(m => m.profile.email).filter(email => email));
      const existingNames = new Set(existingTreeMembers.map(m => m.profile.displayName));
      
      // Add each family member to the tree if not already present
      for (const memberData of membersToSync) {
        // Check by email if available, otherwise by name
        if ((memberData.email && existingEmails.has(memberData.email)) || 
            (memberData.name && existingNames.has(memberData.name))) {
          console.log('FamilyTreeSyncService: Member already in tree:', memberData.email || memberData.name);
          continue;
        }
        
        console.log('FamilyTreeSyncService: Adding member to tree:', {
          name: memberData.name,
          avatar: memberData.avatar,
          profileImage: memberData.profileImage,
          photoURL: memberData.photoURL
        });
        
        // Determine generation based on role
        let generation = 1; // Default to parent generation
        if (memberData.role === 'child') {
          generation = 2;
        }
        
        // Map names to avatar images
        const avatarMap = {
          'Stefan Palsson': stefanAvatar,
          'Stefan': stefanAvatar,
          'Kimberly Palsson': kimberlyAvatar, 
          'Kimberly': kimberlyAvatar
        };
        
        // Get avatar from map or use existing data
        const avatarUrl = avatarMap[memberData.name] || memberData.avatar || memberData.profileImage || memberData.photoURL || '';
        
        // Add member to family tree
        const newMember = await FamilyTreeService.addFamilyMember(familyId, {
          displayName: memberData.name,
          firstName: memberData.name ? memberData.name.split(' ')[0] : '',
          lastName: memberData.name ? memberData.name.split(' ').slice(1).join(' ') : '',
          email: memberData.email || '',
          photoUrl: avatarUrl,
          isLiving: true,
          generation: generation,
          gender: memberData.gender || 'prefer-not-to-say',
          birthDate: memberData.birthDate || null,
          customFields: {
            role: memberData.role,
            originalMemberId: memberData.id,
            syncedAt: new Date().toISOString()
          }
        });
        
        console.log('FamilyTreeSyncService: Added member:', newMember.id);
      }
      
      // Now add relationships based on roles
      const updatedTree = await FamilyTreeService.getFamilyTree(familyId);
      const treeMembers = updatedTree.members || [];
      
      // Find parents and children
      const parents = treeMembers.filter(m => m.metadata?.customFields?.role === 'parent');
      const children = treeMembers.filter(m => m.metadata?.customFields?.role === 'child');
      
      console.log('FamilyTreeSyncService: Found', parents.length, 'parents and', children.length, 'children');
      
      // Add spouse relationship between parents
      if (parents.length >= 2) {
        console.log('FamilyTreeSyncService: Adding spouse relationship between parents');
        await FamilyTreeService.addRelationship(familyId, {
          fromMemberId: parents[0].id,
          toMemberId: parents[1].id,
          type: 'spouse',
          metadata: {
            status: 'active'
          }
        });
      }
      
      // Add parent-child relationships
      for (const parent of parents) {
        for (const child of children) {
          console.log('FamilyTreeSyncService: Adding parent-child relationship');
          await FamilyTreeService.addRelationship(familyId, {
            fromMemberId: parent.id,
            toMemberId: child.id,
            type: 'parent',
            metadata: {
              status: 'active'
            }
          });
        }
      }
      
      // Add sibling relationships
      if (children.length > 1) {
        for (let i = 0; i < children.length; i++) {
          for (let j = i + 1; j < children.length; j++) {
            console.log('FamilyTreeSyncService: Adding sibling relationship');
            await FamilyTreeService.addRelationship(familyId, {
              fromMemberId: children[i].id,
              toMemberId: children[j].id,
              type: 'sibling',
              metadata: {
                status: 'active'
              }
            });
          }
        }
      }
      
      console.log('FamilyTreeSyncService: Sync complete');
      return updatedTree;
      
    } catch (error) {
      console.error('FamilyTreeSyncService: Error syncing family members:', error);
      throw error;
    }
  }
}

export default new FamilyTreeSyncService();