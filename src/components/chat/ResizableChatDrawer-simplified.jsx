// Simplified onSendReply function for ResizableChatDrawer
// This should replace the complex logic starting at line 283

onSendReply={async (replyText, parentMessage) => {
  // Send the reply using message service
  console.log('ResizableChatDrawer onSendReply called');
  console.log('Thread reply text:', replyText);
  console.log('Parent message:', parentMessage);
  
  // Check if the message mentions @allie
  const mentionsAllie = replyText.toLowerCase().includes('@allie');
  
  // Use the SAME selectedUser that AllieChat uses from FamilyContext
  // This is exactly what AllieChat has on line 70
  let selectedUser = contextSelectedUser;
  
  // If no context user, get from localStorage EXACTLY like AllieChat does (line 147-154)
  if (!selectedUser || !selectedUser.id) {
    let currentUserInfo = JSON.parse(localStorage.getItem('selectedFamilyMember') || '{}');
    if (!currentUserInfo?.id) {
      const otpSession = JSON.parse(localStorage.getItem('otpUserSession') || '{}');
      if (otpSession.userId) {
        currentUserInfo = {
          id: otpSession.userId,
          name: otpSession.userName || otpSession.userId.split('@')[0] || 'User',
          profilePicture: otpSession.userAvatar
        };
      }
    }
    selectedUser = currentUserInfo;
  }
  
  // Fallback to basic user if still nothing
  if (!selectedUser || !selectedUser.id) {
    selectedUser = {
      id: 'user',
      name: 'User',
      profilePicture: null
    };
  }
  
  console.log('Selected user:', selectedUser);
  
  // Get family ID
  const familyId = localStorage.getItem('selectedFamilyId') || 
                   localStorage.getItem('currentFamilyId') ||
                   parentMessage?.familyId;
  
  console.log('Family ID:', familyId);
  
  if (!familyId) {
    console.error('No family ID found');
    return;
  }
  
  // Prepare the message data for threading
  const messageData = {
    content: replyText,
    userId: selectedUser?.id || 'user',
    userName: selectedUser?.name || 'User',
    userAvatar: selectedUser?.profilePicture,
    familyId: familyId,
    threadId: parentMessage.threadId || parentMessage.id,
    parentMessageId: parentMessage.id,
    mentions: [],
    attachments: [],
    isFromAllie: false,
    timestamp: new Date().toISOString(),
    text: replyText
  };
  
  console.log('Message data to send:', messageData);
  
  try {
    // Use the imported messageService
    const result = await messageService.sendMessage(messageData);
    console.log('MessageService result:', result);
    
    if (result.success) {
      console.log('Reply sent successfully:', result.messageId);
      
      // If the message mentions @allie, send it to Claude for a response
      if (mentionsAllie) {
        console.log('Thread message mentions @allie, sending to Claude...');
        
        // Import ClaudeService if not already imported
        const ClaudeService = await import('../../services/ClaudeService').then(m => m.default);
        
        // Get thread messages for context
        const threadMessages = [];
        
        // Add the parent message as context
        if (parentMessage) {
          threadMessages.push({
            role: parentMessage.isFromAllie || parentMessage.sender === 'allie' ? 'assistant' : 'user',
            content: parentMessage.text || parentMessage.content || ''
          });
        }
        
        // Add the current message
        threadMessages.push({
          role: 'user',
          content: replyText
        });
        
        // Generate Allie's response
        const allieResponse = await ClaudeService.generateResponse(
          threadMessages,
          familyId,
          selectedUser?.id || 'user'
        );
        
        if (allieResponse) {
          // Save Allie's response as a thread reply
          const allieMessageData = {
            content: allieResponse,
            text: allieResponse,
            userId: 'allie',
            userName: 'Allie',
            sender: 'allie',
            isFromAllie: true,
            familyId: familyId,
            threadId: parentMessage.threadId || parentMessage.id,
            parentMessageId: result.messageId,
            timestamp: new Date().toISOString(),
            mentions: [],
            attachments: []
          };
          
          const allieResult = await messageService.sendMessage(allieMessageData);
          if (allieResult.success) {
            console.log('Allie\'s thread response saved:', allieResult.messageId);
          } else {
            console.error('Failed to save Allie\'s response:', allieResult.error);
          }
        }
      }
    } else {
      console.error('Failed to send reply:', result.error);
    }
  } catch (error) {
    console.error('Error sending thread reply:', error);
  }
}}