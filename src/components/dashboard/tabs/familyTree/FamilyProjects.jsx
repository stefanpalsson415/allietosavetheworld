import React, { useState } from 'react';
import { NotionButton, NotionBadge } from '../../../common/NotionUI';
import { 
  Heart, Users, Camera, BookOpen, Video, Mic, Gift, Star,
  Trophy, MessageCircle, Target, CheckCircle, Clock, Award,
  Sparkles, Lightbulb, Palette, Music, Utensils, Map,
  Calendar, Share2, Download, Plus
} from 'lucide-react';

const FamilyProjects = ({ familyId, currentUser, onAskAllie }) => {
  const [activeProject, setActiveProject] = useState(null);
  const [completedActivities, setCompletedActivities] = useState([]);

  const projects = [
    {
      id: 'interview-elders',
      title: 'Interview the Elders',
      description: 'Capture precious stories and memories from older family members',
      icon: Mic,
      color: 'bg-purple-100 text-purple-800',
      difficulty: 'Easy',
      timeEstimate: '1-2 hours',
      participants: 'All ages',
      activities: [
        { id: 'prep', title: 'Prepare interview questions', points: 10 },
        { id: 'schedule', title: 'Schedule interview time', points: 5 },
        { id: 'record', title: 'Record the interview', points: 20 },
        { id: 'transcribe', title: 'Transcribe key stories', points: 15 },
        { id: 'share', title: 'Share with family', points: 10 }
      ]
    },
    {
      id: 'photo-detective',
      title: 'Photo Detective',
      description: 'Identify people and stories in old family photos',
      icon: Camera,
      color: 'bg-blue-100 text-blue-800',
      difficulty: 'Easy',
      timeEstimate: '30 mins - 1 hour',
      participants: 'Kids & Adults',
      activities: [
        { id: 'gather', title: 'Gather old photos', points: 10 },
        { id: 'scan', title: 'Scan or photograph them', points: 15 },
        { id: 'identify', title: 'Identify people in photos', points: 20 },
        { id: 'date', title: 'Add dates and locations', points: 10 },
        { id: 'story', title: 'Write photo stories', points: 15 }
      ]
    },
    {
      id: 'recipe-book',
      title: 'Family Recipe Collection',
      description: 'Preserve cherished family recipes and food traditions',
      icon: Utensils,
      color: 'bg-green-100 text-green-800',
      difficulty: 'Medium',
      timeEstimate: '2-3 hours',
      participants: 'All ages',
      activities: [
        { id: 'list', title: 'List family favorite dishes', points: 5 },
        { id: 'collect', title: 'Collect recipes from relatives', points: 15 },
        { id: 'cook', title: 'Cook and photograph dishes', points: 20 },
        { id: 'stories', title: 'Add recipe origin stories', points: 15 },
        { id: 'book', title: 'Create digital recipe book', points: 20 }
      ]
    },
    {
      id: 'heritage-map',
      title: 'Heritage Journey Map',
      description: 'Map your family\'s migration story across generations',
      icon: Map,
      color: 'bg-orange-100 text-orange-800',
      difficulty: 'Medium',
      timeEstimate: '1-2 hours',
      participants: 'Ages 8+',
      activities: [
        { id: 'origins', title: 'Mark ancestral homelands', points: 10 },
        { id: 'journey', title: 'Trace migration paths', points: 15 },
        { id: 'dates', title: 'Add migration dates', points: 10 },
        { id: 'reasons', title: 'Document why they moved', points: 15 },
        { id: 'visualize', title: 'Create visual timeline', points: 20 }
      ]
    },
    {
      id: 'time-capsule',
      title: 'Digital Time Capsule',
      description: 'Create messages and memories for future family members',
      icon: Gift,
      color: 'bg-pink-100 text-pink-800',
      difficulty: 'Easy',
      timeEstimate: '1 hour',
      participants: 'All ages',
      activities: [
        { id: 'plan', title: 'Plan capsule contents', points: 10 },
        { id: 'letters', title: 'Write letters to future', points: 20 },
        { id: 'photos', title: 'Add current photos', points: 10 },
        { id: 'predictions', title: 'Make family predictions', points: 15 },
        { id: 'seal', title: 'Set opening date', points: 5 }
      ]
    },
    {
      id: 'talent-show',
      title: 'Family Talent Showcase',
      description: 'Document unique skills and talents across generations',
      icon: Star,
      color: 'bg-yellow-100 text-yellow-800',
      difficulty: 'Easy',
      timeEstimate: '2-3 hours',
      participants: 'All ages',
      activities: [
        { id: 'survey', title: 'Survey family talents', points: 10 },
        { id: 'showcase', title: 'Record performances', points: 20 },
        { id: 'teach', title: 'Teach skills to others', points: 15 },
        { id: 'document', title: 'Create talent profiles', points: 15 },
        { id: 'celebrate', title: 'Host virtual talent show', points: 20 }
      ]
    }
  ];

  const kidsActivities = [
    {
      title: 'Draw Your Family Tree',
      icon: Palette,
      age: '5-10',
      description: 'Create a colorful artistic version of your family tree'
    },
    {
      title: 'Family Reporter',
      icon: Mic,
      age: '8-12',
      description: 'Interview family members like a news reporter'
    },
    {
      title: 'Photo Scavenger Hunt',
      icon: Camera,
      age: '6-14',
      description: 'Find family members in old photos'
    },
    {
      title: 'Story Time Machine',
      icon: BookOpen,
      age: '5-12',
      description: 'Record yourself reading family stories'
    }
  ];

  const handleActivityComplete = (projectId, activityId) => {
    const key = `${projectId}-${activityId}`;
    if (!completedActivities.includes(key)) {
      setCompletedActivities([...completedActivities, key]);
    }
  };

  const getProjectProgress = (project) => {
    const completed = project.activities.filter(activity => 
      completedActivities.includes(`${project.id}-${activity.id}`)
    ).length;
    return (completed / project.activities.length) * 100;
  };

  const getTotalPoints = () => {
    return projects.reduce((total, project) => {
      return total + project.activities.reduce((projectTotal, activity) => {
        if (completedActivities.includes(`${project.id}-${activity.id}`)) {
          return projectTotal + activity.points;
        }
        return projectTotal;
      }, 0);
    }, 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Projects</h2>
        <p className="text-gray-600">
          Fun activities to build your family story together
        </p>
        
        {/* Points tracker */}
        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-gray-900">Family Points:</span>
            </div>
            <span className="text-2xl font-bold text-yellow-600">{getTotalPoints()}</span>
          </div>
        </div>
      </div>

      {/* Active Project */}
      {activeProject ? (
        <div className="mb-8">
          <button
            onClick={() => setActiveProject(null)}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to all projects
          </button>
          
          <ProjectDetail
            project={activeProject}
            completedActivities={completedActivities}
            onActivityComplete={handleActivityComplete}
            onAskAllie={onAskAllie}
          />
        </div>
      ) : (
        <>
          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {projects.map(project => {
              const progress = getProjectProgress(project);
              
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setActiveProject(project)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${project.color}`}>
                      <project.icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <NotionBadge color="gray" size="sm">{project.difficulty}</NotionBadge>
                      <p className="text-xs text-gray-500 mt-1">{project.timeEstimate}</p>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{project.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-500">
                      <Users className="h-3 w-3 inline mr-1" />
                      {project.participants}
                    </span>
                    <span className="text-xs font-medium text-purple-600">
                      Start Project →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Kids Corner */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Kids' Corner
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kidsActivities.map((activity, index) => (
                <div key={index} className="bg-white rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <activity.icon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-xs text-gray-500 mb-1">Ages {activity.age}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <NotionButton
              onClick={() => onAskAllie(null, "Give me more kid-friendly family tree activities")}
              variant="primary"
              className="mt-4"
              icon={<MessageCircle className="h-4 w-4" />}
            >
              Get More Kids Activities
            </NotionButton>
          </div>
        </>
      )}
    </div>
  );
};

// Project Detail Component
const ProjectDetail = ({ project, completedActivities, onActivityComplete, onAskAllie }) => {
  const [showTips, setShowTips] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Project Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${project.color}`}>
            <project.icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
            <p className="text-gray-600 mb-4">{project.description}</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-gray-500" />
                {project.timeEstimate}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4 text-gray-500" />
                {project.participants}
              </span>
              <NotionBadge color="gray">{project.difficulty}</NotionBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Checklist */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Project Steps</h3>
        <div className="space-y-3">
          {project.activities.map((activity, index) => {
            const isCompleted = completedActivities.includes(`${project.id}-${activity.id}`);
            
            return (
              <div
                key={activity.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => onActivityComplete(project.id, activity.id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-600 border-green-600' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {isCompleted && <CheckCircle className="h-4 w-4 text-white" />}
                </button>
                
                <div className="flex-1">
                  <p className={`font-medium ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {index + 1}. {activity.title}
                  </p>
                </div>
                
                <NotionBadge color={isCompleted ? 'green' : 'gray'} size="sm">
                  {activity.points} pts
                </NotionBadge>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips and Help */}
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium mb-4"
        >
          <Lightbulb className="h-4 w-4" />
          {showTips ? 'Hide Tips' : 'Show Tips & Ideas'}
        </button>
        
        {showTips && (
          <div className="space-y-3 mb-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Pro Tips:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                <li>• Make it fun - this isn't homework!</li>
                <li>• Involve multiple generations for richer stories</li>
                <li>• Use video calls to include distant relatives</li>
                <li>• Save everything - even "boring" details matter</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <NotionButton
            onClick={() => onAskAllie(null, `Help me with the ${project.title} project`)}
            variant="primary"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Get Help from Allie
          </NotionButton>
          
          <NotionButton
            variant="outline"
            icon={<Share2 className="h-4 w-4" />}
          >
            Share Progress
          </NotionButton>
        </div>
      </div>
    </div>
  );
};

export default FamilyProjects;