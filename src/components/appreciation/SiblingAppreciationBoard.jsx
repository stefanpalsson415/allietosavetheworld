import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Button, 
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Heart, 
  Send, 
  Star, 
  Trophy,
  Sparkles,
  Gift,
  Smile
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

const SiblingAppreciationBoard = () => {
  const { familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  const [appreciations, setAppreciations] = useState([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [selectedSticker, setSelectedSticker] = useState('');
  const [sending, setSending] = useState(false);
  
  // Get children from family members
  const children = familyMembers?.filter(member => member.role === 'child') || [];
  
  // Pre-written appreciation reasons
  const appreciationReasons = [
    { text: "helped me with something", emoji: "🤝" },
    { text: "shared with me", emoji: "🎁" },
    { text: "taught me something cool", emoji: "🧠" },
    { text: "made me laugh", emoji: "😄" },
    { text: "played with me", emoji: "🎮" },
    { text: "was kind to me", emoji: "💖" }
  ];
  
  // Fun stickers
  const stickers = ["⭐", "🌟", "✨", "🎉", "🎈", "🏆", "🌈", "🦄", "🚀", "🎨"];
  
  // Load appreciations
  useEffect(() => {
    if (!familyId) return;
    
    const q = query(
      collection(db, 'siblingAppreciation'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newAppreciations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppreciations(newAppreciations);
    });
    
    return () => unsubscribe();
  }, [familyId]);
  
  // Send appreciation
  const sendAppreciation = async () => {
    if (!selectedRecipient || !selectedReason || !selectedSticker) return;
    
    setSending(true);
    try {
      await addDoc(collection(db, 'siblingAppreciation'), {
        familyId,
        fromId: currentUser.uid,
        fromName: familyMembers.find(m => m.id === currentUser.uid)?.name || 'Unknown',
        toId: selectedRecipient.id,
        toName: selectedRecipient.name,
        reason: selectedReason,
        sticker: selectedSticker,
        createdAt: serverTimestamp()
      });
      
      // Reset and close
      setShowSendDialog(false);
      setSelectedRecipient(null);
      setSelectedReason('');
      setSelectedSticker('');
    } catch (error) {
      console.error('Error sending appreciation:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Calculate stats
  const getChildStats = (childId) => {
    const sent = appreciations.filter(a => a.fromId === childId).length;
    const received = appreciations.filter(a => a.toId === childId).length;
    return { sent, received };
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header with Send Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Heart size={24} />
          Sibling Appreciation Board
        </Typography>
        <Button
          variant="contained"
          startIcon={<Send size={16} />}
          onClick={() => setShowSendDialog(true)}
          sx={{ 
            background: 'linear-gradient(45deg, #ff6b6b 30%, #feca57 90%)',
            color: 'white'
          }}
        >
          Send Appreciation
        </Button>
      </Box>
      
      {/* Children Stats */}
      <Grid container spacing={2}>
        {children.map((child) => {
          const stats = getChildStats(child.id);
          const level = Math.floor((stats.sent + stats.received) / 5) + 1;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={child.id}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'white', color: '#667eea' }}>
                      {child.name?.[0] || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{child.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Trophy size={16} />
                        <Typography variant="body2">
                          Level {level} Sibling
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">{stats.sent}</Typography>
                      <Typography variant="body2">Sent</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4">{stats.received}</Typography>
                      <Typography variant="body2">Received</Typography>
                    </Box>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={(((stats.sent + stats.received) % 5) / 5) * 100}
                    sx={{ 
                      mt: 2, 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'white'
                      }
                    }}
                  />
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    {5 - ((stats.sent + stats.received) % 5)} more to next level!
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      
      {/* Recent Appreciations */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Sparkles size={20} />
            Recent Appreciations
          </Typography>
          
          {appreciations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Smile size={48} style={{ color: '#e0e0e0', marginBottom: 16 }} />
              <Typography color="text.secondary">
                No appreciations yet. Be the first to send one!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {appreciations.slice(0, 5).map((appreciation) => (
                <Box 
                  key={appreciation.id}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}
                >
                  <Typography variant="h4">{appreciation.sticker}</Typography>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">
                      <strong>{appreciation.fromName}</strong> appreciated <strong>{appreciation.toName}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      because they {appreciation.reason}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Send Appreciation Dialog */}
      <Dialog 
        open={showSendDialog} 
        onClose={() => setShowSendDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Appreciation</DialogTitle>
        <DialogContent>
          {/* Select Recipient */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Who do you want to appreciate?
          </Typography>
          <Grid container spacing={1}>
            {children.filter(c => c.id !== currentUser.uid).map((child) => (
              <Grid item xs={6} key={child.id}>
                <Button
                  fullWidth
                  variant={selectedRecipient?.id === child.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedRecipient(child)}
                  sx={{ py: 2 }}
                >
                  {child.name}
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* Select Reason */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Why are you appreciating them?
          </Typography>
          <Grid container spacing={1}>
            {appreciationReasons.map((reason) => (
              <Grid item xs={12} sm={6} key={reason.text}>
                <Button
                  fullWidth
                  variant={selectedReason === reason.text ? 'contained' : 'outlined'}
                  onClick={() => setSelectedReason(reason.text)}
                  startIcon={<span>{reason.emoji}</span>}
                  sx={{ justifyContent: 'flex-start' }}
                >
                  {reason.text}
                </Button>
              </Grid>
            ))}
          </Grid>
          
          {/* Select Sticker */}
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
            Choose a sticker!
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {stickers.map((sticker) => (
              <IconButton
                key={sticker}
                onClick={() => setSelectedSticker(sticker)}
                sx={{ 
                  fontSize: '2rem',
                  border: selectedSticker === sticker ? 2 : 0,
                  borderColor: 'primary.main'
                }}
              >
                {sticker}
              </IconButton>
            ))}
          </Box>
          
          {/* Preview */}
          {selectedRecipient && selectedReason && selectedSticker && (
            <Box sx={{ 
              mt: 3, 
              p: 2, 
              bgcolor: 'primary.light', 
              borderRadius: 2,
              textAlign: 'center'
            }}>
              <Typography variant="h3" sx={{ mb: 1 }}>{selectedSticker}</Typography>
              <Typography>
                You're appreciating <strong>{selectedRecipient.name}</strong> because they {selectedReason}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSendDialog(false)}>Cancel</Button>
          <Button 
            onClick={sendAppreciation}
            variant="contained"
            disabled={!selectedRecipient || !selectedReason || !selectedSticker || sending}
            startIcon={<Send size={16} />}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SiblingAppreciationBoard;