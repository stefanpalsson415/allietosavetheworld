// src/components/school/index.js
export { default as SchoolEventManager } from './SchoolEventManager';
export { default as SchoolEventList } from './SchoolEventList';
export { default as SpecialRequirementsManager } from './SpecialRequirementsManager';
export { default as SuppliesManager } from './SuppliesManager';
export { default as HomeworkManager } from './HomeworkManager';
export { default as ParentParticipationScheduler } from './ParentParticipationScheduler';

// Multimodal document processing components
export { default as MultimodalSchoolDocumentPicker } from './MultimodalSchoolDocumentPicker';
export { default as MultimodalSchoolExtractor } from './MultimodalSchoolExtractor';

// Placeholder exports for components we'll implement later
export const SchoolEventDetail = () => null;
export const SchoolEventCreator = () => null;
export const PermissionSlipManager = () => null;

// Default export
const School = {
  SchoolEventManager,
  HomeworkManager,
  SuppliesManager,
  SpecialRequirementsManager,
  ParentParticipationScheduler,
  MultimodalSchoolDocumentPicker,
  MultimodalSchoolExtractor
};

export default School;