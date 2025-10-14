// src/components/medical/index.js
// Medical event components
export { default as MedicalEventHandler } from './MedicalEventHandler';
export { default as MedicalEventCreator } from './MedicalEventCreator';
export { default as MedicalEventList } from './MedicalEventList';
export { default as MedicalEventDetail } from './MedicalEventDetail';

// Multimodal document extraction components
export { default as MultimodalMedicalExtractor } from './MultimodalMedicalExtractor';
export { default as MultimodalMedicalDocumentPicker } from './MultimodalMedicalDocumentPicker';

// Reminder and notification components
export { default as PreparationReminders } from './PreparationReminders';
export { default as MedicalReminderNotification } from './MedicalReminderNotification';
export { default as MedicalReminderManager } from './MedicalReminderManager';

// Supporting components
export { default as InsuranceManager } from './InsuranceManager';
export { default as DocumentManager } from './DocumentManager';
export { default as FollowUpManager } from './FollowUpManager';

// Medication management components
export { default as MedicationManager } from './MedicationManager';
export { default as MedicationList } from './MedicationList';
export { default as MedicationDetail } from './MedicationDetail';
export { default as MedicationScheduler } from './MedicationScheduler';
export { default as MedicationScheduleList } from './MedicationScheduleList';
export { default as MedicationReminders } from './MedicationReminders';

// Default exports for main components
const Medical = {
  MedicalEventHandler,
  MedicationManager,
  MultimodalMedicalExtractor,
  MultimodalMedicalDocumentPicker
};

export default Medical;