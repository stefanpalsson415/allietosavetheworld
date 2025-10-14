import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  ArrowRight, 
  ArrowLeft,
  Users,
  Heart,
  Brain,
  CheckCircle
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SiblingDynamicsSurvey = ({ onComplete }) => {
  const { familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  
  // Get children from family members
  const children = familyMembers?.filter(member => member.role === 'child') || [];
  
  const questions = [
    {
      id: 'sibling_interactions',
      title: 'Sibling Interaction Frequency',
      type: 'radio',
      question: 'How often do your children engage in positive interactions without adult intervention?',
      options: [
        { value: 'multiple_daily', label: 'Multiple times per day' },
        { value: 'daily', label: 'Once a day' },
        { value: 'few_weekly', label: 'A few times per week' },
        { value: 'weekly', label: 'Once a week' },
        { value: 'rarely', label: 'Rarely' }
      ]
    },
    {
      id: 'teaching_moments',
      title: 'Peer Teaching',
      type: 'radio',
      question: 'Do older siblings naturally help younger ones with homework or skills?',
      options: [
        { value: 'very_often', label: 'Very often - it\'s their default behavior' },
        { value: 'often', label: 'Often - when asked' },
        { value: 'sometimes', label: 'Sometimes - with encouragement' },
        { value: 'rarely', label: 'Rarely - prefer not to' },
        { value: 'never', label: 'Never' }
      ]
    },
    {
      id: 'conflict_resolution',
      title: 'Conflict Resolution',
      type: 'radio',
      question: 'How often do siblings resolve conflicts on their own?',
      options: [
        { value: 'always', label: 'Almost always - they work it out' },
        { value: 'usually', label: 'Usually - minimal parent involvement' },
        { value: 'sometimes', label: 'Sometimes - 50/50' },
        { value: 'rarely', label: 'Rarely - need parent help' },
        { value: 'never', label: 'Never - always need intervention' }
      ]
    },
    {
      id: 'shared_activities',
      title: 'Shared Activities',
      type: 'checkbox',
      question: 'Which activities do your children enjoy doing together? (Select all that apply)',
      options: [
        { value: 'creative_play', label: '🎨 Creative play (art, building, imagination)' },
        { value: 'outdoor_activities', label: '⚽ Outdoor activities and sports' },
        { value: 'board_games', label: '🎲 Board games and puzzles' },
        { value: 'reading_together', label: '📚 Reading or storytelling' },
        { value: 'video_games', label: '🎮 Video games' },
        { value: 'cooking_baking', label: '👨‍🍳 Cooking or baking' },
        { value: 'homework_study', label: '📝 Homework or studying' },
        { value: 'music_dance', label: '🎵 Music or dance' }
      ]
    },
    {
      id: 'sibling_strengths',
      title: 'Individual Strengths',
      type: 'text',
      question: 'What unique strengths does each child bring to sibling relationships?',
      subQuestions: children.map(child => ({
        id: `strength_${child.id}`,
        label: `${child.name}'s strengths:`,
        placeholder: 'e.g., patience, creativity, leadership, humor...'
      }))
    },
    {
      id: 'improvement_areas',
      title: 'Growth Opportunities',
      type: 'radio',
      question: 'What area would most improve sibling dynamics in your family?',
      options: [
        { value: 'communication', label: 'Better communication skills' },
        { value: 'empathy', label: 'More empathy and understanding' },
        { value: 'collaboration', label: 'Collaboration on tasks' },
        { value: 'respect_boundaries', label: 'Respecting personal boundaries' },
        { value: 'conflict_skills', label: 'Conflict resolution skills' }
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    setCurrentStep(Math.max(0, currentStep - 1));
  };

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      // Save survey responses to Firestore
      await addDoc(collection(db, 'siblingDynamicsSurveys'), {
        familyId,
        userId: currentUser.uid,
        responses,
        children: children.map(c => ({ id: c.id, name: c.name })),
        completedAt: serverTimestamp()
      });

      // Calculate insights based on responses
      const insights = calculateInsights(responses);
      
      // Call completion handler with insights
      onComplete({ responses, insights });
    } catch (error) {
      console.error('Error saving survey:', error);
    }
  };

  const calculateInsights = (responses) => {
    let score = 0;
    let recommendations = [];

    // Calculate score based on responses
    if (responses.sibling_interactions === 'multiple_daily') score += 25;
    else if (responses.sibling_interactions === 'daily') score += 20;
    else if (responses.sibling_interactions === 'few_weekly') score += 15;
    else if (responses.sibling_interactions === 'weekly') score += 10;
    else score += 5;

    if (responses.teaching_moments === 'very_often') score += 25;
    else if (responses.teaching_moments === 'often') score += 20;
    else if (responses.teaching_moments === 'sometimes') score += 15;
    else if (responses.teaching_moments === 'rarely') score += 10;
    else score += 5;

    if (responses.conflict_resolution === 'always') score += 25;
    else if (responses.conflict_resolution === 'usually') score += 20;
    else if (responses.conflict_resolution === 'sometimes') score += 15;
    else if (responses.conflict_resolution === 'rarely') score += 10;
    else score += 5;

    // Generate recommendations
    if (score < 40) {
      recommendations.push('Focus on creating structured sibling bonding activities');
      recommendations.push('Implement a sibling appreciation system');
    } else if (score < 60) {
      recommendations.push('Encourage more peer teaching opportunities');
      recommendations.push('Set up collaborative projects');
    } else {
      recommendations.push('Your siblings are thriving! Consider advanced collaboration');
      recommendations.push('Document and share your success strategies');
    }

    return {
      score,
      level: score >= 60 ? 'Advanced' : score >= 40 ? 'Developing' : 'Beginning',
      recommendations,
      potentialTimeSavings: Math.floor(score / 10) // hours per week
    };
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Progress Bar */}
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        sx={{ mb: 3, height: 8, borderRadius: 4 }}
      />

      {/* Stepper */}
      <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
        {questions.map((q, index) => (
          <Step key={index}>
            <StepLabel>{q.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Question Card */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>

          {/* Radio Questions */}
          {currentQuestion.type === 'radio' && (
            <RadioGroup
              value={responses[currentQuestion.id] || ''}
              onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
            >
              {currentQuestion.options.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                  sx={{ mb: 1 }}
                />
              ))}
            </RadioGroup>
          )}

          {/* Checkbox Questions */}
          {currentQuestion.type === 'checkbox' && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {currentQuestion.options.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  onClick={() => {
                    const current = responses[currentQuestion.id] || [];
                    const updated = current.includes(option.value)
                      ? current.filter(v => v !== option.value)
                      : [...current, option.value];
                    handleResponse(currentQuestion.id, updated);
                  }}
                  color={responses[currentQuestion.id]?.includes(option.value) ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          )}

          {/* Text Questions */}
          {currentQuestion.type === 'text' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              {currentQuestion.subQuestions.map((subQ) => (
                <TextField
                  key={subQ.id}
                  label={subQ.label}
                  placeholder={subQ.placeholder}
                  fullWidth
                  multiline
                  rows={2}
                  value={responses[subQ.id] || ''}
                  onChange={(e) => handleResponse(subQ.id, e.target.value)}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          onClick={handleBack}
          disabled={currentStep === 0}
          startIcon={<ArrowLeft size={16} />}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          variant="contained"
          endIcon={currentStep === questions.length - 1 ? <CheckCircle size={16} /> : <ArrowRight size={16} />}
        >
          {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default SiblingDynamicsSurvey;