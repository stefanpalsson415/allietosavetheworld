import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { NotionButton, NotionBadge, NotionInput } from '../../../common/NotionUI';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import { 
  ArrowLeft, Edit, Save, X, Plus, Upload, Calendar, MapPin, 
  Briefcase, Heart, Users, BookOpen, Camera, FileText, 
  MessageCircle, Share2, Clock, Tag, Quote, Home, School,
  Trophy, Music, Palette, Globe, Phone, Mail, ChevronRight,
  Video, Mic, Image, Star, Gift, Utensils, Link
} from 'lucide-react';

const FamilyMemberProfile = ({ member, familyId, onAskAllie, onClose }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [stories, setStories] = useState([]);
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editedProfile, setEditedProfile] = useState(null);
  const [showAddStory, setShowAddStory] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);

  useEffect(() => {
    if (member?.id) {
      loadMemberData();
    }
  }, [member]);

  const loadMemberData = async () => {
    try {
      setLoading(true);
      const [storiesData, mediaData] = await Promise.all([
        FamilyTreeService.getMemberStories(familyId, member.id),
        FamilyTreeService.getMemberMedia(familyId, member.id)
      ]);
      setStories(storiesData);
      setMedia(mediaData);
      setEditedProfile(member.profile);
    } catch (error) {
      console.error('Error loading member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await FamilyTreeService.updateFamilyMember(familyId, member.id, {
        profile: editedProfile
      });
      setIsEditing(false);
      // In a real app, we'd update the parent component's state
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleAddStory = async (storyData) => {
    try {
      await FamilyTreeService.addStory(familyId, member.id, {
        ...storyData,
        authorId: user.uid
      });
      await loadMemberData();
      setShowAddStory(false);
    } catch (error) {
      console.error('Error adding story:', error);
    }
  };

  const handleAddMedia = async (mediaData) => {
    try {
      await FamilyTreeService.addMedia(familyId, member.id, {
        ...mediaData,
        uploadedBy: user.uid
      });
      await loadMemberData();
      setShowAddMedia(false);
    } catch (error) {
      console.error('Error adding media:', error);
    }
  };

  if (!member) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Select a family member to view their profile</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'connections', label: 'Connections', icon: Link, count: member.relationships?.length || 0 },
    { id: 'stories', label: 'Stories', icon: BookOpen, count: stories.length },
    { id: 'media', label: 'Photos & Videos', icon: Camera, count: media.length },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'legacy', label: 'Legacy', icon: Heart }
  ];

  const getAge = (birthDate, deathDate = null) => {
    if (!birthDate) return null;
    const endDate = deathDate ? new Date(deathDate) : new Date();
    const birth = new Date(birthDate);
    let age = endDate.getFullYear() - birth.getFullYear();
    const monthDiff = endDate.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && endDate.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateAge = (birthDate, deathDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Gradient Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            {/* Back button */}
            <button
              onClick={onClose}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>

            {/* Profile Image */}
            <div className="relative">
              {member.profile.photoUrl ? (
                <img 
                  src={member.profile.photoUrl} 
                  alt={member.profile.displayName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                  {member.profile.displayName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                </div>
              )}
              {member.profile.isLiving && (
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {member.profile.displayName}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/80">
                {member.profile.birthDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(member.profile.birthDate)} 
                    {calculateAge(member.profile.birthDate, member.profile.deathDate) && (
                      <span> (Age {calculateAge(member.profile.birthDate, member.profile.deathDate)})</span>
                    )}
                  </div>
                )}
                {member.profile.birthPlace && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {member.profile.birthPlace}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onAskAllie(member)}
                  className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 font-medium"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ask Allie
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 font-medium"
                >
                  <Edit className="h-4 w-4" />
                  {isEditing ? 'Done' : 'Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto">
          <nav className="flex space-x-1 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 px-4 font-medium text-sm flex items-center gap-2 transition-all relative
                  ${activeTab === tab.id
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <ProfileOverview 
                  member={member} 
                  isEditing={isEditing}
                  editedProfile={editedProfile}
                  setEditedProfile={setEditedProfile}
                />
              )}
              
              {activeTab === 'timeline' && (
                <ProfileTimeline member={member} />
              )}
              
              {activeTab === 'connections' && (
              <ProfileConnections member={member} familyId={familyId} />
            )}
            
            {activeTab === 'stories' && (
              <ProfileStories 
                stories={stories} 
                onAddStory={() => setShowAddStory(true)}
                member={member}
                onAskAllie={onAskAllie}
              />
            )}
            
            {activeTab === 'media' && (
              <ProfileMedia 
                media={media}
                onAddMedia={() => setShowAddMedia(true)}
                member={member}
                onAskAllie={onAskAllie}
              />
            )}
            
            {activeTab === 'documents' && (
              <ProfileDocuments 
                member={member}
                onAskAllie={onAskAllie}
              />
            )}
            
            {activeTab === 'legacy' && (
              <ProfileLegacy 
                member={member}
                onAskAllie={onAskAllie}
              />
            )}
          </>
        )}
        </div>
      </div>

      {/* Add Story Modal */}
      {showAddStory && (
        <AddStoryModal
          onClose={() => setShowAddStory(false)}
          onSave={handleAddStory}
          memberName={member.profile.displayName}
        />
      )}

      {/* Add Media Modal */}
      {showAddMedia && (
        <AddMediaModal
          onClose={() => setShowAddMedia(false)}
          onSave={handleAddMedia}
          memberName={member.profile.displayName}
        />
      )}
    </div>
  );
};

