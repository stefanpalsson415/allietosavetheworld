import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  LinearProgress,
  Paper,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button
} from '@mui/material';
import { 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  Users,
  Brain,
  Heart,
  Sparkles,
  Calendar,
  BookOpen,
  Home
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';

const ParentalLoadReductionDashboard = () => {
  const { familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [timeData, setTimeData] = useState({
    weeklyHoursSaved: 0,
    monthlyHoursSaved: 0,
    yearlyHoursSaved: 0,
    tasksOffloaded: []
  });
  const [siblingInteractions, setSiblingInteractions] = useState([]);

  // Get children from family members
  const children = familyMembers?.filter(member => member.role === 'child') || [];

  // Calculate time savings based on sibling dynamics
  useEffect(() => {
    if (!familyId || children.length < 2) return;

    // Listen to sibling appreciation events
    const appreciationQuery = query(
      collection(db, 'siblingAppreciation'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(appreciationQuery, (snapshot) => {
      const interactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSiblingInteractions(interactions);

      // Calculate time savings based on interactions
      const weeklyInteractions = interactions.filter(i => {
        const createdAt = i.createdAt?.toDate?.() || new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdAt > weekAgo;
      });

      // Each positive sibling interaction saves ~15 minutes of parental intervention
      const weeklyMinutesSaved = weeklyInteractions.length * 15;
      const weeklyHours = weeklyMinutesSaved / 60;
      
      setTimeData({
        weeklyHoursSaved: weeklyHours,
        monthlyHoursSaved: weeklyHours * 4,
        yearlyHoursSaved: weeklyHours * 52,
        tasksOffloaded: generateTasksOffloaded(weeklyInteractions)
      });
    });

    return () => unsubscribe();
  }, [familyId, children]);

  const generateTasksOffloaded = (interactions) => {
    const tasks = [];
    const uniquePairs = new Set();
    
    interactions.forEach(interaction => {
      const pair = `${interaction.fromId}-${interaction.toId}`;
      if (!uniquePairs.has(pair)) {
        uniquePairs.add(pair);
        
        // Map reasons to specific tasks
        const taskMap = {
          'helped me with something': { task: 'Homework assistance', category: 'academic', icon: <BookOpen size={16} /> },
          'shared with me': { task: 'Resource sharing', category: 'social', icon: <Heart size={16} /> },
          'taught me something cool': { task: 'Peer teaching', category: 'learning', icon: <Brain size={16} /> },
          'made me laugh': { task: 'Entertainment', category: 'emotional', icon: <Sparkles size={16} /> },
          'played with me': { task: 'Supervised play', category: 'recreation', icon: <Users size={16} /> },
          'was kind to me': { task: 'Emotional support', category: 'wellbeing', icon: <Heart size={16} /> }
        };
        
        const mappedTask = taskMap[interaction.reason] || { 
          task: 'General support', 
          category: 'general', 
          icon: <CheckCircle2 size={16} /> 
        };
        
        tasks.push({
          ...mappedTask,
          from: interaction.fromName,
          to: interaction.toName,
          timeSaved: '15 min'
        });
      }
    });
    
    return tasks.slice(0, 5); // Show top 5
  };

  const categoryColors = {
    academic: '#4caf50',
    social: '#2196f3',
    learning: '#9c27b0',
    emotional: '#ff9800',
    recreation: '#f44336',
    wellbeing: '#e91e63',
    general: '#607d8b'
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Time Savings Overview */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Clock size={24} />
                <Typography variant="h6">This Week</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {timeData.weeklyHoursSaved.toFixed(1)}h
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                saved through sibling dynamics
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(timeData.weeklyHoursSaved / 7) * 100}
                sx={{ 
                  mt: 2, 
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Calendar size={24} />
                <Typography variant="h6">This Month</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {timeData.monthlyHoursSaved.toFixed(0)}h
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                That's {(timeData.monthlyHoursSaved / 8).toFixed(1)} full work days!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingDown size={24} />
                <Typography variant="h6">Yearly Projection</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                {timeData.yearlyHoursSaved.toFixed(0)}h
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                {(timeData.yearlyHoursSaved / 24).toFixed(0)} days returned to you!
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tasks Offloaded */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle2 size={20} />
            Tasks Handled by Siblings
          </Typography>
          
          {timeData.tasksOffloaded.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Home size={48} style={{ color: '#e0e0e0', marginBottom: 16 }} />
              <Typography color="text.secondary">
                As siblings interact more, you'll see the tasks they handle for each other here.
              </Typography>
            </Box>
          ) : (
            <List>
              {timeData.tasksOffloaded.map((task, index) => (
                <ListItem 
                  key={index}
                  sx={{ 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    mb: 1
                  }}
                >
                  <ListItemIcon>
                    <Avatar sx={{ 
                      bgcolor: categoryColors[task.category], 
                      width: 32, 
                      height: 32 
                    }}>
                      {task.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1">
                        {task.from} → {task.to}: {task.task}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip 
                          label={task.category} 
                          size="small"
                          sx={{ 
                            bgcolor: categoryColors[task.category],
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {task.timeSaved} saved
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* ROI Calculator */}
      <Card sx={{ bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            💰 Return on Investment
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Time Value (at $30/hour)
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  ${(timeData.monthlyHoursSaved * 30).toFixed(0)}/month
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Stress Reduction Index
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {Math.min(95, timeData.weeklyHoursSaved * 13.5).toFixed(0)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tips for Maximizing Savings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={20} />
            Tips to Increase Time Savings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎯 Set up teaching pairs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Match siblings with complementary skills for peer teaching sessions.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🎮 Create collaborative activities
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Design tasks that require teamwork between siblings.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  🏆 Reward cooperation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use the appreciation board to reinforce positive interactions.
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  📅 Schedule sibling time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Dedicate specific times for siblings to work together.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ParentalLoadReductionDashboard;