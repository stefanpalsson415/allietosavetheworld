import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, LinearProgress, Chip, Button } from '@mui/material';
import { 
  TrendingUp, 
  Users, 
  Brain, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { db } from '../../services/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

const SiblingDynamicsInsights = () => {
  const { familyMembers, familyId } = useFamily();
  
  // Get children from family members
  const children = familyMembers?.filter(member => member.role === 'child') || [];
  
  // State for real data
  const [siblingInteractions, setSiblingInteractions] = useState([]);
  const [timeSaved, setTimeSaved] = useState(0);
  const [activeSpillovers, setActiveSpillovers] = useState([]);
  const [teachingOpportunities, setTeachingOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load sibling interactions
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'siblingAppreciation'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const interactions = [];
      snapshot.forEach((doc) => {
        interactions.push({ id: doc.id, ...doc.data() });
      });
      setSiblingInteractions(interactions);
      
      // Calculate time saved (15 minutes per interaction in the last week)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentInteractions = interactions.filter(i => 
        i.createdAt?.toDate() > weekAgo
      );
      
      const hoursSaved = (recentInteractions.length * 15) / 60;
      setTimeSaved(Math.round(hoursSaved * 10) / 10); // Round to 1 decimal
      
      // Extract spillover effects (recent interactions)
      const spillovers = recentInteractions.slice(0, 4).map(interaction => ({
        from: interaction.fromName,
        to: interaction.toName,
        area: interaction.reason,
        sticker: interaction.sticker
      }));
      setActiveSpillovers(spillovers);
      
      // Identify teaching opportunities (older to younger)
      const teachings = interactions.filter(i => {
        const fromChild = children.find(c => c.id === i.fromId);
        const toChild = children.find(c => c.id === i.toId);
        return fromChild && toChild && fromChild.age > toChild.age;
      }).slice(0, 3).map(i => ({
        teacher: i.fromName,
        student: i.toName,
        subject: i.reason
      }));
      setTeachingOpportunities(teachings);
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [familyId, children]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography color="text.secondary">Loading insights...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Time Saved Card */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} />
              Parental Time Saved This Week
            </Typography>
            <Chip label={`${timeSaved}h saved`} color="success" />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(timeSaved / 7) * 100} 
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Goal: 7 hours/week • You're {Math.round((timeSaved / 7) * 100)}% there!
          </Typography>
        </CardContent>
      </Card>

      {/* Active Spillover Effects */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Sparkles size={20} />
            Active Spillover Effects
          </Typography>
          <Grid container spacing={2}>
            {activeSpillovers.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No recent sibling interactions recorded. Encourage your children to appreciate each other!
                  </Typography>
                </Box>
              </Grid>
            ) : activeSpillovers.map((spillover, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">{spillover.from}</Typography>
                      <ArrowRight size={16} />
                      <Typography variant="subtitle2">{spillover.to}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {spillover.area}
                    </Typography>
                  </Box>
                  <Star size={20} style={{ color: '#ffc107' }} />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Teaching Opportunities */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Brain size={20} />
            Teaching Opportunities
          </Typography>
          <Grid container spacing={2}>
            {teachingOpportunities.length === 0 ? (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">
                    No teaching moments captured yet. Look for opportunities where older siblings can help younger ones!
                  </Typography>
                </Box>
              </Grid>
            ) : teachingOpportunities.map((opportunity, index) => (
              <Grid item xs={12} key={index}>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Box>
                    <Typography variant="subtitle2">
                      {opportunity.teacher} can teach {opportunity.student}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {opportunity.subject}
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined">
                    Start Session
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Natural Differentiation */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Users size={20} />
            Natural Differentiation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Each child is developing their unique strengths
          </Typography>
          <Grid container spacing={2}>
            {children.map((child, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {child.name || `Child ${index + 1}`}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="Creative" size="small" color="primary" />
                    <Chip label="Helper" size="small" color="secondary" />
                    <Chip label="Leader" size="small" color="success" />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SiblingDynamicsInsights;