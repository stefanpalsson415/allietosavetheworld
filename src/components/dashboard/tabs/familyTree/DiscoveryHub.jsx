import React, { useState, useEffect } from 'react';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import { NotionButton, NotionBadge } from '../../../common/NotionUI';
import { 
  Search, Sparkles, TrendingUp, Users, MapPin, Briefcase,
  Calendar, Heart, Link, Globe, BookOpen, Award, MessageCircle,
  BarChart3, PieChart, Activity, Lightbulb, Zap, Info, FileText
} from 'lucide-react';

const DiscoveryHub = ({ familyId, treeData, onMemberSelect, onAskAllie }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeInsight, setActiveInsight] = useState('patterns');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadInsights();
  }, [familyId]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const insightData = await FamilyTreeService.getFamilyInsights(familyId);
      setInsights(insightData);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    onAskAllie(null, `Search for ${searchQuery} in our family tree and tell me what you find.`);
  };

  const insightCategories = [
    { id: 'patterns', label: 'Patterns', icon: Activity, color: 'text-blue-600' },
    { id: 'connections', label: 'Connections', icon: Link, color: 'text-purple-600' },
    { id: 'locations', label: 'Locations', icon: MapPin, color: 'text-green-600' },
    { id: 'careers', label: 'Careers', icon: Briefcase, color: 'text-orange-600' },
    { id: 'traits', label: 'Traits', icon: Sparkles, color: 'text-pink-600' },
    { id: 'research', label: 'Research', icon: Search, color: 'text-indigo-600' }
  ];

  const discoveryPrompts = [
    "What professions run in our family?",
    "Show me migration patterns across generations",
    "Find all military service members",
    "Who lived the longest in our family?",
    "What are common first names across generations?",
    "Find all teachers in our family tree",
    "Show me family members born in the same month",
    "What cultural traditions have been passed down?",
    "Find relatives who share my interests",
    "Show me the family's geographic spread"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Search */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Discovery Hub</h2>
        
        {/* AI-Powered Search */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI-Powered Family Search</h3>
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about your family history..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <NotionButton
              onClick={handleSearch}
              variant="primary"
              icon={<MessageCircle className="h-4 w-4" />}
            >
              Ask Allie
            </NotionButton>
          </div>
          
          {/* Quick prompts */}
          <div className="mt-3 flex flex-wrap gap-2">
            <p className="text-sm text-gray-600 w-full mb-1">Try asking:</p>
            {discoveryPrompts.slice(0, 4).map((prompt, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(prompt);
                  onAskAllie(null, prompt);
                }}
                className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Insight Categories */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {insightCategories.map(category => (
          <NotionButton
            key={category.id}
            onClick={() => setActiveInsight(category.id)}
            variant={activeInsight === category.id ? 'primary' : 'outline'}
            size="sm"
            icon={<category.icon className={`h-4 w-4 ${category.color}`} />}
          >
            {category.label}
          </NotionButton>
        ))}
      </div>

      {/* Insights Content */}
      <div className="space-y-6">
        {activeInsight === 'patterns' && insights && (
          <FamilyPatterns insights={insights} treeData={treeData} onMemberSelect={onMemberSelect} />
        )}
        
        {activeInsight === 'connections' && (
          <FamilyConnections treeData={treeData} onMemberSelect={onMemberSelect} onAskAllie={onAskAllie} />
        )}
        
        {activeInsight === 'locations' && insights && (
          <LocationInsights insights={insights} treeData={treeData} />
        )}
        
        {activeInsight === 'careers' && insights && (
          <CareerInsights insights={insights} treeData={treeData} onMemberSelect={onMemberSelect} />
        )}
        
        {activeInsight === 'traits' && (
          <TraitAnalysis treeData={treeData} onAskAllie={onAskAllie} />
        )}
        
        {activeInsight === 'research' && (
          <ResearchSuggestions treeData={treeData} onAskAllie={onAskAllie} />
        )}
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <InsightCard
          icon={Users}
          title="Missing Connections"
          value="12"
          description="Potential family members to research"
          color="bg-blue-100 text-blue-800"
          onClick={() => onAskAllie(null, "Help me find missing family connections")}
        />
        
        <InsightCard
          icon={Calendar}
          title="Date Gaps"
          value="8"
          description="Members missing birth or death dates"
          color="bg-orange-100 text-orange-800"
          onClick={() => onAskAllie(null, "Show me family members with missing dates")}
        />
        
        <InsightCard
          icon={MapPin}
          title="Location Mysteries"
          value="5"
          description="Unknown birthplaces to discover"
          color="bg-green-100 text-green-800"
          onClick={() => onAskAllie(null, "Help me find missing location information")}
        />
        
        <InsightCard
          icon={BookOpen}
          title="Untold Stories"
          value="15"
          description="Members without any stories yet"
          color="bg-purple-100 text-purple-800"
          onClick={() => onAskAllie(null, "Which family members need their stories told?")}
        />
        
        <InsightCard
          icon={Link}
          title="DNA Matches"
          value="Ready"
          description="Import DNA matches to find relatives"
          color="bg-pink-100 text-pink-800"
          onClick={() => onAskAllie(null, "How can I import DNA matches?")}
        />
        
        <InsightCard
          icon={Globe}
          title="Heritage Research"
          value="3"
          description="Countries to explore for ancestry"
          color="bg-indigo-100 text-indigo-800"
          onClick={() => onAskAllie(null, "Help me research our family heritage")}
        />
      </div>
    </div>
  );
};

// Sub-components

const FamilyPatterns = ({ insights, treeData, onMemberSelect }) => {
  return (
    <div className="space-y-6">
      {/* Name Patterns */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600" />
          Name Patterns Across Generations
        </h3>
        
        {insights.namePatterns && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Popular First Names</h4>
              <div className="space-y-2">
                {insights.namePatterns.popularFirstNames.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-gray-700">{name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / treeData.members.length) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Family Surnames</h4>
              <div className="space-y-2">
                {insights.namePatterns.familyNames.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-gray-700">{name}</span>
                    <NotionBadge color="purple">{count} members</NotionBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generation Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Generation Statistics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {treeData.members.filter(m => m.metadata?.generation === 0).length}
            </p>
            <p className="text-sm text-gray-600">Founders</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {Math.max(...treeData.members.map(m => m.metadata?.generation || 0)) + 1}
            </p>
            <p className="text-sm text-gray-600">Generations</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {treeData.members.filter(m => !m.profile.isLiving).length}
            </p>
            <p className="text-sm text-gray-600">Ancestors</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">
              {treeData.members.filter(m => m.profile.isLiving).length}
            </p>
            <p className="text-sm text-gray-600">Living</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FamilyConnections = ({ treeData, onMemberSelect, onAskAllie }) => {
  const connectionTypes = [
    { type: 'parent', count: 0, color: 'text-blue-600' },
    { type: 'spouse', count: 0, color: 'text-pink-600' },
    { type: 'sibling', count: 0, color: 'text-green-600' },
    { type: 'child', count: 0, color: 'text-purple-600' }
  ];

  // Count relationships
  treeData.relationships.forEach(rel => {
    const type = connectionTypes.find(t => t.type === rel.type);
    if (type) type.count++;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Link className="h-5 w-5 text-purple-600" />
          Relationship Network
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {connectionTypes.map(type => (
            <div key={type.type} className="text-center">
              <p className={`text-3xl font-bold ${type.color}`}>{type.count}</p>
              <p className="text-sm text-gray-600 capitalize">{type.type} relationships</p>
            </div>
          ))}
        </div>

        <NotionButton
          onClick={() => onAskAllie(null, "Analyze the relationship patterns in our family tree")}
          variant="outline"
          className="w-full"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          Analyze Relationship Patterns
        </NotionButton>
      </div>

      {/* Missing Connections */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Potential Missing Connections
        </h3>
        <p className="text-gray-700 mb-4">
          Based on the family structure, here are some potential gaps to explore:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            Members with only one parent listed
          </li>
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            Spouses without marriage dates
          </li>
          <li className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-600" />
            Single children (potential siblings missing)
          </li>
        </ul>
      </div>
    </div>
  );
};

const LocationInsights = ({ insights, treeData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-green-600" />
          Geographic Distribution
        </h3>
        
        {insights.locationHistory && Object.keys(insights.locationHistory).length > 0 ? (
          <div className="space-y-3">
            {Object.entries(insights.locationHistory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([location, count]) => (
                <div key={location} className="flex items-center justify-between">
                  <span className="text-gray-700">{location}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(count / treeData.members.length) * 100}%` }}
                      />
                    </div>
                    <NotionBadge color="green">{count}</NotionBadge>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">Add birthplaces to see geographic patterns</p>
        )}
      </div>

      {/* Migration suggestion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Track Your Family's Journey
        </h3>
        <p className="text-gray-700 mb-4">
          Add birthplaces and residences to visualize migration patterns across generations.
        </p>
        <NotionButton variant="primary" icon={<Globe className="h-4 w-4" />}>
          Add Location Data
        </NotionButton>
      </div>
    </div>
  );
};

const CareerInsights = ({ insights, treeData, onMemberSelect }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-orange-600" />
          Professional Heritage
        </h3>
        
        {insights.occupationTrends && Object.keys(insights.occupationTrends).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(insights.occupationTrends)
              .sort((a, b) => b[1] - a[1])
              .map(([occupation, count]) => (
                <div key={occupation} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">{occupation}</span>
                  <NotionBadge color="orange">{count} {count === 1 ? 'person' : 'people'}</NotionBadge>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-600">Add occupations to discover career patterns</p>
        )}
      </div>

      {/* Career timeline suggestion */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Career Evolution
        </h3>
        <p className="text-gray-700">
          Track how professions have evolved across generations in your family.
        </p>
      </div>
    </div>
  );
};

const TraitAnalysis = ({ treeData, onAskAllie }) => {
  const traitCategories = [
    { name: 'Physical Traits', icon: Users, examples: ['Eye color', 'Height', 'Hair color'] },
    { name: 'Talents & Skills', icon: Award, examples: ['Musical ability', 'Athletics', 'Art'] },
    { name: 'Health Patterns', icon: Heart, examples: ['Longevity', 'Common conditions'] },
    { name: 'Personality Traits', icon: Sparkles, examples: ['Leadership', 'Creativity', 'Humor'] }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Family Trait Analysis
        </h3>
        
        <p className="text-gray-700 mb-6">
          Discover patterns in physical traits, talents, and characteristics that run through your family.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {traitCategories.map(category => (
            <div key={category.name} className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <category.icon className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">{category.name}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Track: {category.examples.join(', ')}
              </p>
              <NotionButton
                onClick={() => onAskAllie(null, `Help me analyze ${category.name.toLowerCase()} in our family`)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Analyze
              </NotionButton>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResearchSuggestions = ({ treeData, onAskAllie }) => {
  const researchTips = [
    {
      title: "Interview Living Relatives",
      description: "Capture stories and memories while you can",
      icon: Users,
      action: "Generate interview questions"
    },
    {
      title: "Document Sources",
      description: "Add birth certificates, photos, and records",
      icon: FileText,
      action: "Learn about documentation"
    },
    {
      title: "DNA Testing",
      description: "Connect with genetic matches",
      icon: Zap,
      action: "Guide me through DNA testing"
    },
    {
      title: "Historical Records",
      description: "Search census, immigration, and military records",
      icon: Search,
      action: "Help me search records"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-indigo-600" />
          Research Recommendations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {researchTips.map(tip => (
            <div key={tip.title} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <tip.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{tip.description}</p>
                  <button
                    onClick={() => onAskAllie(null, tip.action)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    {tip.action} →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Your Next Research Steps
        </h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li>1. Complete profiles for living family members</li>
          <li>2. Add photos and documents you already have</li>
          <li>3. Interview elderly relatives about family history</li>
          <li>4. Research public records for missing information</li>
        </ol>
        <NotionButton
          onClick={() => onAskAllie(null, "Create a personalized research plan for my family tree")}
          variant="primary"
          className="mt-4"
          icon={<MessageCircle className="h-4 w-4" />}
        >
          Get Personalized Research Plan
        </NotionButton>
      </div>
    </div>
  );
};

const InsightCard = ({ icon: Icon, title, value, description, color, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold text-gray-900">{value}</span>
      </div>
      <h4 className="font-medium text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
};

export default DiscoveryHub;