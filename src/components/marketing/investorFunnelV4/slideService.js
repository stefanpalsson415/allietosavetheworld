/**
 * Investor Deck V4 Slide Service
 *
 * This service handles the loading, saving, and management of slides
 * with proper version control. It provides a safe way to modify the 
 * slide order and visibility without affecting content.
 *
 * Features include:
 * - Slide management (activate/deactivate, reordering)
 * - Section management (create, rename, delete, reorder)
 * - Backup and restoration
 * - Import/export functionality
 */

import slideConfig from './slideConfig';

// Constants
const STORAGE_KEY = 'investorSlidesV4UserConfig';
const MAX_BACKUPS = 5;
const CONFIG_VERSION = "4.0.0";

/**
 * SlideService provides operations for slide management
 * while maintaining data integrity and version control
 */
class SlideService {
  constructor() {
    this.slides = [...slideConfig.slides];
    this.userConfig = this.loadUserConfig();
    this.applyUserConfig();
  }

  /**
   * Load user configuration from localStorage
   * This only contains order and active status changes
   */
  loadUserConfig() {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);

          // Validate the format of the parsed config
          if (!parsedConfig || !Array.isArray(parsedConfig.slides)) {
            console.warn('Invalid user config format, using defaults');
            return { slides: [], configVersion: CONFIG_VERSION };
          }

          // Log the loaded config for debugging
          console.log(`Loaded ${parsedConfig.slides.length} slides from localStorage`);

          // Verify slides have required fields
          const invalidSlides = parsedConfig.slides.filter(s =>
            typeof s.id !== 'number' ||
            typeof s.order !== 'number' ||
            typeof s.active !== 'boolean'
          );

          if (invalidSlides.length > 0) {
            console.warn(`Found ${invalidSlides.length} invalid slides in config, they will be ignored`);
          }

          return parsedConfig;
        } catch (parseError) {
          console.error('Error parsing saved config:', parseError);
          // If parsing fails, create a backup of the corrupted data for debugging
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          localStorage.setItem(`${STORAGE_KEY}_corrupt_${timestamp}`, savedConfig);
          console.warn('Backed up corrupted config data for debugging');
        }
      } else {
        console.log('No saved config found, using defaults');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
    }

    return { slides: [], configVersion: CONFIG_VERSION };
  }

  /**
   * Apply user configuration changes to the slide set
   * Applies order, section, and active status changes
   */
  applyUserConfig() {
    if (!this.userConfig.slides || this.userConfig.slides.length === 0) {
      console.log('No slide configuration to apply');
      return;
    }

    // Apply saved properties from user config
    console.log(`Applying configuration for ${this.userConfig.slides.length} slides`);
    this.userConfig.slides.forEach(userSlide => {
      const slideIndex = this.slides.findIndex(s => s.id === userSlide.id);
      if (slideIndex !== -1) {
        // Apply all saved properties
        this.slides[slideIndex].order = userSlide.order;
        this.slides[slideIndex].active = userSlide.active;

        // Apply section if it exists in the saved data
        if (userSlide.section) {
          this.slides[slideIndex].section = userSlide.section;
        }
      } else {
        console.warn(`Slide with id ${userSlide.id} not found in slides collection during config application`);
      }
    });
  }

  /**
   * Save user configuration to localStorage
   * Saves slide order, active status, sections, and section order
   */
  saveUserConfig() {
    try {
      // Create backup of current config first
      this.createBackup();

      // Extract slide properties for saving
      const slidesToSave = this.slides.map(slide => ({
        id: slide.id,
        order: slide.order,
        active: slide.active,
        section: slide.section // Make sure we save the section as well
      }));

      // Get unique sections with their order
      const sections = this.getSectionOrder();

      const configToSave = {
        slides: slidesToSave,
        sections: sections,
        configVersion: CONFIG_VERSION,
        lastSaved: new Date().toISOString()
      };

      const dataToSave = JSON.stringify(configToSave);
      localStorage.setItem(STORAGE_KEY, dataToSave);

      // Verify the data was saved correctly
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData !== dataToSave) {
        console.warn('Data verification failed - saved data doesn\'t match what we tried to save');
      }

      console.log(`Saved ${slidesToSave.length} slide configurations to localStorage (${dataToSave.length} bytes)`);
      return true;
    } catch (error) {
      console.error('Error saving user config:', error);
      return false;
    }
  }

  /**
   * Create a backup of the current configuration
   */
  createBackup() {
    try {
      const currentConfig = localStorage.getItem(STORAGE_KEY);
      if (currentConfig) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        localStorage.setItem(`${STORAGE_KEY}_backup_${timestamp}`, currentConfig);
        
        // Clean up old backups
        this.cleanupOldBackups();
      }
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  }

  /**
   * Keep only the most recent MAX_BACKUPS backups
   */
  cleanupOldBackups() {
    try {
      const backupKeys = [];
      
      // Find all backup keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${STORAGE_KEY}_backup_`)) {
          backupKeys.push(key);
        }
      }
      
      // Sort by timestamp (most recent first)
      backupKeys.sort().reverse();
      
      // Remove older backups
      if (backupKeys.length > MAX_BACKUPS) {
        for (let i = MAX_BACKUPS; i < backupKeys.length; i++) {
          localStorage.removeItem(backupKeys[i]);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Get all slides (including inactive)
   */
  getAllSlides() {
    return [...this.slides].sort((a, b) => a.order - b.order);
  }

  /**
   * Get only active slides in presentation order
   */
  getActiveSlides() {
    return [...this.slides]
      .filter(slide => slide.active)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get slides grouped by section
   */
  getSlidesBySection() {
    const sections = {};
    
    this.slides.forEach(slide => {
      if (!sections[slide.section]) {
        sections[slide.section] = [];
      }
      sections[slide.section].push(slide);
    });
    
    // Sort slides within each section
    Object.keys(sections).forEach(section => {
      sections[section].sort((a, b) => a.order - b.order);
    });
    
    return sections;
  }

  /**
   * Get a slide by ID
   */
  getSlideById(id) {
    return this.slides.find(slide => slide.id === id);
  }

  /**
   * Set a slide's active status
   * Returns true if successful
   */
  setSlideActive(id, active) {
    const slideIndex = this.slides.findIndex(s => s.id === id);
    if (slideIndex !== -1) {
      this.slides[slideIndex].active = active;
      this.saveUserConfig();
      return true;
    }
    return false;
  }

  /**
   * Move a slide up in the presentation order
   * Returns true if successful
   */
  moveSlideUp(id) {
    // Find the slide and the one before it
    const slides = this.getAllSlides();
    const slideIndex = slides.findIndex(s => s.id === id);
    
    if (slideIndex <= 0) {
      // Already at the top
      return false;
    }

    // Swap the order values of this slide and the one before it
    const currentOrder = slides[slideIndex].order;
    const prevOrder = slides[slideIndex - 1].order;
    
    // Find the actual slides in our slides array and update them
    const currentSlideIndex = this.slides.findIndex(s => s.id === slides[slideIndex].id);
    const prevSlideIndex = this.slides.findIndex(s => s.id === slides[slideIndex - 1].id);
    
    this.slides[currentSlideIndex].order = prevOrder;
    this.slides[prevSlideIndex].order = currentOrder;
    
    this.saveUserConfig();
    return true;
  }

  /**
   * Move a slide down in the presentation order
   * Returns true if successful
   */
  moveSlideDown(id) {
    // Find the slide and the one after it
    const slides = this.getAllSlides();
    const slideIndex = slides.findIndex(s => s.id === id);
    
    if (slideIndex === -1 || slideIndex >= slides.length - 1) {
      // Already at the bottom
      return false;
    }

    // Swap the order values of this slide and the one after it
    const currentOrder = slides[slideIndex].order;
    const nextOrder = slides[slideIndex + 1].order;
    
    // Find the actual slides in our slides array and update them
    const currentSlideIndex = this.slides.findIndex(s => s.id === slides[slideIndex].id);
    const nextSlideIndex = this.slides.findIndex(s => s.id === slides[slideIndex + 1].id);
    
    this.slides[currentSlideIndex].order = nextOrder;
    this.slides[nextSlideIndex].order = currentOrder;
    
    this.saveUserConfig();
    return true;
  }

  /**
   * Move a slide to a specific position
   * Returns true if successful
   */
  moveSlideToPosition(id, newPosition) {
    const slides = this.getAllSlides();

    if (newPosition < 1 || newPosition > slides.length) {
      return false;
    }

    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) {
      return false;
    }

    const currentPosition = slideIndex + 1;
    if (currentPosition === newPosition) {
      return true; // Already at the desired position
    }

    // Calculate new order value
    let newOrder;
    if (newPosition === 1) {
      // Moving to the first position
      newOrder = slides[0].order - 1;
    } else if (newPosition === slides.length) {
      // Moving to the last position
      newOrder = slides[slides.length - 1].order + 1;
    } else {
      // Moving to a middle position
      const targetIndex = newPosition - 1;
      const prevSlide = slides[targetIndex - 1];
      const nextSlide = slides[targetIndex];
      newOrder = (prevSlide.order + nextSlide.order) / 2;
    }

    // Update the slide's order
    const actualSlideIndex = this.slides.findIndex(s => s.id === id);
    this.slides[actualSlideIndex].order = newOrder;

    this.saveUserConfig();
    return true;
  }

  /**
   * Move a slide to a different section
   * Returns true if successful
   */
  moveSlideToSection(id, newSection) {
    // Find the slide
    const slideIndex = this.slides.findIndex(s => s.id === id);
    if (slideIndex === -1) {
      console.error(`Slide with ID ${id} not found.`);
      return false;
    }

    // Update the slide's section
    const currentSection = this.slides[slideIndex].section;
    if (currentSection === newSection) {
      return true; // Already in the right section
    }

    // Get all slides in the target section
    const sectionSlides = this.slides.filter(s => s.section === newSection);

    // If there are slides in the target section, place at the end
    let newOrder;
    if (sectionSlides.length > 0) {
      // Sort by order to find the last one
      const lastSlide = [...sectionSlides].sort((a, b) => b.order - a.order)[0];
      newOrder = lastSlide.order + 1;
    } else {
      // If no slides in the section, find a reasonable starting point
      // Calculate max order directly from slides
      const maxOrder = Math.max(...this.slides.map(slide => slide.order || 0));
      // Place it higher than any existing slide
      newOrder = maxOrder + 10;
    }

    // Update the slide
    this.slides[slideIndex].section = newSection;
    this.slides[slideIndex].order = newOrder;

    // Log the section change for debugging
    console.log(`Moving slide ${id} from ${currentSection} to ${newSection} with order ${newOrder}`);

    // Ensure changes are saved
    const saveResult = this.saveUserConfig();
    if (!saveResult) {
      console.error(`Failed to save after moving slide to section`);
    }

    return true;
  }

  /**
   * Create a new section and move selected slides to it
   * Returns true if successful
   */
  createSection(newSectionName, slideIds = []) {
    // Validate section name
    if (!newSectionName || typeof newSectionName !== 'string' || newSectionName.trim() === '') {
      console.error('Invalid section name');
      return false;
    }

    // Format the section name for consistency
    const formattedSectionName = newSectionName.toLowerCase().trim().replace(/\s+/g, '-');

    // Check if section already exists
    const availableSections = [...new Set(this.slides.map(s => s.section))];
    if (availableSections.includes(formattedSectionName)) {
      console.error(`Section '${formattedSectionName}' already exists.`);
      return false;
    }

    // Calculate maximum order directly from slides
    const maxOrder = Math.max(...this.slides.map(slide => slide.order || 0));

    // Move the selected slides to the new section if any were provided
    let orderCounter = maxOrder + 10;

    if (slideIds && slideIds.length > 0) {
      slideIds.forEach(id => {
        const slideIndex = this.slides.findIndex(s => s.id === id);
        if (slideIndex !== -1) {
          this.slides[slideIndex].section = formattedSectionName;
          this.slides[slideIndex].order = orderCounter;
          orderCounter += 10;
        }
      });
    } else {
      // If no slides were provided, create a placeholder slide for the new section
      // This ensures the section is visible in the UI
      const nextId = Math.max(...this.slides.map(slide => slide.id)) + 1;
      const placeholder = {
        id: nextId,
        title: `${formattedSectionName.charAt(0).toUpperCase() + formattedSectionName.slice(1)} Placeholder`,
        section: formattedSectionName,
        componentPath: null,
        active: false, // Default to inactive
        order: orderCounter,
        lastEditedBy: "claude",
        lastEdited: new Date().toISOString().slice(0, 10)
      };

      this.slides.push(placeholder);
      console.log(`Created placeholder slide ${nextId} for new section ${formattedSectionName}`);
    }

    // Make sure to save changes to localStorage
    console.log(`Creating section '${formattedSectionName}'. Slides now: `, this.slides);
    this.saveUserConfig();
    return true;
  }

  /**
   * Rename a section
   * Returns true if successful
   */
  renameSection(oldSectionName, newSectionName) {
    // Validate section names
    if (!oldSectionName || !newSectionName) {
      console.error('Invalid section names');
      return false;
    }

    // Format the section name for consistency
    const formattedNewSectionName = newSectionName.toLowerCase().trim().replace(/\s+/g, '-');

    // Check if old section exists
    const availableSections = [...new Set(this.slides.map(s => s.section))];
    if (!availableSections.includes(oldSectionName)) {
      console.error(`Section '${oldSectionName}' does not exist.`);
      return false;
    }

    // Check if new section name already exists
    if (availableSections.includes(formattedNewSectionName)) {
      console.error(`Section '${formattedNewSectionName}' already exists.`);
      return false;
    }

    // Update all slides in the section
    this.slides.forEach(slide => {
      if (slide.section === oldSectionName) {
        slide.section = formattedNewSectionName;
      }
    });

    this.saveUserConfig();
    return true;
  }

  /**
   * Delete a section and move its slides to another section
   * Returns true if successful
   */
  deleteSection(sectionName, targetSection = null) {
    // Validate section name
    if (!sectionName) {
      console.error('Invalid section name');
      return false;
    }

    // Check if section exists
    const availableSections = [...new Set(this.slides.map(s => s.section))];
    if (!availableSections.includes(sectionName)) {
      console.error(`Section '${sectionName}' does not exist.`);
      return false;
    }

    // If target section is provided, validate it
    if (targetSection) {
      if (!availableSections.includes(targetSection)) {
        console.error(`Target section '${targetSection}' does not exist.`);
        return false;
      }

      if (targetSection === sectionName) {
        console.error('Target section cannot be the same as the section to delete');
        return false;
      }
    }

    // Get slides in the section
    const sectionSlides = this.slides.filter(s => s.section === sectionName);

    if (sectionSlides.length > 0) {
      if (targetSection) {
        // Move slides to target section
        let orderCounter = this.getMaxOrder() + 10;

        sectionSlides.forEach(slide => {
          const slideIndex = this.slides.findIndex(s => s.id === slide.id);
          if (slideIndex !== -1) {
            this.slides[slideIndex].section = targetSection;
            this.slides[slideIndex].order = orderCounter;
            orderCounter += 10;
          }
        });
      } else {
        // Just deactivate the slides
        sectionSlides.forEach(slide => {
          const slideIndex = this.slides.findIndex(s => s.id === slide.id);
          if (slideIndex !== -1) {
            this.slides[slideIndex].active = false;
          }
        });
      }
    }

    this.saveUserConfig();
    return true;
  }

  /**
   * Reset slide ordering to default
   * This resets ONLY order and active status, not content
   */
  resetToDefault() {
    // Reset slides to original order while preserving all other properties
    this.slides.forEach((slide, index) => {
      const defaultSlide = slideConfig.slides.find(s => s.id === slide.id);
      if (defaultSlide) {
        slide.order = defaultSlide.order;
        slide.active = defaultSlide.active;
      }
    });

    this.saveUserConfig();
    return true;
  }

  /**
   * Get available backups
   */
  getAvailableBackups() {
    const backups = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_KEY}_backup_`)) {
        try {
          const backupData = JSON.parse(localStorage.getItem(key));
          const timestamp = key.replace(`${STORAGE_KEY}_backup_`, '');
          
          backups.push({
            key,
            timestamp,
            slideCount: backupData.slides?.length || 0,
            version: backupData.configVersion || 'unknown'
          });
        } catch (error) {
          console.error(`Error parsing backup ${key}:`, error);
        }
      }
    }
    
    // Sort most recent first
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  /**
   * Restore from a backup
   */
  restoreFromBackup(backupKey) {
    try {
      const backupData = localStorage.getItem(backupKey);
      if (!backupData) {
        return false;
      }
      
      // Create a backup of the current state first
      this.createBackup();
      
      // Restore the backup data
      localStorage.setItem(STORAGE_KEY, backupData);
      
      // Reload the config
      this.userConfig = this.loadUserConfig();
      this.applyUserConfig();
      
      return true;
    } catch (error) {
      console.error('Error restoring from backup:', error);
      return false;
    }
  }

  /**
   * Reorder slides using drag and drop
   */
  reorderSlides(draggedSlideId, targetSlideId) {
    if (draggedSlideId === targetSlideId) {
      return true; // No change needed
    }

    // Get the slides in their current order
    const slides = this.getAllSlides();

    // Find the dragged and target slide indices
    const draggedSlideIndex = slides.findIndex(s => s.id === draggedSlideId);
    const targetSlideIndex = slides.findIndex(s => s.id === targetSlideId);

    if (draggedSlideIndex === -1 || targetSlideIndex === -1) {
      console.error('Slide not found for reordering');
      return false;
    }

    // Get the actual slide objects
    const draggedSlide = this.slides.find(s => s.id === draggedSlideId);
    const targetSlide = this.slides.find(s => s.id === targetSlideId);

    if (!draggedSlide || !targetSlide) {
      console.error('Could not find slides in collection');
      return false;
    }

    // Check if they're in the same section
    if (draggedSlide.section !== targetSlide.section) {
      console.error('Cannot reorder slides from different sections');
      return false;
    }

    // Calculate the new order value for the dragged slide
    let newOrder;

    if (draggedSlideIndex > targetSlideIndex) {
      // Moving up in the list
      if (targetSlideIndex === 0) {
        // Moving to the first position
        newOrder = slides[0].order - 1;
      } else {
        // Get the slide before the target
        const slideBefore = slides[targetSlideIndex - 1];
        newOrder = (slideBefore.order + targetSlide.order) / 2;
      }
    } else {
      // Moving down in the list
      if (targetSlideIndex === slides.length - 1) {
        // Moving to the last position
        newOrder = slides[slides.length - 1].order + 1;
      } else {
        // Get the slide after the target
        const slideAfter = slides[targetSlideIndex + 1];
        newOrder = (targetSlide.order + slideAfter.order) / 2;
      }
    }

    // Update the dragged slide's order
    const slideIndex = this.slides.findIndex(s => s.id === draggedSlideId);
    this.slides[slideIndex].order = newOrder;

    // Save to localStorage
    this.saveUserConfig();
    return true;
  }

  /**
   * Get the current section order
   */
  getSectionOrder() {
    // Get all unique sections
    const uniqueSections = [...new Set(this.slides.map(slide => slide.section))];

    // Get existing section order from userConfig if available
    const existingOrder = this.userConfig.sections || [];
    const existingSections = existingOrder.map(s => s.name);

    // Build the order - keeping existing order for sections that already have it
    // and adding new sections at the end
    const sections = [];

    // First add existing sections in their current order
    existingOrder.forEach((section, index) => {
      if (uniqueSections.includes(section.name)) {
        sections.push({
          name: section.name,
          order: section.order || index + 1
        });
      }
    });

    // Then add any new sections that don't have an order yet
    let maxOrder = sections.length > 0
      ? Math.max(...sections.map(s => s.order || 0))
      : 0;

    uniqueSections.forEach(sectionName => {
      if (!existingSections.includes(sectionName)) {
        maxOrder += 1;
        sections.push({
          name: sectionName,
          order: maxOrder
        });
      }
    });

    // Sort by order
    return sections.sort((a, b) => a.order - b.order);
  }

  /**
   * Reorder sections
   */
  reorderSections(sectionToMove, targetSection, position = 'after') {
    if (sectionToMove === targetSection) {
      return true; // No change needed
    }

    // Get current section order
    const sections = this.getSectionOrder();

    // Find the sections in the array
    const movingIndex = sections.findIndex(s => s.name === sectionToMove);
    const targetIndex = sections.findIndex(s => s.name === targetSection);

    if (movingIndex === -1 || targetIndex === -1) {
      console.error(`Cannot find sections to reorder: ${sectionToMove}, ${targetSection}`);
      return false;
    }

    // Remove the section from its current position
    const sectionToMoveObj = sections.splice(movingIndex, 1)[0];

    // Calculate insert position
    const insertPosition = position === 'before' ? targetIndex : targetIndex + 1;

    // Insert at new position
    sections.splice(insertPosition, 0, sectionToMoveObj);

    // Reassign order values to maintain sequence
    sections.forEach((section, index) => {
      section.order = index + 1;
    });

    // Save the new order
    this.userConfig.sections = sections;
    this.saveUserConfig();

    return true;
  }

  /**
   * Export slides to JSON
   */
  exportSlidesToJSON() {
    return JSON.stringify({
      slides: this.slides,
      sections: this.getSectionOrder(),
      configVersion: CONFIG_VERSION,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get the maximum order value
   */
  getMaxOrder() {
    return Math.max(...this.slides.map(slide => slide.order || 0));
  }

  /**
   * Get the next available ID
   */
  getNextAvailableId() {
    return Math.max(...this.slides.map(slide => slide.id)) + 1;
  }
}

// Create and export the singleton instance
const slideService = new SlideService();
export default slideService;