// Sub-components

const ProfileConnections = ({ member, familyId }) => {
  const [treeData, setTreeData] = useState(null);
  const [loadingRelationships, setLoadingRelationships] = useState(true);

  useEffect(() => {
    const loadRelationships = async () => {
      try {
        setLoadingRelationships(true);
        const tree = await FamilyTreeService.getFamilyTree(familyId);
        setTreeData(tree);
      } catch (error) {
        console.error('Error loading relationships:', error);
      } finally {
        setLoadingRelationships(false);
      }
    };

    if (familyId) {
      loadRelationships();
    }
  }, [familyId]);

  const getRelationshipDetails = () => {
    if (!member.relationships || !treeData) return {};

    const relationships = {
      parents: [],
      children: [],
      spouses: [],
      siblings: []
    };

    member.relationships.forEach(rel => {
      const relatedMember = treeData.members.find(m => 
        m.id === rel.relatedMemberId || m.id === rel.targetId
      );
      
      if (relatedMember) {
        const relationshipData = {
          member: relatedMember,
          type: rel.type || rel.relationshipType,
          startDate: rel.startDate,
          endDate: rel.endDate,
          status: rel.status
        };

        switch (rel.type || rel.relationshipType) {
          case 'parent':
            relationships.children.push(relationshipData);
            break;
          case 'child':
            relationships.parents.push(relationshipData);
            break;
          case 'spouse':
          case 'partner':
            relationships.spouses.push(relationshipData);
            break;
          case 'sibling':
            relationships.siblings.push(relationshipData);
            break;
        }
      }
    });

    return relationships;
  };

  if (loadingRelationships) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const relationships = getRelationshipDetails();
  const hasRelationships = Object.values(relationships).some(arr => arr.length > 0);

  return (
    <div className="space-y-6">
      {!hasRelationships ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No family connections found</p>
          <p className="text-sm text-gray-500 mt-1">
            Relationships will appear here as they are added to the family tree
          </p>
        </div>
      ) : (
        <>
          {/* Parents */}
          {relationships.parents.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                Parents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relationships.parents.map((rel, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {rel.member.profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rel.member.profile.displayName}</p>
                      <p className="text-sm text-gray-600">
                        {rel.member.profile.birthDate ? `b. ${new Date(rel.member.profile.birthDate).getFullYear()}` : ''}
                        {rel.member.profile.deathDate ? ` - d. ${new Date(rel.member.profile.deathDate).getFullYear()}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spouses/Partners */}
          {relationships.spouses.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Heart className="h-5 w-5 text-gray-600" />
                Spouses & Partners
              </h3>
              <div className="space-y-3">
                {relationships.spouses.map((rel, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
                    <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-pink-700">
                        {rel.member.profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{rel.member.profile.displayName}</p>
                      <p className="text-sm text-gray-600">
                        {rel.startDate && `Married ${new Date(rel.startDate).getFullYear()}`}
                        {rel.endDate && ` - Divorced ${new Date(rel.endDate).getFullYear()}`}
                        {rel.status === 'current' && ' (Current)'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Children */}
          {relationships.children.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                Children
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relationships.children.map((rel, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-700">
                        {rel.member.profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{rel.member.profile.displayName}</p>
                      <p className="text-xs text-gray-600">
                        {rel.member.profile.birthDate ? `b. ${new Date(rel.member.profile.birthDate).getFullYear()}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Siblings */}
          {relationships.siblings.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
                <Users className="h-5 w-5 text-gray-600" />
                Siblings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relationships.siblings.map((rel, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-700">
                        {rel.member.profile.displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{rel.member.profile.displayName}</p>
                      <p className="text-xs text-gray-600">
                        {rel.member.profile.birthDate ? `b. ${new Date(rel.member.profile.birthDate).getFullYear()}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ProfileOverview = ({ member, isEditing, editedProfile, setEditedProfile }) => {
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Unknown';
    try {
      if (date._seconds) {
        return new Date(date._seconds * 1000).toLocaleDateString();
      }
      return new Date(date).toLocaleDateString();
    } catch {
      return date.toString();
    }
  };

  const sections = [
    {
      title: 'Basic Information',
      icon: Users,
      fields: [
        { label: 'Full Name', value: `${member.profile.firstName} ${member.profile.middleName || ''} ${member.profile.lastName}`.trim() },
        { label: 'Maiden Name', value: member.profile.maidenName || 'Not specified', show: !!member.profile.maidenName },
        { label: 'Title', value: member.profile.title || 'Not specified', show: !!member.profile.title },
        { label: 'Suffix', value: member.profile.suffix || 'Not specified', show: !!member.profile.suffix },
        { label: 'Gender', value: member.profile.gender },
        { label: 'Birth Date', value: formatDate(member.profile.birthDate) },
        { label: 'Birth Place', value: member.profile.birthPlace || 'Unknown' },
        { label: 'Baptism Date', value: formatDate(member.profile.baptismDate), show: !!member.profile.baptismDate },
        { label: 'Baptism Place', value: member.profile.baptismPlace || 'Unknown', show: !!member.profile.baptismPlace },
        { label: 'Current Status', value: member.profile.isLiving ? 'Living' : 'Deceased' },
        { label: 'Death Date', value: formatDate(member.profile.deathDate), show: !member.profile.isLiving && member.profile.deathDate },
        { label: 'Death Place', value: member.profile.deathPlace || 'Unknown', show: !member.profile.isLiving && member.profile.deathPlace },
        { label: 'Death Cause', value: member.profile.deathCause || 'Not specified', show: !member.profile.isLiving && member.profile.deathCause },
        { label: 'Burial Date', value: formatDate(member.profile.burialDate), show: !member.profile.isLiving && member.profile.burialDate },
        { label: 'Burial Place', value: member.profile.burialPlace || 'Unknown', show: !member.profile.isLiving && member.profile.burialPlace }
      ].filter(field => field.show !== false)
    },
    {
      title: 'Professional Life',
      icon: Briefcase,
      fields: [
        { label: 'Occupation', value: member.profile.occupation || 'Not specified' },
        { label: 'Education', value: member.profile.education || 'Not specified' },
        { label: 'Religion', value: member.profile.religion || 'Not specified', show: !!member.profile.religion },
        { label: 'Nationality', value: member.profile.nationality || 'Not specified', show: !!member.profile.nationality }
      ].filter(field => field.show !== false)
    },
    {
      title: 'Contact Information',
      icon: Phone,
      fields: [
        { label: 'Email', value: member.profile.email || 'Not provided', icon: Mail },
        { label: 'Phone', value: member.profile.phone || 'Not provided', icon: Phone },
        { label: 'Website', value: member.profile.website || 'Not provided', icon: Globe, show: !!member.profile.website },
        { label: 'Address', value: member.profile.address || 'Not provided', icon: Home }
      ].filter(field => field.show !== false)
    }
  ];

  return (
    <div className="space-y-6">
      {sections.map(section => (
        <div key={section.title} className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <section.icon className="h-5 w-5 text-gray-600" />
            {section.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map(field => (
              <div key={field.label}>
                <p className="text-sm text-gray-600 mb-1">{field.label}</p>
                {isEditing ? (
                  <NotionInput
                    value={editedProfile[field.label.toLowerCase().replace(' ', '')] || ''}
                    onChange={(e) => setEditedProfile({
                      ...editedProfile,
                      [field.label.toLowerCase().replace(' ', '')]: e.target.value
                    })}
                    placeholder={field.label}
                  />
                ) : (
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    {field.icon && <field.icon className="h-4 w-4" />}
                    {field.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Biography */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <BookOpen className="h-5 w-5 text-gray-600" />
          Biography
        </h3>
        {isEditing ? (
          <textarea
            value={editedProfile.biography || ''}
            onChange={(e) => setEditedProfile({...editedProfile, biography: e.target.value})}
            placeholder="Write a biography..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {member.profile.biography || 'No biography written yet. Click edit to add one!'}
          </p>
        )}
      </div>

      {/* Tags and Interests */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
          <Tag className="h-5 w-5 text-gray-600" />
          Tags & Interests
        </h3>
        <div className="flex flex-wrap gap-2">
          {(member.metadata?.tags || []).map(tag => (
            <NotionBadge key={tag} color="blue">{tag}</NotionBadge>
          ))}
          {isEditing && (
            <button className="px-3 py-1 border border-dashed border-gray-300 rounded-full text-sm text-gray-600 hover:border-gray-400">
              <Plus className="h-3 w-3 inline mr-1" />
              Add tag
            </button>
          )}
        </div>
      </div>

      {/* Addresses from GEDCOM */}
      {member.addresses && member.addresses.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Home className="h-5 w-5 text-gray-600" />
            Known Addresses
          </h3>
          <div className="space-y-3">
            {member.addresses.map((address, index) => (
              <div key={index} className="border-l-4 border-blue-400 pl-4">
                <p className="font-medium text-gray-900">{address.street}</p>
                {address.city && <p className="text-gray-600">{address.city}, {address.state} {address.postal}</p>}
                {address.country && <p className="text-gray-600">{address.country}</p>}
                {address.phone && <p className="text-gray-600">Phone: {address.phone}</p>}
                {address.email && <p className="text-gray-600">Email: {address.email}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes from GEDCOM */}
      {member.notes && member.notes.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <FileText className="h-5 w-5 text-gray-600" />
            Notes & Documentation
          </h3>
          <div className="space-y-3">
            {member.notes.map((note, index) => (
              <div key={index} className="p-3 bg-white rounded border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources from GEDCOM */}
      {member.sources && member.sources.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <BookOpen className="h-5 w-5 text-gray-600" />
            Sources & References
          </h3>
          <div className="space-y-2">
            {member.sources.map((source, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-gray-500 text-sm">[{index + 1}]</span>
                <p className="text-gray-700 text-sm">{source.title || source.name || source}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media from GEDCOM */}
      {member.media && member.media.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Image className="h-5 w-5 text-gray-600" />
            Media & Photos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {member.media.map((mediaItem, index) => (
              <div key={index} className="relative group">
                {mediaItem.file ? (
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-xs rounded-b-lg">
                      {mediaItem.title || mediaItem.file}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileTimeline = ({ member }) => {
  const events = [];
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return null;
    try {
      if (date._seconds) {
        return new Date(date._seconds * 1000);
      }
      return new Date(date);
    } catch {
      return null;
    }
  };
  
  // Add birth event
  if (member.profile.birthDate) {
    events.push({
      id: 'birth',
      type: 'birth',
      date: member.profile.birthDate,
      title: 'Born',
      description: member.profile.birthPlace ? `Born in ${member.profile.birthPlace}` : 'Born',
      icon: 'baby',
      color: 'green'
    });
  }
  
  // Add baptism event
  if (member.profile.baptismDate) {
    events.push({
      id: 'baptism',
      type: 'baptism',
      date: member.profile.baptismDate,
      title: 'Baptized',
      description: member.profile.baptismPlace ? `Baptized in ${member.profile.baptismPlace}` : 'Baptized',
      icon: 'droplet',
      color: 'blue'
    });
  }
  
  // Add all GEDCOM events
  if (member.events && Array.isArray(member.events)) {
    member.events.forEach((event, index) => {
      if (event.date) {
        events.push({
          id: `event_${index}`,
          type: event.type || 'event',
          date: event.date,
          title: event.type || 'Event',
          description: event.place ? `${event.type || 'Event'} in ${event.place}` : (event.type || 'Event'),
          details: event.note || event.description,
          icon: 'calendar',
          color: 'purple'
        });
      }
    });
  }
  
  // Add residence events
  if (member.residences && Array.isArray(member.residences)) {
    member.residences.forEach((residence, index) => {
      if (residence.date || residence.place) {
        events.push({
          id: `residence_${index}`,
          type: 'residence',
          date: residence.date || null,
          title: 'Resided',
          description: residence.place ? `Resided in ${residence.place}` : 'Changed residence',
          details: residence.note,
          icon: 'home',
          color: 'orange'
        });
      }
    });
  }
  
  // Add education events
  if (member.profile.education) {
    events.push({
      id: 'education',
      type: 'education',
      date: member.profile.birthDate, // Would need actual date
      title: 'Education',
      description: member.profile.education,
      icon: 'graduation',
      color: 'blue'
    });
  }
  
  // Add occupation events
  if (member.profile.occupation) {
    events.push({
      id: 'occupation',
      type: 'occupation',
      date: member.profile.birthDate, // Would need actual date
      title: 'Career',
      description: member.profile.occupation,
      icon: 'briefcase',
      color: 'purple'
    });
  }
  
  // Sort events by date
  events.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No timeline events yet</p>
          <p className="text-sm text-gray-500 mt-1">Add life events to build the timeline</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Events */}
          <div className="space-y-8">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex gap-4">
                {/* Event dot */}
                <div className={`absolute left-8 w-4 h-4 rounded-full -translate-x-1/2 ${
                  event.color === 'green' ? 'bg-green-500' :
                  event.color === 'blue' ? 'bg-blue-500' :
                  event.color === 'purple' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`}></div>
                
                {/* Event content */}
                <div className="ml-16 flex-1">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{event.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(event.date).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileStories = ({ stories, onAddStory, member, onAskAllie }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Stories & Memories</h3>
        <div className="flex gap-2">
          <NotionButton
            onClick={() => onAskAllie(member, `Help me write a story about ${member.profile?.displayName || 'this family member'}. Interview me with questions about their personality, memorable moments, funny stories, life lessons they taught, or special traditions. Then help me craft a beautiful story to preserve their memory.`)}
            variant="subtle"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Ask Allie to Help
          </NotionButton>
          <NotionButton
            onClick={onAddStory}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Story
          </NotionButton>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No stories yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to share a memory!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map(story => (
            <div key={story.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2">{story.title}</h4>
              <p className="text-gray-700 mb-3 line-clamp-3">{story.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{new Date(story.createdAt.toDate()).toLocaleDateString()}</span>
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 hover:text-red-600">
                    <Heart className="h-4 w-4" />
                    {story.reactions.loves.length}
                  </button>
                  <button className="hover:text-blue-600">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileMedia = ({ media, onAddMedia, member, onAskAllie }) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Photos & Videos</h3>
        <div className="flex gap-2">
          <NotionButton
            onClick={() => onAskAllie(member, `Help me organize and describe photos of ${member.profile?.displayName || 'this family member'}. I can upload photos and you can help me: 1) Identify approximate time periods based on clothing/style, 2) Suggest captions and descriptions, 3) Create a photo timeline, 4) Identify locations or events. Let's preserve these visual memories properly!`)}
            variant="subtle"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Ask Allie to Organize
          </NotionButton>
          <NotionButton
            onClick={onAddMedia}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Media
          </NotionButton>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No photos or videos yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload memories to preserve them forever!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(item => (
            <div key={item.id} className="relative group cursor-pointer">
              <img 
                src={item.thumbnailUrl || item.url} 
                alt={item.title || 'Family photo'}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.type === 'video' ? (
                    <Video className="h-8 w-8 text-white" />
                  ) : (
                    <Image className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
              {item.date && (
                <p className="mt-1 text-xs text-gray-600">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfileDocuments = ({ member, onAskAllie }) => {
  const handleAddDocument = () => {
    // Create file input and trigger it
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        console.log('Document selected:', file.name);
        // In a real app, this would upload to Firebase Storage
        alert(`Document "${file.name}" selected. Upload functionality would be implemented here.`);
      }
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
        <div className="flex gap-2">
          <NotionButton
            onClick={() => onAskAllie(member, `Help me find and organize important documents for ${member.profile?.displayName || 'this family member'}. I need help locating: 1) Birth certificates, 2) Marriage records, 3) Military records, 4) Immigration documents, 5) Census records, 6) Newspaper clippings. You can search online databases and archives, then help me properly catalog what we find.`)}
            variant="subtle"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Ask Allie to Find Docs
          </NotionButton>
          <NotionButton
            onClick={handleAddDocument}
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
          >
            Add Document
          </NotionButton>
        </div>
      </div>
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No documents uploaded</p>
        <p className="text-sm text-gray-500 mt-1">
          Upload birth certificates, marriage licenses, and other important documents
        </p>
      </div>
    </div>
  );
};

const ProfileLegacy = ({ member, onAskAllie }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const legacyCategories = [
    { icon: Heart, title: 'Values & Beliefs', color: 'text-red-600' },
    { icon: Trophy, title: 'Achievements', color: 'text-yellow-600' },
    { icon: Gift, title: 'Family Traditions', color: 'text-purple-600' },
    { icon: Quote, title: 'Wisdom & Quotes', color: 'text-blue-600' },
    { icon: Utensils, title: 'Recipes', color: 'text-green-600' },
    { icon: Music, title: 'Favorite Music', color: 'text-indigo-600' }
  ];

  const handleCategoryClick = (category) => {
    const prompt = `Add ${category.title.toLowerCase()} for ${member.profile.displayName}`;
    const userInput = window.prompt(prompt);
    
    if (userInput) {
      console.log(`Adding ${category.title}:`, userInput);
      alert(`"${userInput}" would be saved to ${member.profile.displayName}'s ${category.title}`);
      // In a real app, this would save to Firebase
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {member.profile.displayName}'s Legacy
        </h3>
        <p className="text-gray-600">
          Preserving what matters most for future generations
        </p>
        <NotionButton
          onClick={() => onAskAllie(member, `Help me create a comprehensive legacy profile for ${member.profile?.displayName || 'this family member'}. Interview me about: 1) Their core values and beliefs, 2) Life lessons they taught, 3) Their proudest achievements, 4) Family traditions they started, 5) Funny sayings or quotes, 6) Their favorite recipes, 7) Skills or hobbies they passed down. Let's create a beautiful legacy that future generations will treasure!`)}
          variant="subtle"
          icon={<MessageCircle className="h-4 w-4" />}
          className="mt-4"
        >
          Ask Allie to Capture Legacy
        </NotionButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {legacyCategories.map(category => (
          <div 
            key={category.title} 
            onClick={() => handleCategoryClick(category)}
            className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <category.icon className={`h-6 w-6 ${category.color}`} />
              <h4 className="font-semibold text-gray-900">{category.title}</h4>
            </div>
            <p className="text-sm text-gray-600">
              Click to add {category.title.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Modal Components

const AddStoryModal = ({ onClose, onSave, memberName }) => {
  const [storyData, setStoryData] = useState({
    title: '',
    content: '',
    type: 'memory',
    date: '',
    location: '',
    tags: []
  });

  const storyTypes = [
    { value: 'memory', label: 'Memory', icon: Heart },
    { value: 'achievement', label: 'Achievement', icon: Trophy },
    { value: 'biography', label: 'Biography', icon: BookOpen },
    { value: 'quote', label: 'Quote', icon: Quote },
    { value: 'tradition', label: 'Tradition', icon: Gift }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Add a Story about {memberName}
          </h2>
          <p className="text-gray-600 mt-1">Share a memory, achievement, or story</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story Type
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {storyTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => setStoryData({...storyData, type: type.value})}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                    storyData.type === type.value 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  <span className="text-xs">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <NotionInput
              value={storyData.title}
              onChange={(e) => setStoryData({...storyData, title: e.target.value})}
              placeholder="Give your story a title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Story
            </label>
            <textarea
              value={storyData.content}
              onChange={(e) => setStoryData({...storyData, content: e.target.value})}
              placeholder="Share your story..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date (optional)
              </label>
              <NotionInput
                type="date"
                value={storyData.date}
                onChange={(e) => setStoryData({...storyData, date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (optional)
              </label>
              <NotionInput
                value={storyData.location}
                onChange={(e) => setStoryData({...storyData, location: e.target.value})}
                placeholder="Where did this happen?"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <NotionButton onClick={onClose} variant="outline">
            Cancel
          </NotionButton>
          <NotionButton
            onClick={() => onSave(storyData)}
            variant="primary"
            disabled={!storyData.title || !storyData.content}
          >
            Save Story
          </NotionButton>
        </div>
      </div>
    </div>
  );
};

const AddMediaModal = ({ onClose, onSave, memberName }) => {
  const [mediaData, setMediaData] = useState({
    url: '',
    type: 'photo',
    title: '',
    description: '',
    date: '',
    location: '',
    tags: []
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploading(true);
      try {
        // In a real app, upload to Firebase Storage
        // For now, create a local URL
        const localUrl = URL.createObjectURL(file);
        setMediaData({
          ...mediaData,
          url: localUrl,
          type: file.type.startsWith('video/') ? 'video' : 'photo',
          title: file.name.split('.')[0]
        });
      } catch (error) {
        console.error('Error processing file:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Add Photo or Video
          </h2>
          <p className="text-gray-600 mt-1">Upload a photo or video of {memberName}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-2">Drop files here or click to upload</p>
            <NotionButton 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Files'}
            </NotionButton>
            {mediaData.url && (
              <p className="text-sm text-green-600 mt-2">File selected: {mediaData.title}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <NotionInput
              value={mediaData.title}
              onChange={(e) => setMediaData({...mediaData, title: e.target.value})}
              placeholder="Give it a title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={mediaData.description}
              onChange={(e) => setMediaData({...mediaData, description: e.target.value})}
              placeholder="Describe what's in this photo/video"
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <NotionButton onClick={onClose} variant="outline">
            Cancel
          </NotionButton>
          <NotionButton
            onClick={() => onSave(mediaData)}
            variant="primary"
            disabled={!mediaData.url}
          >
            Save Media
          </NotionButton>
        </div>
      </div>
    </div>
  );
};

export default FamilyMemberProfile;