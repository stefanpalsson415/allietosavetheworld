import React, { useState } from 'react';
import { NotionButton, NotionInput } from '../../../common/NotionUI';
import { 
  X, User, Users, Calendar, MapPin, Briefcase, 
  Phone, Mail, ChevronRight, ChevronLeft
} from 'lucide-react';
import MapboxLocationInput from '../../../common/MapboxLocationInput';

const QuickAddMember = ({ isOpen, onClose, onAdd, existingMembers }) => {
  const [step, setStep] = useState(1);
  const [memberData, setMemberData] = useState({
    displayName: '',
    firstName: '',
    lastName: '',
    middleName: '',
    nickname: '',
    gender: '',
    birthDate: '',
    birthPlace: '',
    isLiving: true,
    deathDate: '',
    deathPlace: '',
    occupation: '',
    education: '',
    email: '',
    phone: '',
    address: '',
    photoUrl: '',
    relationships: []
  });

  const [selectedRelationship, setSelectedRelationship] = useState({
    type: '',
    toMemberId: ''
  });

  const genderOptions = [
    { value: 'male', label: 'Male', icon: '👨' },
    { value: 'female', label: 'Female', icon: '👩' },
    { value: 'other', label: 'Other', icon: '🧑' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: '🤐' }
  ];

  const relationshipTypes = [
    { value: 'parent', label: 'Parent of' },
    { value: 'child', label: 'Child of' },
    { value: 'spouse', label: 'Spouse of' },
    { value: 'sibling', label: 'Sibling of' }
  ];

  const handleSubmit = () => {
    const dataToSubmit = {
      ...memberData,
      displayName: memberData.displayName || `${memberData.firstName} ${memberData.lastName}`.trim(),
      relationships: selectedRelationship.type && selectedRelationship.toMemberId 
        ? [{
            type: selectedRelationship.type,
            toMemberId: selectedRelationship.toMemberId
          }]
        : []
    };
    onAdd(dataToSubmit);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return memberData.firstName && memberData.lastName;
      case 2:
        return true; // All fields optional
      case 3:
        return true; // Relationship optional
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Family Member</h2>
              <p className="text-gray-600 mt-1">Step {step} of 3</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <NotionInput
                    value={memberData.firstName}
                    onChange={(e) => setMemberData({...memberData, firstName: e.target.value})}
                    placeholder="John"
                    icon={<User className="h-4 w-4" />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <NotionInput
                    value={memberData.lastName}
                    onChange={(e) => setMemberData({...memberData, lastName: e.target.value})}
                    placeholder="Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name
                  </label>
                  <NotionInput
                    value={memberData.middleName}
                    onChange={(e) => setMemberData({...memberData, middleName: e.target.value})}
                    placeholder="Michael"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname
                  </label>
                  <NotionInput
                    value={memberData.nickname}
                    onChange={(e) => setMemberData({...memberData, nickname: e.target.value})}
                    placeholder="Johnny"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {genderOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setMemberData({...memberData, gender: option.value})}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        memberData.gender === option.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-1">{option.icon}</span>
                      <p className="text-sm">{option.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={memberData.isLiving}
                    onChange={(e) => setMemberData({...memberData, isLiving: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">Currently living</span>
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Life Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Date
                  </label>
                  <NotionInput
                    type="date"
                    value={memberData.birthDate}
                    onChange={(e) => setMemberData({...memberData, birthDate: e.target.value})}
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birth Place
                  </label>
                  <MapboxLocationInput
                    value={memberData.birthPlace}
                    onChange={(value) => setMemberData({...memberData, birthPlace: value})}
                    onSelect={(location) => {
                      setMemberData({
                        ...memberData, 
                        birthPlace: location.place_name,
                        birthPlaceCoordinates: location.center
                      });
                    }}
                    placeholder="Search for a city or location"
                    className="w-full"
                  />
                </div>

                {!memberData.isLiving && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Death Date
                      </label>
                      <NotionInput
                        type="date"
                        value={memberData.deathDate}
                        onChange={(e) => setMemberData({...memberData, deathDate: e.target.value})}
                        icon={<Calendar className="h-4 w-4" />}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Death Place
                      </label>
                      <NotionInput
                        value={memberData.deathPlace}
                        onChange={(e) => setMemberData({...memberData, deathPlace: e.target.value})}
                        placeholder="City, Country"
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <NotionInput
                    value={memberData.occupation}
                    onChange={(e) => setMemberData({...memberData, occupation: e.target.value})}
                    placeholder="Teacher, Engineer, etc."
                    icon={<Briefcase className="h-4 w-4" />}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Education
                  </label>
                  <NotionInput
                    value={memberData.education}
                    onChange={(e) => setMemberData({...memberData, education: e.target.value})}
                    placeholder="Highest degree or school"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Contact Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <NotionInput
                      type="email"
                      value={memberData.email}
                      onChange={(e) => setMemberData({...memberData, email: e.target.value})}
                      placeholder="john@example.com"
                      icon={<Mail className="h-4 w-4" />}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <NotionInput
                      type="tel"
                      value={memberData.phone}
                      onChange={(e) => setMemberData({...memberData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                      icon={<Phone className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Family Connections</h3>
              <p className="text-gray-600">
                How is {memberData.firstName || 'this person'} related to someone already in the tree?
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {relationshipTypes.map(type => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedRelationship({
                          ...selectedRelationship,
                          type: type.value
                        })}
                        className={`p-3 rounded-lg border-2 text-center transition-colors ${
                          selectedRelationship.type === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedRelationship.type && existingMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Family Member
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                      {existingMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedRelationship({
                            ...selectedRelationship,
                            toMemberId: member.id
                          })}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedRelationship.toMemberId === member.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
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
                              <p className="font-medium text-gray-900">
                                {member.profile.displayName}
                              </p>
                              {member.profile.birthDate && (
                                <p className="text-xs text-gray-500">
                                  Born {new Date(member.profile.birthDate).getFullYear()}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {existingMembers.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      This will be the first person in your family tree!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <NotionButton
            onClick={() => setStep(Math.max(1, step - 1))}
            variant="outline"
            icon={<ChevronLeft className="h-4 w-4" />}
            disabled={step === 1}
          >
            Previous
          </NotionButton>
          
          <div className="flex gap-3">
            <NotionButton onClick={onClose} variant="outline">
              Cancel
            </NotionButton>
            
            {step < 3 ? (
              <NotionButton
                onClick={() => setStep(step + 1)}
                variant="primary"
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="right"
                disabled={!isStepValid()}
              >
                Next
              </NotionButton>
            ) : (
              <NotionButton
                onClick={handleSubmit}
                variant="primary"
                disabled={!isStepValid()}
              >
                Add Family Member
              </NotionButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAddMember;