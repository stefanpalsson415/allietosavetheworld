import React, { useState, useEffect } from 'react';
import { useFamily } from '../../../../contexts/FamilyContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { useChatDrawer } from '../../../../contexts/ChatDrawerContext';
import { NotionButton, NotionInput, NotionBadge } from '../../../common/NotionUI';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import { 
  User, Users, Heart, Calendar, MapPin, Briefcase, School, 
  Camera, Search, Sparkles, ChevronRight, ChevronLeft, Check,
  Globe, Phone, Mail, Home, Baby, Cake, Award, BookOpen,
  FileText, Link, MessageCircle, Loader2, AlertCircle, X,
  Star, Trophy, Coins
} from 'lucide-react';
import { db } from '../../../../services/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

const AddFamilyMemberFlow = ({ isOpen, onClose, existingMembers = [], onMemberAdded }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const { openDrawerWithPrompt } = useChatDrawer();
  
  const [step, setStep] = useState('search'); // search, details, research, connections, review
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberData, setMemberData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    nickname: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    deathDate: '',
    deathPlace: '',
    isLiving: true,
    occupation: '',
    education: '',
    photoUrl: '',
    email: '',
    phone: '',
    website: '',
    bio: '',
    interests: [],
    achievements: [],
    relationships: [],
    sources: []
  });
  
  const [aiResearch, setAiResearch] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState([]);
  const [bucksEarned, setBucksEarned] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  // Calculate Palsson Bucks based on completeness
  useEffect(() => {
    let bucks = 10; // Base reward for adding a family member
    
    // Additional rewards for completeness
    if (memberData.photoUrl) bucks += 5;
    if (memberData.birthDate) bucks += 3;
    if (memberData.birthPlace) bucks += 2;
    if (memberData.occupation) bucks += 2;
    if (memberData.education) bucks += 2;
    if (memberData.bio && memberData.bio.length > 100) bucks += 5;
    if (memberData.achievements.length > 0) bucks += 3;
    if (memberData.interests.length > 0) bucks += 2;
    if (selectedConnections.length > 0) bucks += 5;
    if (aiResearch) bucks += 10; // Bonus for using AI research
    
    setBucksEarned(bucks);
  }, [memberData, selectedConnections, aiResearch]);

  const handleSearchExisting = async () => {
    setLoading(true);
    try {
      // Search existing members
      const results = existingMembers.filter(member => {
        const name = `${member.profile.firstName} ${member.profile.lastName} ${member.profile.displayName}`.toLowerCase();
        return name.includes(searchQuery.toLowerCase());
      });
      
      if (results.length > 0) {
        // Show existing members
        console.log('Found existing members:', results);
      } else {
        // Proceed to add new member
        const names = searchQuery.split(' ');
        setMemberData(prev => ({
          ...prev,
          firstName: names[0] || '',
          lastName: names.slice(1).join(' ') || '',
          displayName: searchQuery
        }));
        setStep('details');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIResearch = async () => {
    setAiLoading(true);
    try {
      const prompt = `Research ${memberData.displayName || `${memberData.firstName} ${memberData.lastName}`}
        ${memberData.birthDate ? `born ${memberData.birthDate}` : ''}
        ${memberData.birthPlace ? `in ${memberData.birthPlace}` : ''}
        ${memberData.occupation ? `who worked as ${memberData.occupation}` : ''}
        
        Please find:
        1. Biographical information
        2. Important life events
        3. Family connections
        4. Achievements and contributions
        5. Historical context
        6. Any available photos or documents
        
        Format the response as a structured biography that could be displayed on a family tree profile.`;

      // This would normally call your AI service
      // For now, we'll simulate with a placeholder
      openDrawerWithPrompt(prompt, {
        context: 'familyTreeResearch',
        memberData,
        onResponse: (response) => {
          setAiResearch(response);
          // Parse AI response to extract additional data
          parseAIResponse(response);
        }
      });
    } catch (error) {
      console.error('AI research error:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const parseAIResponse = (response) => {
    // Parse AI response to extract structured data
    // This would be more sophisticated in production
    console.log('Parsing AI response:', response);
    
    // Update member data with extracted information
    setMemberData(prev => ({
      ...prev,
      bio: response.biography || prev.bio,
      achievements: response.achievements || prev.achievements,
      // ... other extracted fields
    }));
  };

  const validateMemberData = () => {
    const errors = {};
    
    if (!memberData.firstName && !memberData.lastName) {
      errors.name = 'Please provide at least a first or last name';
    }
    
    if (memberData.birthDate && memberData.deathDate) {
      const birth = new Date(memberData.birthDate);
      const death = new Date(memberData.deathDate);
      if (birth > death) {
        errors.dates = 'Birth date cannot be after death date';
      }
    }
    
    if (memberData.email && !memberData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Invalid email format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveMember = async () => {
    if (!validateMemberData()) {
      return;
    }

    setLoading(true);
    try {
      // Create the new member
      const newMember = await FamilyTreeService.addFamilyMember(familyId, {
        ...memberData,
        displayName: memberData.displayName || `${memberData.firstName} ${memberData.lastName}`.trim(),
        relationships: selectedConnections.map(conn => ({
          toMemberId: conn.memberId,
          type: conn.type,
          metadata: conn.metadata || {}
        }))
      });

      // Award Palsson Bucks to the current user (child)
      if (currentUser && bucksEarned > 0) {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          palssonBucks: increment(bucksEarned)
        });

        // Log the transaction
        const transaction = {
          userId: currentUser.uid,
          amount: bucksEarned,
          type: 'earned',
          reason: `Added family member: ${newMember.profile.displayName}`,
          timestamp: new Date(),
          metadata: {
            familyMemberId: newMember.id,
            completeness: calculateCompleteness()
          }
        };
        
        // You might want to store this transaction in a separate collection
        console.log('Bucks transaction:', transaction);
      }

      if (onMemberAdded) {
        onMemberAdded(newMember);
      }

      // Show success state
      setStep('success');
      
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (error) {
      console.error('Error saving member:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompleteness = () => {
    const fields = [
      memberData.firstName,
      memberData.lastName,
      memberData.gender,
      memberData.birthDate,
      memberData.birthPlace,
      memberData.occupation,
      memberData.education,
      memberData.photoUrl,
      memberData.bio
    ];
    
    const filledFields = fields.filter(field => field && field.length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'search', label: 'Search', icon: Search },
      { id: 'details', label: 'Details', icon: User },
      { id: 'research', label: 'Research', icon: Sparkles },
      { id: 'connections', label: 'Connections', icon: Link },
      { id: 'review', label: 'Review', icon: Check }
    ];

    const currentIndex = steps.findIndex(s => s.id === step);

    return (
      <div className="flex items-center justify-between mb-6">
        {steps.map((s, index) => (
          <div key={s.id} className="flex items-center flex-1">
            <button
              onClick={() => index < currentIndex && setStep(s.id)}
              disabled={index > currentIndex}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                index === currentIndex
                  ? 'bg-blue-600 text-white'
                  : index < currentIndex
                  ? 'bg-green-100 text-green-600 cursor-pointer hover:bg-green-200'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <s.icon className="h-5 w-5" />
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-green-300' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSearchStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Who would you like to add to your family tree?
        </h3>
        <p className="text-sm text-gray-600">
          Search for an existing family member or add someone new
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearchExisting()}
          placeholder="Enter their name (e.g., Grandma Mary, Uncle John)"
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">Earn Palsson Bucks!</p>
            <p className="text-sm text-blue-700">
              Add family members to earn bucks. The more complete the profile, the more you earn!
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Tell us about {memberData.displayName || 'this family member'}
        </h3>
        <p className="text-sm text-gray-600">
          Add as much information as you know. You can always update it later!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <NotionInput
            value={memberData.firstName}
            onChange={(e) => setMemberData({ ...memberData, firstName: e.target.value })}
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <NotionInput
            value={memberData.lastName}
            onChange={(e) => setMemberData({ ...memberData, lastName: e.target.value })}
            placeholder="Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nickname
          </label>
          <NotionInput
            value={memberData.nickname}
            onChange={(e) => setMemberData({ ...memberData, nickname: e.target.value })}
            placeholder="Johnny"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            value={memberData.gender}
            onChange={(e) => setMemberData({ ...memberData, gender: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer-not-to-say">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="inline h-4 w-4 mr-1" />
            Birth Date
          </label>
          <NotionInput
            type="date"
            value={memberData.birthDate}
            onChange={(e) => setMemberData({ ...memberData, birthDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="inline h-4 w-4 mr-1" />
            Birth Place
          </label>
          <NotionInput
            value={memberData.birthPlace}
            onChange={(e) => setMemberData({ ...memberData, birthPlace: e.target.value })}
            placeholder="City, State/Country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Briefcase className="inline h-4 w-4 mr-1" />
            Occupation
          </label>
          <NotionInput
            value={memberData.occupation}
            onChange={(e) => setMemberData({ ...memberData, occupation: e.target.value })}
            placeholder="Teacher, Engineer, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <School className="inline h-4 w-4 mr-1" />
            Education
          </label>
          <NotionInput
            value={memberData.education}
            onChange={(e) => setMemberData({ ...memberData, education: e.target.value })}
            placeholder="University, High School, etc."
          />
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={!memberData.isLiving}
            onChange={(e) => setMemberData({ ...memberData, isLiving: !e.target.checked })}
            className="rounded text-blue-600"
          />
          <span className="text-sm text-gray-700">This person has passed away</span>
        </label>
      </div>

      {!memberData.isLiving && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Death Date
            </label>
            <NotionInput
              type="date"
              value={memberData.deathDate}
              onChange={(e) => setMemberData({ ...memberData, deathDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Death Place
            </label>
            <NotionInput
              value={memberData.deathPlace}
              onChange={(e) => setMemberData({ ...memberData, deathPlace: e.target.value })}
              placeholder="City, State/Country"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Camera className="inline h-4 w-4 mr-1" />
          Photo URL
        </label>
        <NotionInput
          value={memberData.photoUrl}
          onChange={(e) => setMemberData({ ...memberData, photoUrl: e.target.value })}
          placeholder="https://example.com/photo.jpg"
        />
        {memberData.photoUrl && (
          <img 
            src={memberData.photoUrl} 
            alt="Preview" 
            className="mt-2 w-24 h-24 rounded-lg object-cover"
            onError={(e) => e.target.style.display = 'none'}
          />
        )}
      </div>

      {validationErrors.name && (
        <div className="text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {validationErrors.name}
        </div>
      )}
    </div>
  );

  const renderResearchStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Let Allie help research {memberData.displayName || 'this family member'}
        </h3>
        <p className="text-sm text-gray-600">
          Our AI can search the internet for additional information about your family member
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900">AI-Powered Research</h4>
            <p className="text-sm text-gray-600 mt-1">
              Find biographical information, historical records, and more
            </p>
          </div>
          <Sparkles className="h-8 w-8 text-purple-600" />
        </div>

        {!aiResearch && (
          <NotionButton
            onClick={handleAIResearch}
            variant="primary"
            icon={aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            disabled={aiLoading}
            className="w-full"
          >
            {aiLoading ? 'Researching...' : 'Start AI Research'}
          </NotionButton>
        )}

        {aiResearch && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Research Results</h5>
            <div className="prose prose-sm max-w-none text-gray-600">
              {/* This would display the AI research results */}
              <p>AI research results would appear here...</p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Biography / Life Story
        </label>
        <textarea
          value={memberData.bio}
          onChange={(e) => setMemberData({ ...memberData, bio: e.target.value })}
          placeholder="Tell their story... What made them special? What did they love? What are your favorite memories?"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Trophy className="inline h-4 w-4 mr-1" />
          Achievements & Accomplishments
        </label>
        <NotionInput
          value={memberData.achievements.join(', ')}
          onChange={(e) => setMemberData({ 
            ...memberData, 
            achievements: e.target.value.split(',').map(s => s.trim()).filter(s => s)
          })}
          placeholder="Military service, Awards, Career milestones, etc. (comma-separated)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          <Heart className="inline h-4 w-4 mr-1" />
          Interests & Hobbies
        </label>
        <NotionInput
          value={memberData.interests.join(', ')}
          onChange={(e) => setMemberData({ 
            ...memberData, 
            interests: e.target.value.split(',').map(s => s.trim()).filter(s => s)
          })}
          placeholder="Gardening, Reading, Travel, etc. (comma-separated)"
        />
      </div>
    </div>
  );

  const renderConnectionsStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Connect {memberData.displayName} to your family tree
        </h3>
        <p className="text-sm text-gray-600">
          How is this person related to other family members?
        </p>
      </div>

      <div className="space-y-4">
        {existingMembers.map(member => (
          <div key={member.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {member.profile.photoUrl ? (
                  <img 
                    src={member.profile.photoUrl} 
                    alt={member.profile.displayName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{member.profile.displayName}</p>
                  <p className="text-sm text-gray-500">
                    {member.profile.birthDate ? `Born ${new Date(member.profile.birthDate).getFullYear()}` : ''}
                  </p>
                </div>
              </div>

              <select
                onChange={(e) => {
                  const type = e.target.value;
                  if (type) {
                    setSelectedConnections(prev => [
                      ...prev.filter(c => c.memberId !== member.id),
                      { memberId: member.id, type }
                    ]);
                  } else {
                    setSelectedConnections(prev => prev.filter(c => c.memberId !== member.id));
                  }
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select relationship...</option>
                <option value="parent">Parent of {memberData.firstName}</option>
                <option value="child">Child of {memberData.firstName}</option>
                <option value="spouse">Spouse of {memberData.firstName}</option>
                <option value="sibling">Sibling of {memberData.firstName}</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {selectedConnections.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No connections selected yet</p>
          <p className="text-xs mt-1">You can add connections later if needed</p>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Review & Save
        </h3>
        <p className="text-sm text-gray-600">
          Make sure everything looks good before adding to your family tree
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-start gap-4">
          {memberData.photoUrl ? (
            <img 
              src={memberData.photoUrl} 
              alt={memberData.displayName}
              className="w-24 h-24 rounded-lg object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-900">
              {memberData.displayName || `${memberData.firstName} ${memberData.lastName}`.trim()}
            </h4>
            {memberData.nickname && (
              <p className="text-sm text-gray-600">"{memberData.nickname}"</p>
            )}

            <div className="mt-3 space-y-1 text-sm">
              {memberData.birthDate && (
                <p className="text-gray-700">
                  <Cake className="inline h-4 w-4 mr-1 text-gray-400" />
                  Born {new Date(memberData.birthDate).toLocaleDateString()}
                  {memberData.birthPlace && ` in ${memberData.birthPlace}`}
                </p>
              )}
              {memberData.occupation && (
                <p className="text-gray-700">
                  <Briefcase className="inline h-4 w-4 mr-1 text-gray-400" />
                  {memberData.occupation}
                </p>
              )}
              {memberData.education && (
                <p className="text-gray-700">
                  <School className="inline h-4 w-4 mr-1 text-gray-400" />
                  {memberData.education}
                </p>
              )}
            </div>
          </div>
        </div>

        {memberData.bio && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 leading-relaxed">{memberData.bio}</p>
          </div>
        )}

        {(memberData.achievements.length > 0 || memberData.interests.length > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            {memberData.achievements.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Achievements</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {memberData.achievements.map((achievement, index) => (
                    <NotionBadge key={index} variant="success" size="sm">
                      <Trophy className="h-3 w-3 mr-1" />
                      {achievement}
                    </NotionBadge>
                  ))}
                </div>
              </div>
            )}
            {memberData.interests.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Interests</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {memberData.interests.map((interest, index) => (
                    <NotionBadge key={index} variant="info" size="sm">
                      <Heart className="h-3 w-3 mr-1" />
                      {interest}
                    </NotionBadge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Coins className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-green-900">
              You'll earn {bucksEarned} Palsson Bucks!
            </p>
            <p className="text-sm text-green-700 mt-1">
              Profile completeness: {calculateCompleteness()}%
            </p>
          </div>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Please fix these issues:</p>
              <ul className="text-sm text-red-700 mt-1 list-disc list-inside">
                {Object.values(validationErrors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Successfully Added!
      </h3>
      <p className="text-gray-600 mb-4">
        {memberData.displayName || `${memberData.firstName} ${memberData.lastName}`} has been added to your family tree
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <Coins className="h-5 w-5 text-green-600" />
        <span className="font-medium text-green-900">
          You earned {bucksEarned} Palsson Bucks!
        </span>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Add Family Member
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step !== 'success' && renderStepIndicator()}
          
          {step === 'search' && renderSearchStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'research' && renderResearchStep()}
          {step === 'connections' && renderConnectionsStep()}
          {step === 'review' && renderReviewStep()}
          {step === 'success' && renderSuccessStep()}
        </div>

        {step !== 'success' && (
          <div className="p-6 border-t border-gray-200 flex justify-between">
            <NotionButton
              onClick={() => {
                const steps = ['search', 'details', 'research', 'connections', 'review'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }}
              variant="secondary"
              icon={<ChevronLeft className="h-4 w-4" />}
              disabled={step === 'search'}
            >
              Back
            </NotionButton>

            <NotionButton
              onClick={() => {
                if (step === 'search') {
                  handleSearchExisting();
                } else if (step === 'review') {
                  handleSaveMember();
                } else {
                  const steps = ['search', 'details', 'research', 'connections', 'review'];
                  const currentIndex = steps.indexOf(step);
                  setStep(steps[currentIndex + 1]);
                }
              }}
              variant="primary"
              icon={step === 'review' ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              disabled={loading}
            >
              {step === 'search' ? 'Next' : step === 'review' ? 'Save & Earn Bucks' : 'Continue'}
            </NotionButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddFamilyMemberFlow;