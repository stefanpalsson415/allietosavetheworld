import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Progress } from '../common/Progress';
import { 
  Heart, 
  Star, 
  Sparkles, 
  Trophy, 
  Users,
  Smile,
  Frown,
  Meh,
  GameController2,
  Book,
  Music,
  Palette,
  Target
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import SiblingDynamicsService from '../../services/SiblingDynamicsService';

const KidSiblingSurvey = ({ childId, onComplete }) => {
  const { currentFamily } = useFamily();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  
  const child = currentFamily?.children?.find(c => c.id === childId);
  const siblings = currentFamily?.children?.filter(c => c.id !== childId) || [];

  // Kid-friendly questions with emojis and simple language
  const questions = [
    // Opening warm-up
    {
      id: 'favorite_sibling_activity',
      type: 'emoji_grid',
      question: `What's your favorite thing to do with your siblings?`,
      options: [
        { emoji: GameController2, label: 'Play games', value: 'games' },
        { emoji: Book, label: 'Read together', value: 'reading' },
        { emoji: Palette, label: 'Art & crafts', value: 'creative' },
        { emoji: Music, label: 'Music & dance', value: 'music' },
        { emoji: Target, label: 'Sports', value: 'sports' },
        { emoji: Users, label: 'Just talk', value: 'talking' }
      ]
    },

    // Individual sibling questions (dynamically generated for each sibling)
    ...siblings.map(sibling => [
      {
        id: `help_from_${sibling.id}`,
        siblingId: sibling.id,
        type: 'emoji_scale',
        question: `How much does ${sibling.name} help you when you need it?`,
        emojis: [
          { icon: Frown, label: 'Never', value: 1, color: 'text-red-500' },
          { icon: Meh, label: 'Sometimes', value: 2, color: 'text-yellow-500' },
          { icon: Smile, label: 'A lot!', value: 3, color: 'text-green-500' }
        ]
      },
      {
        id: `teach_me_${sibling.id}`,
        siblingId: sibling.id,
        type: 'yes_no_maybe',
        question: `Does ${sibling.name} teach you cool things?`,
        followUp: 'What kind of things?'
      },
      {
        id: `play_together_${sibling.id}`,
        siblingId: sibling.id,
        type: 'emoji_scale',
        question: `How fun is it to play with ${sibling.name}?`,
        emojis: [
          { icon: Frown, label: 'Not fun', value: 1, color: 'text-gray-500' },
          { icon: Meh, label: 'OK', value: 2, color: 'text-blue-500' },
          { icon: Star, label: 'Super fun!', value: 3, color: 'text-yellow-500' }
        ]
      },
      {
        id: `look_up_to_${sibling.id}`,
        siblingId: sibling.id,
        type: 'trophy_question',
        question: `Is ${sibling.name} good at something you want to learn?`,
        options: ['Yes! 🌟', 'Maybe 🤔', 'Not really 😊']
      }
    ]).flat(),

    // General sibling questions
    {
      id: 'sibling_team',
      type: 'team_rating',
      question: 'How good is your sibling team at working together?',
      visual: 'team_strength'
    },
    {
      id: 'help_siblings',
      type: 'emoji_grid',
      question: 'What do YOU like to help your siblings with?',
      options: [
        { emoji: Book, label: 'Homework', value: 'homework' },
        { emoji: GameController2, label: 'Games', value: 'games' },
        { emoji: Heart, label: 'When sad', value: 'emotional' },
        { emoji: Sparkles, label: 'New ideas', value: 'creative' },
        { emoji: Trophy, label: 'Getting better', value: 'improvement' }
      ],
      multiSelect: true
    },
    {
      id: 'sibling_superpower',
      type: 'text_with_stickers',
      question: 'If you and your siblings were a superhero team, what would be your team superpower?',
      placeholder: 'Type your answer or pick stickers below!',
      stickers: ['💪', '🚀', '🌟', '🦸‍♀️', '🦸‍♂️', '⚡', '🌈', '🔥']
    },
    {
      id: 'make_siblings_happy',
      type: 'emoji_grid',
      question: 'What makes your siblings happy when you do it?',
      options: [
        { emoji: Heart, label: 'Share toys', value: 'sharing' },
        { emoji: Users, label: 'Include them', value: 'inclusion' },
        { emoji: Sparkles, label: 'Help them', value: 'helping' },
        { emoji: Smile, label: 'Be nice', value: 'kindness' }
      ],
      multiSelect: true
    }
  ];

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleResponse = (value) => {
    setResponses(prev => ({
      ...prev,
      [currentQ.id]: value
    }));
  };

  const handleNext = async () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedEmoji(null);
    } else {
      // Survey complete
      await saveSurveyResponses();
      if (onComplete) onComplete(responses);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const saveSurveyResponses = async () => {
    // Process kid responses to identify positive sibling relationships
    const positiveRelationships = [];
    
    for (const [key, value] of Object.entries(responses)) {
      if (key.startsWith('help_from_') && value >= 2) {
        const siblingId = key.replace('help_from_', '');
        positiveRelationships.push({
          type: 'helping',
          siblingId,
          strength: value
        });
      }
      
      if (key.startsWith('teach_me_') && value === 'yes') {
        const siblingId = key.replace('teach_me_', '');
        await SiblingDynamicsService.trackSpilloverEffect(
          currentFamily.id,
          siblingId,
          childId,
          'teaching',
          { source: 'kid_survey', voluntary: true }
        );
      }
    }

    // Save survey results
    await SiblingDynamicsService.recordSiblingCollaboration(
      currentFamily.id,
      [childId],
      'survey_completion',
      {
        completed: true,
        responses,
        positiveRelationships,
        surveyType: 'kid_sibling'
      }
    );
  };

  const renderQuestion = () => {
    const value = responses[currentQ.id];

    switch (currentQ.type) {
      case 'emoji_scale':
        return (
          <div className="flex justify-center gap-8 mt-8">
            {currentQ.emojis.map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleResponse(emoji.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all transform hover:scale-110 ${
                  value === emoji.value 
                    ? 'bg-blue-100 scale-110' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <emoji.icon className={`w-16 h-16 ${emoji.color}`} />
                <span className="text-sm font-medium">{emoji.label}</span>
              </button>
            ))}
          </div>
        );

      case 'emoji_grid':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {currentQ.options.map((option) => {
              const isSelected = currentQ.multiSelect 
                ? (value || []).includes(option.value)
                : value === option.value;
                
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (currentQ.multiSelect) {
                      const current = value || [];
                      if (isSelected) {
                        handleResponse(current.filter(v => v !== option.value));
                      } else {
                        handleResponse([...current, option.value]);
                      }
                    } else {
                      handleResponse(option.value);
                    }
                  }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-100 to-purple-100 transform scale-105'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <option.emoji className={`w-12 h-12 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        );

      case 'yes_no_maybe':
        return (
          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="flex gap-6">
              {[
                { label: 'Yes! 😊', value: 'yes', color: 'bg-green-100 hover:bg-green-200' },
                { label: 'Maybe 🤔', value: 'maybe', color: 'bg-yellow-100 hover:bg-yellow-200' },
                { label: 'No 😅', value: 'no', color: 'bg-red-100 hover:bg-red-200' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleResponse(option.value)}
                  className={`px-8 py-4 rounded-full text-lg font-medium transition-all ${
                    value === option.value
                      ? `${option.color} transform scale-110`
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {value === 'yes' && currentQ.followUp && (
              <input
                type="text"
                placeholder={currentQ.followUp}
                className="mt-4 px-4 py-2 border rounded-lg w-full max-w-md"
                onChange={(e) => handleResponse({ main: 'yes', details: e.target.value })}
              />
            )}
          </div>
        );

      case 'trophy_question':
        return (
          <div className="flex justify-center gap-4 mt-8">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleResponse(option)}
                className={`px-6 py-3 rounded-full text-lg transition-all ${
                  value === option
                    ? 'bg-yellow-200 transform scale-110'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        );

      case 'team_rating':
        return (
          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleResponse(rating)}
                  className="transition-all transform hover:scale-110"
                >
                  <Trophy 
                    className={`w-12 h-12 ${
                      value >= rating 
                        ? 'text-yellow-500 fill-yellow-500' 
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600">
              Tap the trophies to show how good your team is!
            </p>
          </div>
        );

      case 'text_with_stickers':
        return (
          <div className="flex flex-col gap-4 mt-6">
            <textarea
              value={value?.text || ''}
              onChange={(e) => handleResponse({ ...value, text: e.target.value })}
              placeholder={currentQ.placeholder}
              className="w-full p-4 border rounded-lg resize-none"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {currentQ.stickers.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => handleResponse({ 
                    ...value, 
                    text: (value?.text || '') + sticker 
                  })}
                  className="text-2xl p-2 hover:bg-gray-100 rounded"
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Sibling Super Survey!
          <Sparkles className="w-6 h-6 text-yellow-500" />
        </CardTitle>
        <Progress value={progress} className="mt-4" />
        <p className="text-sm text-gray-600 mt-2">
          Question {currentQuestion + 1} of {questions.length}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {child?.name?.[0] || '?'}
          </div>
        </div>

        {/* Question */}
        <div className="text-center">
          <h3 className="text-xl font-medium mb-2">
            {currentQ.question}
          </h3>
          {currentQ.siblingId && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full text-sm">
              <Users className="w-4 h-4" />
              About {siblings.find(s => s.id === currentQ.siblingId)?.name}
            </div>
          )}
        </div>

        {renderQuestion()}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            size="lg"
          >
            ← Back
          </Button>
          
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentQuestion
                    ? 'bg-blue-500'
                    : idx < currentQuestion
                    ? 'bg-blue-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            disabled={!responses[currentQ.id]}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {currentQuestion === questions.length - 1 ? 'Finish! 🎉' : 'Next →'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default KidSiblingSurvey;