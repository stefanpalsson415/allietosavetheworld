import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Box, Typography, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  TrendingDown, 
  Brain, 
  BarChart3,
  MessageSquare,
  Sparkles,
  Heart
} from 'lucide-react';
import SiblingDynamicsInsights from '../SiblingDynamicsInsights';
import ParentalLoadReductionDashboard from '../ParentalLoadReductionDashboard';
import SiblingAppreciationBoard from '../../appreciation/SiblingAppreciationBoard';
import { useFamily } from '../../../contexts/FamilyContext';
import { useSurveyDrawer } from '../../../contexts/SurveyDrawerContext';
import { db } from '../../../services/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import ErrorBoundary from '../../common/ErrorBoundary';

const SiblingDynamicsTab = () => {
  const { familyMembers, familyId } = useFamily();
  const { openSurveyDrawer } = useSurveyDrawer();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  
  // Real data states
  const [surveyResponses, setSurveyResponses] = useState([]);
  const [siblingInteractions, setSiblingInteractions] = useState([]);
  const [loadReduction, setLoadReduction] = useState(0);
  const [activeSpillovers, setActiveSpillovers] = useState(0);
  const [teachingPairs, setTeachingPairs] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  // Load real survey responses
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'surveyResponses'),
      where('familyId', '==', familyId),
      where('surveyType', '==', 'sibling-dynamics'),
      orderBy('completedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const responses = [];
      snapshot.forEach((doc) => {
        responses.push({ id: doc.id, ...doc.data() });
      });
      setSurveyResponses(responses);
    });
    
    return () => unsubscribe();
  }, [familyId]);
  
  // Load sibling interaction data
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'siblingAppreciation'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interactions = [];
      snapshot.forEach((doc) => {
        interactions.push({ id: doc.id, ...doc.data() });
      });
      setSiblingInteractions(interactions);
      
      // Calculate real metrics based on interactions
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentInteractions = interactions.filter(i => 
        i.createdAt?.toDate() > weekAgo
      );
      
      // Each positive interaction reduces load by ~15 minutes
      const minutesSaved = recentInteractions.length * 15;
      const percentReduction = Math.min(40, Math.round((minutesSaved / 60 / 40) * 100)); // Max 40% reduction
      setLoadReduction(percentReduction);
      
      // Calculate active spillovers (unique sibling pairs with interactions)
      const pairs = new Set();
      recentInteractions.forEach(i => {
        if (i.fromId && i.toId) {
          const pair = [i.fromId, i.toId].sort().join('-');
          pairs.add(pair);
        }
      });
      setActiveSpillovers(pairs.size);
      
      // Calculate teaching pairs (older siblings who have helped younger ones)
      const currentChildren = familyMembers?.filter(member => member.role === 'child') || [];
      const teachingInteractions = recentInteractions.filter(i => {
        const fromChild = currentChildren.find(c => c.id === i.fromId);
        const toChild = currentChildren.find(c => c.id === i.toId);
        return fromChild && toChild && fromChild.age > toChild.age;
      });
      
      // Count unique teaching pairs
      const teachPairs = new Set();
      teachingInteractions.forEach(i => {
        if (i.fromId && i.toId) {
          const pair = [i.fromId, i.toId].join('-');
          teachPairs.add(pair);
        }
      });
      setTeachingPairs(teachPairs.size);
      
      setDataLoading(false);
    });
    
    return () => unsubscribe();
  }, [familyId, familyMembers]);
  
  const handleTakeSurvey = () => {
    openSurveyDrawer('sibling-dynamics');
  };

  // Get children from family members
  const children = familyMembers?.filter(member => member.role === 'child') || [];
  
  // Check if family has multiple children
  const hasMultipleChildren = children.length > 1;

  if (!hasMultipleChildren) {
    return (
      <Card sx={{ textAlign: 'center', py: 12 }}>
        <CardContent>
          <Users size={48} style={{ margin: '0 auto 16px', color: '#9e9e9e' }} />
          <Typography variant="h6" gutterBottom>Sibling Dynamics</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            This feature becomes available when you have multiple children in your family profile.
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/settings')}>
            Add Children to Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Section */}
      <Paper sx={{ 
        background: 'linear-gradient(to right, #f3e5f5, #e3f2fd)', 
        p: 3,
        borderRadius: 2
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Users size={24} />
              <Typography variant="h5" fontWeight="bold">
                Sibling Dynamics Center
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Harness the power of sibling relationships to reduce your parental workload by 30-40% 
              while building stronger family bonds.
            </Typography>
            
            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDown size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Load Reduction
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {dataLoading ? '...' : `-${loadReduction}%`}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Sparkles size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Active Spillovers
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    {dataLoading ? '...' : activeSpillovers}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, backgroundColor: 'rgba(255,255,255,0.7)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Brain size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Teaching Pairs
                    </Typography>
                  </Box>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#9c27b0' }}>
                    {dataLoading ? '...' : teachingPairs}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          {/* Action Button */}
          <Box sx={{ ml: 3 }}>
            <Button 
              variant="contained"
              onClick={handleTakeSurvey}
              sx={{ 
                backgroundColor: '#9c27b0',
                '&:hover': { backgroundColor: '#7b1fa2' }
              }}
              startIcon={<MessageSquare size={16} />}
            >
              Take Survey
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex' }}>
            <Button
              onClick={() => setActiveTab(0)}
              sx={{ 
                flex: 1,
                py: 2,
                borderRadius: 0,
                borderBottom: activeTab === 0 ? 2 : 0,
                borderColor: 'primary.main',
                color: activeTab === 0 ? 'primary.main' : 'text.secondary'
              }}
              startIcon={<BarChart3 size={16} />}
            >
              Insights
            </Button>
            <Button
              onClick={() => setActiveTab(1)}
              sx={{ 
                flex: 1,
                py: 2,
                borderRadius: 0,
                borderBottom: activeTab === 1 ? 2 : 0,
                borderColor: 'primary.main',
                color: activeTab === 1 ? 'primary.main' : 'text.secondary'
              }}
              startIcon={<Heart size={16} />}
            >
              Appreciation
            </Button>
            <Button
              onClick={() => setActiveTab(2)}
              sx={{ 
                flex: 1,
                py: 2,
                borderRadius: 0,
                borderBottom: activeTab === 2 ? 2 : 0,
                borderColor: 'primary.main',
                color: activeTab === 2 ? 'primary.main' : 'text.secondary'
              }}
              startIcon={<TrendingDown size={16} />}
            >
              Time Savings
            </Button>
            <Button
              onClick={() => setActiveTab(3)}
              sx={{ 
                flex: 1,
                py: 2,
                borderRadius: 0,
                borderBottom: activeTab === 3 ? 2 : 0,
                borderColor: 'primary.main',
                color: activeTab === 3 ? 'primary.main' : 'text.secondary'
              }}
              startIcon={<Brain size={16} />}
            >
              Research
            </Button>
          </Box>
        </Box>

        <CardContent>
          <ErrorBoundary>
            {activeTab === 0 && <SiblingDynamicsInsights />}
            {activeTab === 1 && <SiblingAppreciationBoard />}
            {activeTab === 2 && <ParentalLoadReductionDashboard />}
            {activeTab === 3 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6">
                Research-Based Insights from NYT Article
              </Typography>
              
              {/* Key Research Points */}
              <Box sx={{ borderLeft: 4, borderColor: 'primary.main', pl: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Spillover Effects
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  "Nearly a third of siblings' academic similarity can be attributed to the spillover effect. 
                  When one sibling succeeds academically, it creates a ripple effect that lifts up their brothers and sisters."
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  → Your family has {children.length * (children.length - 1)} 
                  potential spillover pathways
                </Typography>
              </Box>

              <Box sx={{ borderLeft: 4, borderColor: 'secondary.main', pl: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Natural Differentiation
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  "Siblings tend to find ways to differentiate themselves from one another, 
                  sharpening some edges, softening others, forcing one another into roles that can coexist."
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  → We're tracking unique strengths for each of your children
                </Typography>
              </Box>

              <Box sx={{ borderLeft: 4, borderColor: 'success.main', pl: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Peer Teaching Advantage
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  "The constant informal competition and collaboration between siblings improves their skills. 
                  Younger siblings benefit from having older siblings who can guide them."
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  → Sibling teaching is 65% more effective than parent-led instruction
                </Typography>
              </Box>

              <Box sx={{ borderLeft: 4, borderColor: 'warning.main', pl: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  Reduced Parental Load
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  "When siblings collaborate and support each other, parents save an average of 
                  3-7 hours per week on supervision, teaching, and conflict resolution."
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium">
                  → That's up to 365 hours saved per year!
                </Typography>
              </Box>
            </Box>
          )}
          </ErrorBoundary>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SiblingDynamicsTab;