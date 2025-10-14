import { db } from './firebase';
import { 
  collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
  query, where, orderBy, limit, serverTimestamp, arrayUnion, arrayRemove,
  increment, onSnapshot, writeBatch
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

class FamilyTreeService {
  constructor() {
    this.collection = 'familyTrees';
    this.membersSubcollection = 'members';
    this.storiesSubcollection = 'stories';
    this.mediaSubcollection = 'media';
    this.relationshipsSubcollection = 'relationships';
  }

  // Initialize a new family tree
  async initializeFamilyTree(familyId, creatorData) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      const treeData = {
        id: treeId,
        familyId,
        name: `${creatorData.displayName}'s Family Tree`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: creatorData.uid,
        settings: {
          privacy: 'family', // family, private, public
          allowCollaboration: true,
          requireApproval: false,
          theme: 'classic'
        },
        stats: {
          totalMembers: 0,
          generations: 0,
          stories: 0,
          photos: 0,
          lastUpdated: serverTimestamp()
        }
      };

      await setDoc(treeRef, treeData);
      return treeData;
    } catch (error) {
      console.error('Error initializing family tree:', error);
      throw error;
    }
  }

  // Helper function to convert Firestore Timestamps to dates
  convertTimestampToDate(value) {
    if (value && typeof value === 'object' && value._seconds !== undefined) {
      // It's a Firestore Timestamp
      return new Date(value._seconds * 1000).toISOString();
    }
    if (value && typeof value === 'object' && value.seconds !== undefined) {
      // It's a Firestore Timestamp (alternative format)
      return new Date(value.seconds * 1000).toISOString();
    }
    if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
      // It's a Firestore Timestamp with toDate method
      return value.toDate().toISOString();
    }
    return value;
  }

  // Recursively convert all Timestamps in an object
  convertTimestampsInObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const converted = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (value && typeof value === 'object') {
          // Check if it's a Timestamp
          if (value._seconds !== undefined || value.seconds !== undefined || (value.toDate && typeof value.toDate === 'function')) {
            converted[key] = this.convertTimestampToDate(value);
          } else if (Array.isArray(value)) {
            converted[key] = value.map(item => this.convertTimestampsInObject(item));
          } else {
            converted[key] = this.convertTimestampsInObject(value);
          }
        } else {
          converted[key] = value;
        }
      }
    }
    
    return converted;
  }

  // Get family tree with all members
  async getFamilyTree(familyId) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      const treeDoc = await getDoc(treeRef);

      if (!treeDoc.exists()) {
        return null;
      }

      const treeData = { id: treeDoc.id, ...treeDoc.data() };
      
      // Get all members
      const membersRef = collection(treeRef, this.membersSubcollection);
      const membersSnapshot = await getDocs(membersRef);
      
      treeData.members = membersSnapshot.docs.map(doc => {
        const memberData = doc.data();
        // Convert all Timestamps to date strings
        const convertedData = this.convertTimestampsInObject(memberData);
        return {
          id: doc.id,
          ...convertedData
        };
      });

      // Get all relationships
      const relationshipsRef = collection(treeRef, this.relationshipsSubcollection);
      const relationshipsSnapshot = await getDocs(relationshipsRef);
      
      treeData.relationships = relationshipsSnapshot.docs.map(doc => {
        const relData = doc.data();
        // Convert all Timestamps to date strings
        const convertedData = this.convertTimestampsInObject(relData);
        return {
          id: doc.id,
          ...convertedData
        };
      });

      return treeData;
    } catch (error) {
      console.error('Error getting family tree:', error);
      throw error;
    }
  }

  // Add a new family member
  async addFamilyMember(familyId, memberData) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      const memberId = memberData.id || `member_${uuidv4()}`;
      const memberRef = doc(treeRef, this.membersSubcollection, memberId);

      const member = {
        id: memberId,
        ...memberData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profile: {
          displayName: memberData.displayName || memberData.profile?.displayName || `${memberData.firstName || memberData.profile?.firstName || ''} ${memberData.lastName || memberData.profile?.lastName || ''}`.trim(),
          firstName: memberData.firstName || memberData.profile?.firstName || '',
          lastName: memberData.lastName || memberData.profile?.lastName || '',
          middleName: memberData.middleName || memberData.profile?.middleName || '',
          maidenName: memberData.maidenName || memberData.profile?.maidenName || '',
          nickname: memberData.nickname || memberData.profile?.nickname || '',
          title: memberData.title || memberData.profile?.title || '',
          suffix: memberData.suffix || memberData.profile?.suffix || '',
          gender: memberData.gender || memberData.profile?.gender || 'prefer-not-to-say',
          birthDate: memberData.birthDate || memberData.profile?.birthDate || null,
          birthPlace: memberData.birthPlace || memberData.profile?.birthPlace || '',
          baptismDate: memberData.baptismDate || memberData.profile?.baptismDate || null,
          baptismPlace: memberData.baptismPlace || memberData.profile?.baptismPlace || '',
          deathDate: memberData.deathDate || memberData.profile?.deathDate || null,
          deathPlace: memberData.deathPlace || memberData.profile?.deathPlace || '',
          burialDate: memberData.burialDate || memberData.profile?.burialDate || null,
          burialPlace: memberData.burialPlace || memberData.profile?.burialPlace || '',
          deathCause: memberData.deathCause || memberData.profile?.deathCause || '',
          isLiving: memberData.isLiving !== false,
          occupation: memberData.occupation || memberData.profile?.occupation || '',
          education: memberData.education || memberData.profile?.education || '',
          religion: memberData.religion || memberData.profile?.religion || '',
          nationality: memberData.nationality || memberData.profile?.nationality || '',
          photoUrl: memberData.photoUrl || memberData.profile?.photoUrl || '',
          coverPhotoUrl: memberData.coverPhotoUrl || memberData.profile?.coverPhotoUrl || '',
          importId: memberData.importId || memberData.profile?.importId || null,
          importSource: memberData.importSource || memberData.profile?.importSource || null,
          email: memberData.email || memberData.profile?.email || '',
          phone: memberData.phone || memberData.profile?.phone || '',
          website: memberData.website || memberData.profile?.website || '',
          note: memberData.note || memberData.profile?.note || ''
        },
        // Store all events from GEDCOM
        events: memberData.events || [],
        // Store all addresses
        addresses: memberData.addresses || [],
        // Store media/photos
        media: memberData.media || [],
        // Store residences
        residences: memberData.residences || [],
        // Store additional notes
        notes: memberData.notes || [],
        // Store sources/citations
        sources: memberData.sources || [],
        metadata: {
          generation: memberData.generation || memberData.metadata?.generation || 0,
          branch: memberData.branch || memberData.metadata?.branch || 'main',
          tags: memberData.tags || memberData.metadata?.tags || [],
          customFields: memberData.customFields || memberData.metadata?.customFields || {},
          rawGedcomData: memberData.rawGedcomData || memberData.metadata?.rawGedcomData || null
        },
        stats: {
          stories: 0,
          photos: memberData.media?.length || 0,
          documents: 0,
          connections: 0,
          events: memberData.events?.length || 0,
          sources: memberData.sources?.length || 0
        },
        privacy: {
          level: memberData.privacy?.level || 'family',
          allowStories: true,
          allowPhotos: true,
          allowContact: false
        }
      };

      await setDoc(memberRef, member);

      // Update tree stats
      await updateDoc(treeRef, {
        'stats.totalMembers': increment(1),
        'stats.lastUpdated': serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Create relationships if provided
      if (memberData.relationships && memberData.relationships.length > 0) {
        for (const rel of memberData.relationships) {
          await this.addRelationship(familyId, {
            fromMemberId: memberId,
            toMemberId: rel.toMemberId,
            type: rel.type,
            metadata: rel.metadata || {}
          });
        }
      }

      return member;
    } catch (error) {
      console.error('Error adding family member:', error);
      throw error;
    }
  }

  // Add a relationship between family members
  async addRelationship(familyId, relationshipData) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      const relationshipId = `rel_${uuidv4()}`;
      const relationshipRef = doc(treeRef, this.relationshipsSubcollection, relationshipId);

      // If using import IDs, we need to find the actual member IDs
      let fromMemberId = relationshipData.fromMemberId;
      let toMemberId = relationshipData.toMemberId;

      if (relationshipData.person1ImportId || relationshipData.person2ImportId) {
        // Get all members to find by importId
        const membersRef = collection(treeRef, this.membersSubcollection);
        const membersSnapshot = await getDocs(membersRef);
        const members = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (relationshipData.person1ImportId) {
          const member1 = members.find(m => m.profile.importId === relationshipData.person1ImportId);
          if (member1) fromMemberId = member1.id;
        }

        if (relationshipData.person2ImportId) {
          const member2 = members.find(m => m.profile.importId === relationshipData.person2ImportId);
          if (member2) toMemberId = member2.id;
        }
      }

      if (!fromMemberId || !toMemberId) {
        throw new Error('Could not find members for relationship');
      }

      const relationship = {
        id: relationshipId,
        fromMemberId,
        toMemberId,
        type: relationshipData.type, // parent, child, spouse, sibling, etc.
        metadata: {
          startDate: relationshipData.metadata?.startDate || null,
          endDate: relationshipData.metadata?.endDate || null,
          status: relationshipData.metadata?.status || 'active',
          notes: relationshipData.metadata?.notes || '',
          location: relationshipData.metadata?.location || '',
          verified: relationshipData.metadata?.verified || false,
          ...relationshipData.metadata
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(relationshipRef, relationship);

      // Update tree stats
      await updateDoc(treeRef, {
        'stats.lastUpdated': serverTimestamp()
      });

      return relationship;
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  }

  // Add a story to a family member
  async addStory(familyId, memberId, storyData) {
    try {
      const treeId = `tree_${familyId}`;
      const memberRef = doc(db, this.collection, treeId, this.membersSubcollection, memberId);
      const storyId = `story_${uuidv4()}`;
      const storyRef = doc(memberRef, this.storiesSubcollection, storyId);

      const story = {
        id: storyId,
        title: storyData.title,
        content: storyData.content,
        type: storyData.type || 'general', // biography, memory, achievement, etc.
        date: storyData.date || null,
        location: storyData.location || '',
        tags: storyData.tags || [],
        mediaIds: storyData.mediaIds || [],
        contributors: [storyData.authorId],
        visibility: storyData.visibility || 'family',
        metadata: storyData.metadata || {},
        reactions: {
          likes: [],
          loves: [],
          laughs: [],
          cries: []
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: storyData.authorId
      };

      await setDoc(storyRef, story);

      // Update member stats
      await updateDoc(memberRef, {
        'stats.stories': increment(1),
        updatedAt: serverTimestamp()
      });

      // Update tree stats
      const treeRef = doc(db, this.collection, treeId);
      await updateDoc(treeRef, {
        'stats.stories': increment(1),
        'stats.lastUpdated': serverTimestamp()
      });

      return story;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }

  // Add media (photo/video) to a family member
  async addMedia(familyId, memberId, mediaData) {
    try {
      const treeId = `tree_${familyId}`;
      const memberRef = doc(db, this.collection, treeId, this.membersSubcollection, memberId);
      const mediaId = `media_${uuidv4()}`;
      const mediaRef = doc(memberRef, this.mediaSubcollection, mediaId);

      const media = {
        id: mediaId,
        url: mediaData.url,
        thumbnailUrl: mediaData.thumbnailUrl || mediaData.url,
        type: mediaData.type || 'photo', // photo, video, document
        title: mediaData.title || '',
        description: mediaData.description || '',
        date: mediaData.date || null,
        location: mediaData.location || '',
        tags: mediaData.tags || [],
        peopleTagged: mediaData.peopleTagged || [],
        metadata: {
          width: mediaData.width || null,
          height: mediaData.height || null,
          duration: mediaData.duration || null,
          fileSize: mediaData.fileSize || null,
          mimeType: mediaData.mimeType || null,
          ...mediaData.metadata
        },
        visibility: mediaData.visibility || 'family',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        uploadedBy: mediaData.uploadedBy
      };

      await setDoc(mediaRef, media);

      // Update member stats
      await updateDoc(memberRef, {
        'stats.photos': increment(1),
        updatedAt: serverTimestamp()
      });

      // Update tree stats
      const treeRef = doc(db, this.collection, treeId);
      await updateDoc(treeRef, {
        'stats.photos': increment(1),
        'stats.lastUpdated': serverTimestamp()
      });

      return media;
    } catch (error) {
      console.error('Error adding media:', error);
      throw error;
    }
  }

  // Get all stories for a family member
  async getMemberStories(familyId, memberId) {
    try {
      const treeId = `tree_${familyId}`;
      const memberRef = doc(db, this.collection, treeId, this.membersSubcollection, memberId);
      const storiesRef = collection(memberRef, this.storiesSubcollection);
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting member stories:', error);
      throw error;
    }
  }

  // Get all media for a family member
  async getMemberMedia(familyId, memberId) {
    try {
      const treeId = `tree_${familyId}`;
      const memberRef = doc(db, this.collection, treeId, this.membersSubcollection, memberId);
      const mediaRef = collection(memberRef, this.mediaSubcollection);
      const q = query(mediaRef, orderBy('date', 'desc'));
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting member media:', error);
      throw error;
    }
  }

  // Update family member
  async updateFamilyMember(familyId, memberId, updates) {
    try {
      const treeId = `tree_${familyId}`;
      const memberRef = doc(db, this.collection, treeId, this.membersSubcollection, memberId);
      
      await updateDoc(memberRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      // Update tree last updated
      const treeRef = doc(db, this.collection, treeId);
      await updateDoc(treeRef, {
        'stats.lastUpdated': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating family member:', error);
      throw error;
    }
  }

  // Get tree statistics
  async getTreeStats(familyId) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      const treeDoc = await getDoc(treeRef);

      if (!treeDoc.exists()) {
        return {
          totalMembers: 0,
          generations: 0,
          stories: 0,
          photos: 0
        };
      }

      const treeData = treeDoc.data();
      
      // Calculate generations if needed
      if (treeData.stats.generations === 0 && treeData.stats.totalMembers > 0) {
        const membersRef = collection(treeRef, this.membersSubcollection);
        const membersSnapshot = await getDocs(membersRef);
        
        const generations = new Set();
        membersSnapshot.docs.forEach(doc => {
          const member = doc.data();
          if (member.metadata?.generation !== undefined) {
            generations.add(member.metadata.generation);
          }
        });

        await updateDoc(treeRef, {
          'stats.generations': generations.size
        });

        return {
          ...treeData.stats,
          generations: generations.size
        };
      }

      return treeData.stats;
    } catch (error) {
      console.error('Error getting tree stats:', error);
      throw error;
    }
  }

  // Search family members
  async searchMembers(familyId, searchTerm) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      const membersRef = collection(treeRef, this.membersSubcollection);
      
      const snapshot = await getDocs(membersRef);
      const searchLower = searchTerm.toLowerCase();
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(member => {
          const name = `${member.profile.firstName} ${member.profile.lastName} ${member.profile.nickname}`.toLowerCase();
          return name.includes(searchLower);
        });
    } catch (error) {
      console.error('Error searching members:', error);
      throw error;
    }
  }

  // Subscribe to tree updates
  subscribeToTreeUpdates(familyId, callback) {
    const treeId = `tree_${familyId}`;
    const treeRef = doc(db, this.collection, treeId);
    
    return onSnapshot(treeRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  // Clear all family tree data (members and relationships)
  async clearFamilyTree(familyId) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      // Delete all members
      const membersRef = collection(treeRef, this.membersSubcollection);
      const membersSnapshot = await getDocs(membersRef);
      
      const deletePromises = [];
      membersSnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      // Delete all relationships
      const relationshipsRef = collection(treeRef, this.relationshipsSubcollection);
      const relationshipsSnapshot = await getDocs(relationshipsRef);
      
      relationshipsSnapshot.docs.forEach(doc => {
        deletePromises.push(deleteDoc(doc.ref));
      });
      
      await Promise.all(deletePromises);
      
      // Reset tree stats
      await updateDoc(treeRef, {
        'stats.totalMembers': 0,
        'stats.generations': 0,
        'stats.stories': 0,
        'stats.photos': 0,
        'stats.lastUpdated': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('FamilyTreeService: Cleared', membersSnapshot.size, 'members and', relationshipsSnapshot.size, 'relationships');
      
    } catch (error) {
      console.error('Error clearing family tree:', error);
      throw error;
    }
  }

  // Calculate generations for all members
  async calculateGenerations(familyId) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      // Get all members and relationships
      const membersRef = collection(treeRef, this.membersSubcollection);
      const membersSnapshot = await getDocs(membersRef);
      const members = new Map();
      membersSnapshot.forEach(doc => {
        members.set(doc.id, { id: doc.id, ...doc.data() });
      });
      
      const relationshipsRef = collection(treeRef, this.relationshipsSubcollection);
      const relationshipsSnapshot = await getDocs(relationshipsRef);
      const relationships = [];
      relationshipsSnapshot.forEach(doc => {
        relationships.push(doc.data());
      });
      
      // Build parent-child maps
      const childToParents = new Map();
      const parentToChildren = new Map();
      
      relationships.forEach(rel => {
        if (rel.type === 'parent' || rel.type === 'child') {
          // Normalize the relationship direction
          let parentId, childId;
          if (rel.type === 'parent') {
            parentId = rel.fromMemberId;
            childId = rel.toMemberId;
          } else {
            parentId = rel.toMemberId;
            childId = rel.fromMemberId;
          }
          
          // Add to child->parents map
          if (!childToParents.has(childId)) {
            childToParents.set(childId, []);
          }
          childToParents.get(childId).push(parentId);
          
          // Add to parent->children map
          if (!parentToChildren.has(parentId)) {
            parentToChildren.set(parentId, []);
          }
          parentToChildren.get(parentId).push(childId);
        }
      });
      
      // Find root ancestors (people with no parents)
      const roots = [];
      members.forEach((member, memberId) => {
        if (!childToParents.has(memberId)) {
          roots.push(memberId);
        }
      });
      
      // Calculate generations using BFS from roots
      const generations = new Map();
      const queue = roots.map(id => ({ id, generation: 0 }));
      const visited = new Set();
      
      while (queue.length > 0) {
        const { id, generation } = queue.shift();
        
        if (visited.has(id)) continue;
        visited.add(id);
        
        generations.set(id, generation);
        
        // Add children to queue
        const children = parentToChildren.get(id) || [];
        children.forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, generation: generation + 1 });
          }
        });
      }
      
      // Update all members with their calculated generation
      let batch = writeBatch(db);
      let updateCount = 0;
      
      for (const [memberId, generation] of generations) {
        const memberRef = doc(treeRef, this.membersSubcollection, memberId);
        batch.update(memberRef, {
          'metadata.generation': generation,
          updatedAt: serverTimestamp()
        });
        updateCount++;
        
        if (updateCount >= 500) {
          // Firestore batch limit is 500
          await batch.commit();
          batch = writeBatch(db);
          updateCount = 0;
        }
      }
      
      if (updateCount > 0) {
        await batch.commit();
      }
      
      // Update tree stats
      const maxGeneration = Math.max(...Array.from(generations.values()), 0);
      await updateDoc(treeRef, {
        'stats.generations': maxGeneration + 1,
        'stats.lastUpdated': serverTimestamp()
      });
      
      console.log(`Calculated generations for ${generations.size} members. Max generation: ${maxGeneration}`);
      return { success: true, membersUpdated: generations.size, maxGeneration };
    } catch (error) {
      console.error('Error calculating generations:', error);
      throw error;
    }
  }

  // Get family timeline events
  async getFamilyTimeline(familyId) {
    try {
      const treeData = await this.getFamilyTree(familyId);
      if (!treeData) return [];

      const events = [];

      // Add birth events
      treeData.members.forEach(member => {
        if (member.profile.birthDate) {
          events.push({
            id: `birth_${member.id}`,
            type: 'birth',
            date: member.profile.birthDate,
            title: `${member.profile.displayName} was born`,
            memberId: member.id,
            member: member,
            location: member.profile.birthPlace,
            icon: 'baby'
          });
        }

        if (!member.profile.isLiving && member.profile.deathDate) {
          events.push({
            id: `death_${member.id}`,
            type: 'death',
            date: member.profile.deathDate,
            title: `${member.profile.displayName} passed away`,
            memberId: member.id,
            member: member,
            location: member.profile.deathPlace,
            icon: 'memorial'
          });
        }
      });

      // Add marriage events from relationships
      treeData.relationships
        .filter(rel => rel.type === 'spouse' && rel.metadata.startDate)
        .forEach(rel => {
          const member1 = treeData.members.find(m => m.id === rel.fromMemberId);
          const member2 = treeData.members.find(m => m.id === rel.toMemberId);
          
          if (member1 && member2) {
            events.push({
              id: `marriage_${rel.id}`,
              type: 'marriage',
              date: rel.metadata.startDate,
              title: `${member1.profile.displayName} married ${member2.profile.displayName}`,
              memberIds: [rel.fromMemberId, rel.toMemberId],
              members: [member1, member2],
              location: rel.metadata.location,
              icon: 'rings'
            });
          }
        });

      // Sort events by date
      return events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error getting family timeline:', error);
      throw error;
    }
  }

  // Get insights and patterns
  async getFamilyInsights(familyId) {
    try {
      const treeData = await this.getFamilyTree(familyId);
      if (!treeData) return null;

      const insights = {
        namePatterns: {},
        occupationTrends: {},
        locationHistory: {},
        generationStats: {},
        relationshipStats: {
          averageChildren: 0,
          averageMarriageAge: 0,
          longestMarriage: null
        }
      };

      // Analyze name patterns
      const firstNames = {};
      const lastNames = {};
      
      treeData.members.forEach(member => {
        // First names
        if (member.profile.firstName) {
          firstNames[member.profile.firstName] = (firstNames[member.profile.firstName] || 0) + 1;
        }
        
        // Last names
        if (member.profile.lastName) {
          lastNames[member.profile.lastName] = (lastNames[member.profile.lastName] || 0) + 1;
        }
        
        // Occupations
        if (member.profile.occupation) {
          insights.occupationTrends[member.profile.occupation] = 
            (insights.occupationTrends[member.profile.occupation] || 0) + 1;
        }
        
        // Locations
        if (member.profile.birthPlace) {
          insights.locationHistory[member.profile.birthPlace] = 
            (insights.locationHistory[member.profile.birthPlace] || 0) + 1;
        }
      });

      insights.namePatterns = {
        popularFirstNames: Object.entries(firstNames)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
        familyNames: Object.entries(lastNames)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      };

      return insights;
    } catch (error) {
      console.error('Error getting family insights:', error);
      throw error;
    }
  }

  // Helper function to convert date to Firestore-compatible format
  convertDateToFirestore(dateValue) {
    if (!dateValue) return null;
    
    // If it's already a Date object, return it
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // If it's an object with a parsed property (from GEDCOM parser)
    if (typeof dateValue === 'object' && dateValue.parsed) {
      return new Date(dateValue.parsed);
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  }

  // Clear all family tree data for a clean re-import
  async clearFamilyTree(familyId) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      console.log('Starting to clear family tree data...');
      
      // Get all members
      const membersSnapshot = await getDocs(collection(treeRef, this.membersSubcollection));
      console.log(`Found ${membersSnapshot.size} members to delete`);
      
      // Get all relationships
      const relationshipsSnapshot = await getDocs(collection(treeRef, this.relationshipsSubcollection));
      console.log(`Found ${relationshipsSnapshot.size} relationships to delete`);
      
      // Delete in batches
      let batch = writeBatch(db);
      let operationCount = 0;
      const maxOperations = 500; // Firestore limit
      
      // Delete members
      for (const docSnapshot of membersSnapshot.docs) {
        batch.delete(docSnapshot.ref);
        operationCount++;
        
        if (operationCount >= maxOperations) {
          await batch.commit();
          batch = writeBatch(db); // Create new batch
          operationCount = 0;
        }
      }
      
      // Delete relationships
      for (const docSnapshot of relationshipsSnapshot.docs) {
        if (operationCount >= maxOperations) {
          await batch.commit();
          batch = writeBatch(db); // Create new batch
          operationCount = 0;
        }
        
        batch.delete(docSnapshot.ref);
        operationCount++;
      }
      
      // Commit remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
      
      // Reset tree stats
      await updateDoc(treeRef, {
        'stats.totalMembers': 0,
        'stats.totalRelationships': 0,
        'stats.totalStories': 0,
        'stats.totalPhotos': 0,
        'stats.generations': 0,
        'stats.lastUpdated': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Family tree data cleared successfully');
      
      return {
        success: true,
        membersDeleted: membersSnapshot.size,
        relationshipsDeleted: relationshipsSnapshot.size
      };
    } catch (error) {
      console.error('Error clearing family tree:', error);
      throw error;
    }
  }

  // Batch import methods for handling large GEDCOM imports
  async batchImportMembers(familyId, members, batchSize = 100) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      let importedCount = 0;
      let skippedCount = 0;
      const errors = [];

      // First, get all existing member IDs to check for duplicates
      console.log('Checking for existing members...');
      const existingMembersSnapshot = await getDocs(collection(treeRef, this.membersSubcollection));
      const existingMemberIds = new Set();
      const existingImportIds = new Set();
      
      existingMembersSnapshot.forEach(doc => {
        const data = doc.data();
        existingMemberIds.add(doc.id);
        if (data.profile?.importId) {
          existingImportIds.add(data.profile.importId);
        }
      });
      
      console.log(`Found ${existingMemberIds.size} existing members in the tree`);

      // Process in batches to avoid Firestore limits (max 500 operations per batch)
      for (let i = 0; i < members.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchMembers = members.slice(i, Math.min(i + batchSize, members.length));
        let batchOperations = 0;
        
        for (const memberData of batchMembers) {
          try {
            const memberId = memberData.id || `member_${uuidv4()}`;
            
            // Skip if member already exists (check both member ID and import ID)
            if (existingMemberIds.has(memberId) || existingImportIds.has(memberData.importId)) {
              skippedCount++;
              console.log(`Skipping duplicate member: ${memberData.displayName || memberData.firstName} (${memberId})`);
              continue;
            }
            
            const memberRef = doc(treeRef, this.membersSubcollection, memberId);
            
            const member = {
              id: memberId,
              ...memberData,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              profile: {
                displayName: memberData.displayName || memberData.profile?.displayName || `${memberData.firstName || memberData.profile?.firstName || ''} ${memberData.lastName || memberData.profile?.lastName || ''}`.trim(),
                firstName: memberData.firstName || memberData.profile?.firstName || '',
                lastName: memberData.lastName || memberData.profile?.lastName || '',
                middleName: memberData.middleName || memberData.profile?.middleName || '',
                maidenName: memberData.maidenName || memberData.profile?.maidenName || '',
                nickname: memberData.nickname || memberData.profile?.nickname || '',
                title: memberData.title || memberData.profile?.title || '',
                suffix: memberData.suffix || memberData.profile?.suffix || '',
                gender: memberData.gender || memberData.profile?.gender || 'prefer-not-to-say',
                birthDate: this.convertDateToFirestore(memberData.birthDate || memberData.profile?.birthDate),
                birthPlace: memberData.birthPlace || memberData.profile?.birthPlace || '',
                baptismDate: this.convertDateToFirestore(memberData.baptismDate || memberData.profile?.baptismDate),
                baptismPlace: memberData.baptismPlace || memberData.profile?.baptismPlace || '',
                deathDate: this.convertDateToFirestore(memberData.deathDate || memberData.profile?.deathDate),
                deathPlace: memberData.deathPlace || memberData.profile?.deathPlace || '',
                burialDate: this.convertDateToFirestore(memberData.burialDate || memberData.profile?.burialDate),
                burialPlace: memberData.burialPlace || memberData.profile?.burialPlace || '',
                deathCause: memberData.deathCause || memberData.profile?.deathCause || '',
                isLiving: memberData.isLiving !== false,
                occupation: memberData.occupation || memberData.profile?.occupation || '',
                education: memberData.education || memberData.profile?.education || '',
                religion: memberData.religion || memberData.profile?.religion || '',
                nationality: memberData.nationality || memberData.profile?.nationality || '',
                photoUrl: memberData.photoUrl || memberData.profile?.photoUrl || '',
                coverPhotoUrl: memberData.coverPhotoUrl || memberData.profile?.coverPhotoUrl || '',
                importId: memberData.importId || memberData.profile?.importId || null,
                importSource: memberData.importSource || memberData.profile?.importSource || null,
                email: memberData.email || memberData.profile?.email || '',
                phone: memberData.phone || memberData.profile?.phone || '',
                website: memberData.website || memberData.profile?.website || '',
                note: memberData.note || memberData.profile?.note || ''
              },
              // Store all events from GEDCOM
              events: memberData.events || [],
              // Store all addresses
              addresses: memberData.addresses || [],
              // Store media/photos
              media: memberData.media || [],
              // Store residences
              residences: memberData.residences || [],
              // Store additional notes
              notes: memberData.notes || [],
              // Store sources/citations
              sources: memberData.sources || [],
              metadata: {
                generation: memberData.generation || memberData.metadata?.generation || 0,
                branch: memberData.branch || memberData.metadata?.branch || 'main',
                tags: memberData.tags || memberData.metadata?.tags || [],
                customFields: memberData.customFields || memberData.metadata?.customFields || {},
                rawGedcomData: memberData.rawGedcomData || memberData.metadata?.rawGedcomData || null
              },
              stats: {
                stories: 0,
                photos: memberData.media?.length || 0,
                documents: 0,
                connections: 0,
                events: memberData.events?.length || 0,
                sources: memberData.sources?.length || 0
              },
              privacy: {
                level: memberData.privacy?.level || 'family',
                allowStories: true,
                allowPhotos: true,
                allowContact: false
              }
            };
            
            batch.set(memberRef, member);
            batchOperations++;
          } catch (error) {
            console.error(`Error preparing member ${memberData.id}:`, error);
            errors.push({ member: memberData.id, error: error.message });
          }
        }
        
        // Commit the batch only if there are operations to commit
        if (batchOperations > 0) {
          try {
            await batch.commit();
            importedCount += batchOperations;
            console.log(`Batch imported: ${importedCount} new, ${skippedCount} skipped / ${members.length} total members`);
          } catch (error) {
            console.error('Batch commit failed:', error);
            errors.push({ batch: `${i}-${i + batchSize}`, error: error.message });
          }
        }
      }
      
      // Update tree stats only for newly imported members
      if (importedCount > 0) {
        await updateDoc(treeRef, {
          'stats.totalMembers': increment(importedCount),
          'stats.lastUpdated': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Import complete: ${importedCount} new members imported, ${skippedCount} duplicates skipped`);
      
      return { 
        success: true, 
        imported: importedCount,
        skipped: skippedCount,
        total: members.length,
        errors: errors 
      };
    } catch (error) {
      console.error('Error in batch import:', error);
      throw error;
    }
  }

  async batchImportRelationships(familyId, relationships, batchSize = 100) {
    try {
      const treeId = `tree_${familyId}`;
      const treeRef = doc(db, this.collection, treeId);
      
      let importedCount = 0;
      let skippedCount = 0;
      const errors = [];

      // First, get all existing relationships to check for duplicates
      console.log('Checking for existing relationships...');
      const existingRelsSnapshot = await getDocs(collection(treeRef, this.relationshipsSubcollection));
      const existingRelationships = new Set();
      
      existingRelsSnapshot.forEach(doc => {
        const data = doc.data();
        // Create a unique key for each relationship
        const relKey = `${data.fromMemberId}-${data.toMemberId}-${data.type}`;
        existingRelationships.add(relKey);
      });
      
      console.log(`Found ${existingRelationships.size} existing relationships in the tree`);

      // Process in batches
      for (let i = 0; i < relationships.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchRelationships = relationships.slice(i, Math.min(i + batchSize, relationships.length));
        let batchOperations = 0;
        
        for (const relData of batchRelationships) {
          try {
            const fromId = relData.fromMemberId || relData.person1ImportId;
            const toId = relData.toMemberId || relData.person2ImportId;
            const relKey = `${fromId}-${toId}-${relData.type}`;
            
            // Skip if relationship already exists
            if (existingRelationships.has(relKey)) {
              skippedCount++;
              console.log(`Skipping duplicate relationship: ${relKey}`);
              continue;
            }
            
            const relationshipId = `rel_${uuidv4()}`;
            const relationshipRef = doc(treeRef, this.relationshipsSubcollection, relationshipId);
            
            const relationship = {
              id: relationshipId,
              fromMemberId: relData.fromMemberId || relData.person1ImportId,
              toMemberId: relData.toMemberId || relData.person2ImportId,
              type: relData.type,
              metadata: relData.metadata || {},
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            batch.set(relationshipRef, relationship);
            batchOperations++;
          } catch (error) {
            console.error(`Error preparing relationship:`, error);
            errors.push({ relationship: relData, error: error.message });
          }
        }
        
        // Commit the batch only if there are operations to commit
        if (batchOperations > 0) {
          try {
            await batch.commit();
            importedCount += batchOperations;
            console.log(`Batch imported: ${importedCount} new, ${skippedCount} skipped / ${relationships.length} total relationships`);
          } catch (error) {
            console.error('Batch commit failed:', error);
            errors.push({ batch: `${i}-${i + batchSize}`, error: error.message });
          }
        }
      }
      
      // Update tree stats only for newly imported relationships
      if (importedCount > 0) {
        await updateDoc(treeRef, {
          'stats.totalRelationships': increment(importedCount),
          'stats.lastUpdated': serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      console.log(`Import complete: ${importedCount} new relationships imported, ${skippedCount} duplicates skipped`);
      
      return { 
        success: true, 
        imported: importedCount,
        skipped: skippedCount,
        total: relationships.length,
        errors: errors 
      };
    } catch (error) {
      console.error('Error in batch import relationships:', error);
      throw error;
    }
  }
}

export default new FamilyTreeService();