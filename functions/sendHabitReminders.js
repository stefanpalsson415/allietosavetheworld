// Cloud Function to send scheduled habit SMS reminders
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Twilio (only if configured)
let twilioClient = null;
let twilioPhoneNumber = null;

try {
  const twilioConfig = functions.config().twilio;
  if (twilioConfig && twilioConfig.account_sid && twilioConfig.auth_token && twilioConfig.phone_number) {
    const accountSid = twilioConfig.account_sid;
    const authToken = twilioConfig.auth_token;
    twilioPhoneNumber = twilioConfig.phone_number;
    twilioClient = require('twilio')(accountSid, authToken);
    console.log('Twilio initialized successfully');
  } else {
    console.log('Twilio configuration not found - SMS reminders will be disabled');
  }
} catch (error) {
  console.error('Error initializing Twilio:', error);
  console.log('SMS reminders will be disabled');
}

exports.sendScheduledHabitReminders = functions
  .region('europe-west1')
  .pubsub.schedule('every 15 minutes')
  .onRun(async (context) => {
    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60000);
    
    try {
      // Query for reminders that should be sent in the next 15 minutes
      const remindersSnapshot = await admin.firestore()
        .collectionGroup('habitReminders')
        .where('status', '==', 'scheduled')
        .where('scheduledFor', '>=', now)
        .where('scheduledFor', '<=', fifteenMinutesFromNow)
        .get();
      
      const sendPromises = remindersSnapshot.docs.map(async (reminderDoc) => {
        const reminder = reminderDoc.data();
        
        try {
          // Check if Twilio is configured
          if (!twilioClient) {
            console.log(`Skipping SMS for reminder ${reminder.reminderId} - Twilio not configured`);
            return;
          }
          
          // Send SMS
          await twilioClient.messages.create({
            body: `🔔 ${reminder.habitCue}\n\n2-min version: ${reminder.habitTitle}\n\nYou got this! 💪`,
            from: twilioPhoneNumber,
            to: reminder.phoneNumber
          });
          
          // Update reminder status
          await reminderDoc.ref.update({
            status: 'sent',
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Reminder sent for habit ${reminder.habitId} to ${reminder.phoneNumber}`);
        } catch (error) {
          console.error(`Failed to send reminder ${reminder.reminderId}:`, error);
          
          // Update reminder status to failed
          await reminderDoc.ref.update({
            status: 'failed',
            error: error.message,
            failedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
      
      await Promise.all(sendPromises);
      
      console.log(`Processed ${remindersSnapshot.size} reminders`);
      return null;
    } catch (error) {
      console.error('Error in sendScheduledHabitReminders:', error);
      throw error;
    }
  });

// Function to handle real-time habit reminders (called when habit is created)
exports.scheduleHabitReminder = functions
  .region('europe-west1')
  .firestore
  .document('families/{familyId}/habits2/{habitId}')
  .onCreate(async (snap, context) => {
    const habit = snap.data();
    const { familyId, habitId } = context.params;
    
    // Check if reminders are enabled
    if (!habit.schedule.reminder) {
      return null;
    }
    
    try {
      // Get user's notification preferences
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(habit.createdBy)
        .get();
      
      if (!userDoc.exists) {
        console.log('User not found:', habit.createdBy);
        return null;
      }
      
      const userData = userDoc.data();
      
      // Check if user has phone verified and SMS reminders enabled
      if (!userData.phoneVerified || !userData.phoneNumber) {
        console.log('User does not have verified phone');
        return null;
      }
      
      // Check notification preferences
      const prefsDoc = await admin.firestore()
        .collection('users')
        .doc(habit.createdBy)
        .collection('preferences')
        .doc('notifications')
        .get();
      
      if (prefsDoc.exists) {
        const prefs = prefsDoc.data();
        if (prefs.sms?.habitReminders === false) {
          console.log('User has disabled SMS habit reminders');
          return null;
        }
      }
      
      // Create reminder documents for the next 7 days
      const batch = admin.firestore().batch();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        // Check if this day is in the habit's schedule
        const dayOfWeek = date.getDay();
        if (!habit.schedule.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }
        
        // Parse time and set reminder time
        const [hours, minutes] = habit.schedule.timeOfDay.split(':').map(Number);
        date.setHours(hours, minutes, 0, 0);
        
        // Subtract reminder minutes
        const reminderTime = new Date(date.getTime() - (habit.schedule.reminderMinutesBefore || 15) * 60000);
        
        // Skip if reminder time is in the past
        if (reminderTime < new Date()) {
          continue;
        }
        
        // Create reminder document
        const reminderId = `reminder_${habitId}_${date.toISOString().split('T')[0]}`;
        const reminderRef = admin.firestore()
          .collection('families')
          .doc(familyId)
          .collection('habitReminders')
          .doc(reminderId);
        
        const reminderData = {
          reminderId,
          habitId,
          familyId,
          userId: habit.createdBy,
          phoneNumber: userData.phoneNumber,
          habitTitle: habit.twoMinuteVersion || habit.title,
          habitCue: habit.fourLaws.obvious[0] || `Time for: ${habit.title}`,
          scheduledFor: reminderTime,
          habitTime: date,
          status: 'scheduled',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          type: 'habit_reminder'
        };
        
        batch.set(reminderRef, reminderData);
      }
      
      await batch.commit();
      console.log(`Created reminders for habit ${habitId}`);
      
      return null;
    } catch (error) {
      console.error('Error scheduling habit reminders:', error);
      throw error;
    }
  });