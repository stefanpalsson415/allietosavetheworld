import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Menu, X, Save,
  ChevronRight, ChevronDown, ChevronUp,
  PlusCircle, Eye, EyeOff, ArrowUp, ArrowDown,
  RefreshCw, Download, RotateCcw, AlertTriangle,
  CheckCircle, Sparkles, MessageSquare, MoreVertical, MoveHorizontal
} from 'lucide-react';

// Import slide service (we'll create a V4 version of this)
import slideService from './slideService';

// Define loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-700"></div>
    <p className="ml-4 text-xl font-semibold text-gray-700">Loading slide...</p>
  </div>
);

// CSS for nav and controls
const styleClasses = {
  sidebarLink: 'flex items-center px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded transition-colors duration-150',
  sidebarLinkActive: 'flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded font-medium',
  navButton: 'px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1',
  outlineButton: 'px-4 py-2 rounded-md border border-purple-600 text-purple-600 hover:bg-purple-50 flex items-center space-x-1',
  slideCard: 'p-4 bg-white rounded-lg shadow-sm mb-3 border border-gray-200 hover:border-purple-300 transition-colors duration-150',
  slideCardActive: 'p-4 bg-white rounded-lg shadow-sm mb-3 border-l-4 border-purple-500 border-gray-200 hover:border-purple-300 transition-colors duration-150',
  slideTitle: 'font-medium text-gray-800',
  slideSection: 'text-sm text-gray-500',
  draggable: 'cursor-grab active:cursor-grabbing',
  dragging: 'opacity-50 border-2 border-dashed border-purple-300 bg-purple-50',
  dropTarget: 'border-2 border-purple-500 bg-purple-50/30',
};

// Default section descriptions for the UI
const defaultSectionDescriptions = {
  'intro': 'Introduction',
  'problem': 'Problem Statement',
  'solution': 'Our Solution',
  'market': 'Market Analysis',
  'growth': 'Growth Strategy',
  'monetization': 'Monetization',
  'team': 'Team & Advisors',
  'financing': 'Financing & Next Steps',
};

/**
 * InvestorFunnelV4 Component
 * Version 4 with improved slide organization and UI
 */
const InvestorFunnelV4 = () => {
  const navigate = useNavigate();

  // State for the component
  const [activeSlides, setActiveSlides] = useState([]);
  const [allSlides, setAllSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [slidesBySection, setSlidesBySection] = useState({});
  const [expandedSections, setExpandedSections] = useState({});
  const [backups, setBackups] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [sectionDescriptions, setSectionDescriptions] = useState({...defaultSectionDescriptions});
  const [slideComponents, setSlideComponents] = useState({});

  // Drag and drop state
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedSlideId: null,
    draggedSection: null,
    dragOverSlideId: null
  });

  // Section drag and drop state
  const [sectionDragState, setSectionDragState] = useState({
    isDragging: false,
    draggedSection: null,
    dragOverSection: null
  });

  // Context menu for slide operations
  const [slideContextMenu, setSlideContextMenu] = useState({
    visible: false,
    slideId: null,
    x: 0,
    y: 0
  });

  // Modal for moving slides between sections
  const [moveSectionModal, setMoveSectionModal] = useState({
    visible: false,
    slideId: null,
    currentSection: null
  });

  // Modal for creating a new section
  const [newSectionModal, setNewSectionModal] = useState({
    visible: false,
    name: '',
    selectedSlides: []
  });

  // Modal for section management (rename/delete)
  const [manageSectionModal, setManageSectionModal] = useState({
    visible: false,
    section: null,
    newName: '',
    action: 'rename', // 'rename' or 'delete'
    targetSection: null
  });
  
  // Add a notification message
  const addNotification = useCallback((message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);
  
  // Initialize slide data
  useEffect(() => {
    loadSlides();
  }, []);

  // Load slides from the service
  const loadSlides = useCallback(() => {
    const active = slideService.getActiveSlides();
    const all = slideService.getAllSlides();
    const bySection = slideService.getSlidesBySection();
    const backupList = slideService.getAvailableBackups();

    setActiveSlides(active);
    setAllSlides(all);
    setSlidesBySection(bySection);
    setBackups(backupList);

    // Initialize expanded sections
    const initialExpandedSections = {};
    Object.keys(bySection).forEach(section => {
      initialExpandedSections[section] = true;
    });
    setExpandedSections(initialExpandedSections);

    // Ensure current slide index is valid
    if (currentSlideIndex >= active.length) {
      setCurrentSlideIndex(Math.max(0, active.length - 1));
    }

    // Load slide components dynamically
    loadSlideComponents(all);
  }, [currentSlideIndex]);

  // Load slide components dynamically
  const loadSlideComponents = (slides) => {
    const components = {};

    slides.forEach(slide => {
      if (slide.componentPath) {
        // Use dynamic import to lazy load the slide components
        components[slide.id] = lazy(() => import(`./slides/${slide.componentPath}.jsx`));
      }
    });

    setSlideComponents(components);
  };

  // Get ordered sections
  const getOrderedSections = useCallback(() => {
    const sections = slideService.getSectionOrder();
    return sections.map(s => s.name);
  }, []);

  // Toggle slide active status
  const toggleSlideActive = useCallback((slideId) => {
    const success = slideService.setSlideActive(slideId, !slideService.getSlideById(slideId).active);
    if (success) {
      loadSlides();
      addNotification(`Slide ${slideService.getSlideById(slideId).active ? 'activated' : 'deactivated'} successfully`);
    }
  }, [loadSlides, addNotification]);

  // Move slide up in order
  const moveSlideUp = useCallback((slideId) => {
    const success = slideService.moveSlideUp(slideId);
    if (success) {
      loadSlides();
      addNotification('Slide moved up successfully');
    }
  }, [loadSlides, addNotification]);

  // Move slide down in order
  const moveSlideDown = useCallback((slideId) => {
    const success = slideService.moveSlideDown(slideId);
    if (success) {
      loadSlides();
      addNotification('Slide moved down successfully');
    }
  }, [loadSlides, addNotification]);

  // Move slide to a different section
  const moveSlideToSection = useCallback((id, newSection) => {
    const success = slideService.moveSlideToSection(id, newSection);
    if (success) {
      loadSlides();
      addNotification(`Slide moved to ${newSection} section`);
      setMoveSectionModal(prev => ({ ...prev, visible: false }));
    }
  }, [loadSlides, addNotification]);

  // Get all available sections
  const getAvailableSections = useCallback(() => {
    return [...new Set(allSlides.map(slide => slide.section))].sort();
  }, [allSlides]);

  // Show modal to move slide to another section
  const showMoveSectionModal = useCallback((id) => {
    const slide = slideService.getSlideById(id);
    if (slide) {
      setMoveSectionModal({
        visible: true,
        slideId: id,
        currentSection: slide.section
      });
      setSlideContextMenu(prev => ({ ...prev, visible: false }));
    }
  }, []);

  // Handle click outside context menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (slideContextMenu.visible) {
        setSlideContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [slideContextMenu.visible]);

  // Create a new section
  const createSection = useCallback((name, slideIds = []) => {
    if (!name || name.trim() === '') {
      addNotification('Section name is required', 'error');
      return;
    }

    // Format the section name for consistency
    const formattedName = name.toLowerCase().trim().replace(/\s+/g, '-');

    // Add to sectionDescriptions if it doesn't exist
    if (!sectionDescriptions[formattedName]) {
      // Create a proper display name from the formatted name
      const displayName = formattedName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // Update the section descriptions using state setter
      setSectionDescriptions(prev => ({
        ...prev,
        [formattedName]: displayName
      }));
    }

    const success = slideService.createSection(name, slideIds);
    if (success) {
      // Force a reload of slides to pick up the new section
      loadSlides();

      // Set the new section to expanded by default
      setExpandedSections(prev => ({
        ...prev,
        [formattedName]: true
      }));

      addNotification(`Section "${name}" created successfully`);
      setNewSectionModal({
        visible: false,
        name: '',
        selectedSlides: []
      });
    } else {
      addNotification(`Failed to create section "${name}"`, 'error');
    }
  }, [loadSlides, sectionDescriptions, setSectionDescriptions, addNotification]);

  // Show modal to create a new section
  const showNewSectionModal = useCallback(() => {
    setNewSectionModal({
      visible: true,
      name: '',
      selectedSlides: []
    });
  }, []);

  // Rename a section
  const renameSection = useCallback((oldName, newName) => {
    if (!newName || newName.trim() === '') {
      addNotification('New section name is required', 'error');
      return;
    }

    // Format the section names for consistency
    const formattedOldName = oldName.toLowerCase().trim().replace(/\s+/g, '-');
    const formattedNewName = newName.toLowerCase().trim().replace(/\s+/g, '-');

    // Update the section descriptions state
    setSectionDescriptions(prev => {
      const newDescriptions = { ...prev };

      // Create display name for the new section
      const displayName = formattedNewName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      // If old name had a custom description, remove it
      if (formattedOldName in newDescriptions) {
        delete newDescriptions[formattedOldName];
      }

      // Add the new name
      newDescriptions[formattedNewName] = displayName;

      return newDescriptions;
    });

    const success = slideService.renameSection(oldName, newName);
    if (success) {
      loadSlides();
      addNotification(`Section renamed to "${newName}" successfully`);
      setManageSectionModal(prev => ({ ...prev, visible: false }));
    } else {
      addNotification(`Failed to rename section to "${newName}"`, 'error');
    }
  }, [loadSlides, setSectionDescriptions, addNotification]);

  // Delete a section
  const deleteSection = useCallback((sectionName, targetSection = null) => {
    // Format section name for consistency
    const formattedSectionName = sectionName.toLowerCase().trim().replace(/\s+/g, '-');

    // Update section descriptions to remove the deleted section
    setSectionDescriptions(prev => {
      const newDescriptions = { ...prev };
      if (formattedSectionName in newDescriptions) {
        delete newDescriptions[formattedSectionName];
      }
      return newDescriptions;
    });

    const success = slideService.deleteSection(sectionName, targetSection);
    if (success) {
      loadSlides();
      addNotification(`Section "${sectionName}" deleted successfully`);
      setManageSectionModal(prev => ({ ...prev, visible: false }));
    } else {
      addNotification(`Failed to delete section "${sectionName}"`, 'error');
    }
  }, [loadSlides, setSectionDescriptions, addNotification]);

  // Show modal to manage a section
  const showManageSectionModal = useCallback((section) => {
    setManageSectionModal({
      visible: true,
      section,
      newName: section,
      action: 'rename',
      targetSection: null
    });
  }, []);

  // Reorder sections
  const reorderSection = useCallback((sectionToMove, targetSection, position = 'after') => {
    const success = slideService.reorderSections(sectionToMove, targetSection, position);
    if (success) {
      loadSlides();
      addNotification(`Section "${sectionToMove}" moved ${position} "${targetSection}"`);
    } else {
      addNotification(`Failed to reorder section "${sectionToMove}"`, 'error');
    }
  }, [loadSlides, addNotification]);

  // Reset to default order
  const resetToDefault = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all slides to their default order and visibility?')) {
      const success = slideService.resetToDefault();
      if (success) {
        loadSlides();
        addNotification('Slides reset to default successfully');
      }
    }
  }, [loadSlides, addNotification]);

  // Restore from backup
  const restoreFromBackup = useCallback((backupKey) => {
    if (window.confirm('Are you sure you want to restore from this backup? Current slide order and visibility will be overwritten.')) {
      const success = slideService.restoreFromBackup(backupKey);
      if (success) {
        loadSlides();
        addNotification('Restored from backup successfully');
      }
    }
  }, [loadSlides, addNotification]);

  // Export slides configuration
  const exportSlides = useCallback(() => {
    try {
      const dataStr = slideService.exportSlidesToJSON();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `investor-slides-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      addNotification('Slides exported successfully');
    } catch (error) {
      console.error('Error exporting slides:', error);
      addNotification('Error exporting slides', 'error');
    }
  }, [addNotification]);

  // Toggle section expanded state
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Navigation functions
  const goToNextSlide = useCallback(() => {
    if (currentSlideIndex < activeSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  }, [currentSlideIndex, activeSlides.length]);

  const goToPrevSlide = useCallback(() => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  }, [currentSlideIndex]);

  const goToSlide = useCallback((index) => {
    if (index >= 0 && index < activeSlides.length) {
      setCurrentSlideIndex(index);
    }
  }, [activeSlides.length]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e, slideId, section) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'slide',
      slideId,
      section
    }));

    // Set a drag image if supported
    try {
      const dragElement = e.currentTarget.cloneNode(true);
      dragElement.style.width = `${e.currentTarget.offsetWidth}px`;
      dragElement.style.height = `${e.currentTarget.offsetHeight}px`;
      dragElement.style.backgroundColor = '#f3f4f6';
      dragElement.style.border = '2px solid #8b5cf6';
      dragElement.style.opacity = '0.8';
      dragElement.style.position = 'absolute';
      dragElement.style.top = '-1000px';
      document.body.appendChild(dragElement);

      e.dataTransfer.setDragImage(dragElement, 20, 20);

      // Clean up the element after a short delay
      setTimeout(() => {
        document.body.removeChild(dragElement);
      }, 100);
    } catch (error) {
      console.log("Custom drag image not supported", error);
    }

    // Slight delay helps with drag image rendering
    setTimeout(() => {
      setDragState({
        isDragging: true,
        draggedSlideId: slideId,
        draggedSection: section,
        dragOverSlideId: null
      });
    }, 10);
  }, []);

  const handleDragOver = useCallback((e, slideId) => {
    // This prevents the default behavior and allows drop
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (dragState.dragOverSlideId !== slideId) {
      setDragState(prev => ({
        ...prev,
        dragOverSlideId: slideId
      }));
    }
  }, [dragState.dragOverSlideId]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedSlideId: null,
      draggedSection: null,
      dragOverSlideId: null
    });
  }, []);

  const handleDrop = useCallback((e, targetSlideId, targetSection) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      const { slideId: draggedSlideId, section: draggedSection } = data;

      // Skip if dropping onto itself
      if (draggedSlideId === targetSlideId) {
        return handleDragEnd();
      }

      // If dropping in the same section, reorder slides
      if (draggedSection === targetSection) {
        console.log(`Reordering slide in same section ${targetSection}`);
        const success = slideService.reorderSlides(draggedSlideId, targetSlideId);
        if (success) {
          // Force re-save the config to ensure persistence
          slideService.saveUserConfig();
          // Force reload of slides from localStorage
          loadSlides();
          addNotification('Slide reordered successfully');
        } else {
          addNotification('Failed to reorder slide', 'error');
        }
      } else if (draggedSection !== targetSection) {
        // If dropping in a different section, move the slide to that section
        console.log(`Moving slide from ${draggedSection} to ${targetSection}`);
        const success = slideService.moveSlideToSection(draggedSlideId, targetSection);
        if (success) {
          // Force re-save the config to ensure persistence
          slideService.saveUserConfig();
          // Force reload of slides from localStorage
          loadSlides();
          addNotification(`Slide moved to ${targetSection} section`);
        } else {
          addNotification(`Failed to move slide to ${targetSection}`, 'error');
        }
      }
    } catch (error) {
      console.error("Error handling drop:", error);
      addNotification('Error while reordering slides', 'error');
    }

    handleDragEnd();
  }, [loadSlides, addNotification, handleDragEnd]);

  // Section drag and drop handlers
  const handleSectionDragStart = useCallback((e, section) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'section',
      section
    }));

    // Set a drag image if supported
    try {
      const dragElement = e.currentTarget.cloneNode(true);
      dragElement.style.width = `${e.currentTarget.offsetWidth}px`;
      dragElement.style.height = `${e.currentTarget.offsetHeight}px`;
      dragElement.style.backgroundColor = '#f3f4f6';
      dragElement.style.border = '2px solid #8b5cf6';
      dragElement.style.opacity = '0.8';
      dragElement.style.position = 'absolute';
      dragElement.style.top = '-1000px';
      document.body.appendChild(dragElement);

      e.dataTransfer.setDragImage(dragElement, 20, 20);

      // Clean up the element after a short delay
      setTimeout(() => {
        document.body.removeChild(dragElement);
      }, 100);
    } catch (error) {
      console.log("Custom drag image not supported", error);
    }

    // Slight delay helps with drag image rendering
    setTimeout(() => {
      setSectionDragState({
        isDragging: true,
        draggedSection: section,
        dragOverSection: null
      });
    }, 10);
  }, []);

  const handleSectionDragOver = useCallback((e, section) => {
    // This prevents the default behavior and allows drop
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    if (sectionDragState.dragOverSection !== section) {
      setSectionDragState(prev => ({
        ...prev,
        dragOverSection: section
      }));
    }
  }, [sectionDragState.dragOverSection]);

  const handleSectionDragEnd = useCallback(() => {
    setSectionDragState({
      isDragging: false,
      draggedSection: null,
      dragOverSection: null
    });
  }, []);

  const handleSectionDrop = useCallback((e, targetSection) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'section') {
        const { section: draggedSection } = data;

        // Skip if dropping onto itself
        if (draggedSection === targetSection) {
          return handleSectionDragEnd();
        }

        console.log(`Reordering section: moving ${draggedSection} after ${targetSection}`);
        const success = slideService.reorderSections(draggedSection, targetSection, 'after');
        if (success) {
          loadSlides();
          addNotification(`Section "${draggedSection}" moved successfully`);
        } else {
          addNotification('Failed to reorder section', 'error');
        }
      }
    } catch (error) {
      console.error("Error handling section drop:", error);
      addNotification('Error while reordering sections', 'error');
    }

    handleSectionDragEnd();
  }, [loadSlides, addNotification, handleSectionDragEnd]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextSlide, goToPrevSlide]);

  // Get current slide component
  const getCurrentSlide = () => {
    if (activeSlides.length === 0) {
      return null;
    }

    const slide = activeSlides[currentSlideIndex];
    if (!slide) return null;

    // Handle dynamic component loading
    if (slideComponents[slide.id]) {
      const SlideComponent = slideComponents[slide.id];
      return (
        <Suspense fallback={<LoadingFallback />}>
          <SlideComponent />
        </Suspense>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <AlertTriangle size={48} className="text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Slide Component Not Found</h2>
        <p className="text-gray-600">The component for this slide could not be loaded.</p>
        <p className="text-gray-500 text-sm mt-4">Slide ID: {slide.id}, Title: {slide.title}</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Slide Manager</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showInactive"
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
                className="mr-2"
              />
              <label htmlFor="showInactive" className="text-sm text-gray-600">Show inactive slides</label>
            </div>
            <button
              onClick={resetToDefault}
              className="text-sm text-gray-600 hover:text-purple-600 flex items-center"
            >
              <RefreshCw size={14} className="mr-1" />
              Reset
            </button>
          </div>

          {/* Slide helper */}
          <div className="mb-2 text-xs text-purple-700 flex items-center justify-end">
            <svg className="w-3 h-3 mr-1 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 8V6m0 8v-2m0 8v-2M3 6h18M3 12h18M3 18h18" />
            </svg>
            <span>Drag to reorder</span>
          </div>

          <div className="flex space-x-2 mb-2">
            <button
              onClick={exportSlides}
              className="flex-1 py-1.5 px-2 text-sm rounded flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              <Download size={14} className="mr-1" />
              Export
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={showNewSectionModal}
              className="flex-1 py-1.5 px-2 text-sm rounded flex items-center justify-center bg-purple-50 text-purple-700 hover:bg-purple-100"
            >
              <PlusCircle size={14} className="mr-1" />
              New Section
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {Object.keys(slidesBySection).map(section => (
            <div key={section} className="mb-2">
              <div
                className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 group"
              >
                <div 
                  className="flex-1 flex items-center cursor-pointer"
                  onClick={() => toggleSection(section)}
                >
                  <div className="mr-2">
                    {expandedSections[section] ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-700">{sectionDescriptions[section] || section.charAt(0).toUpperCase() + section.slice(1)}</h3>
                </div>
                <div className="ml-auto flex items-center space-x-1">
                  <div className="text-xs text-gray-500 mr-2">
                    {slidesBySection[section].filter(s => s.active).length}/{slidesBySection[section].length}
                  </div>
                  {/* Up arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const sections = getOrderedSections();
                      const currentIndex = sections.findIndex(s => s === section);
                      if (currentIndex > 0) {
                        const targetSection = sections[currentIndex - 1];
                        reorderSection(section, targetSection, 'before');
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-purple-600"
                    title="Move section up"
                    disabled={getOrderedSections().findIndex(s => s === section) === 0}
                  >
                    <ArrowUp size={14} />
                  </button>
                  {/* Down arrow */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const sections = getOrderedSections();
                      const currentIndex = sections.findIndex(s => s === section);
                      if (currentIndex < sections.length - 1) {
                        const targetSection = sections[currentIndex + 1];
                        reorderSection(section, targetSection, 'after');
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-purple-600"
                    title="Move section down"
                    disabled={getOrderedSections().findIndex(s => s === section) === getOrderedSections().length - 1}
                  >
                    <ArrowDown size={14} />
                  </button>
                  {/* Manage section button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showManageSectionModal(section);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-purple-600"
                    title="Manage section"
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
              </div>
              
              {expandedSections[section] && (
                <div className="pl-4 pr-2 py-2">
                  {slidesBySection[section]
                    .filter(slide => showInactive || slide.active)
                    .map(slide => {
                      const isActive = activeSlides.findIndex(s => s.id === slide.id) !== -1;
                      const isCurrent = activeSlides[currentSlideIndex]?.id === slide.id;

                      return (
                        <div
                          key={slide.id}
                          className={`${isCurrent ? 'bg-purple-50 border-l-2 border-purple-500' : 'bg-white'}
                            ${dragState.isDragging && dragState.draggedSlideId === slide.id ? styleClasses.dragging : ''}
                            ${dragState.isDragging && dragState.dragOverSlideId === slide.id ? styleClasses.dropTarget : ''}
                            p-2 mb-1 rounded hover:bg-purple-50 transition-all duration-150`}
                          onClick={() => {
                            if (isActive) {
                              const index = activeSlides.findIndex(s => s.id === slide.id);
                              if (index !== -1) {
                                goToSlide(index);
                              }
                            }
                          }}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, slide.id, section)}
                          onDragOver={(e) => handleDragOver(e, slide.id)}
                          onDragEnd={handleDragEnd}
                          onDrop={(e) => handleDrop(e, slide.id, section)}
                        >
                          <div className="grid grid-cols-[auto,1fr,auto] w-full items-center gap-2">
                            {/* Drag handle */}
                            <div
                              className={`${styleClasses.draggable} w-6 h-6 flex items-center justify-center text-gray-400 hover:text-purple-600`}
                              title="Drag to reorder"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="5" r="1" />
                                <circle cx="9" cy="12" r="1" />
                                <circle cx="9" cy="19" r="1" />
                                <circle cx="15" cy="5" r="1" />
                                <circle cx="15" cy="12" r="1" />
                                <circle cx="15" cy="19" r="1" />
                              </svg>
                            </div>

                            <div className="truncate">
                              <span className={`${!slide.active ? 'text-gray-400' : 'text-gray-700'} font-medium`}>
                                {slide.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1 justify-end">
                              {/* Move to section button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showMoveSectionModal(slide.id);
                                }}
                                className="p-1 text-gray-400 hover:text-purple-600 w-7 h-7 flex items-center justify-center"
                                title="Move to different section"
                              >
                                <MoveHorizontal size={14} />
                              </button>

                              {/* Toggle visibility button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSlideActive(slide.id);
                                }}
                                className="p-1 text-gray-400 hover:text-purple-600 w-7 h-7 flex items-center justify-center"
                                title={slide.active ? "Hide slide" : "Show slide"}
                              >
                                {slide.active ? <Eye size={14} /> : <EyeOff size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Backups section */}
        {backups.length > 0 && (
          <div className="p-3 border-t border-gray-200">
            <div className="mb-2">
              <h3 className="text-sm font-medium text-gray-700">Backups</h3>
              <p className="text-xs text-gray-500">Restore a previous slide configuration</p>
            </div>
            <div className="max-h-32 overflow-y-auto">
              {backups.map(backup => (
                <div 
                  key={backup.key}
                  className="flex items-center justify-between p-2 text-sm hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => restoreFromBackup(backup.key)}
                >
                  <div>
                    <div className="text-gray-700">{new Date(backup.timestamp.replace(/-/g, ':')).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{backup.slideCount} slides</div>
                  </div>
                  <div>
                    <RotateCcw size={14} className="text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            {!sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="mr-4 text-gray-500 hover:text-gray-700"
              >
                <Menu size={24} />
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-800">Allie Investor Deck</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Slide {currentSlideIndex + 1} of {activeSlides.length}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToPrevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-2 rounded-md ${currentSlideIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ArrowLeft size={20} />
              </button>
              
              <button 
                onClick={goToNextSlide}
                disabled={currentSlideIndex === activeSlides.length - 1}
                className={`p-2 rounded-md ${currentSlideIndex === activeSlides.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Slide content */}
        <div className="flex-1 overflow-auto">
          {activeSlides.length > 0 ? (
            <div className="p-8 h-full">
              <div className={`bg-white rounded-lg shadow-lg h-full p-10 max-w-6xl mx-auto ${
                activeSlides[currentSlideIndex]?.id === 'allie-intro' ? 'overflow-visible' : 'overflow-auto'
              }`}>
                {getCurrentSlide()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8">
              <AlertTriangle size={48} className="text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Slides</h2>
              <p className="text-gray-600 mb-6">There are no active slides to display.</p>
              <button
                onClick={() => {
                  setShowInactive(true);
                  setSidebarOpen(true);
                }}
                className={styleClasses.outlineButton}
              >
                <PlusCircle size={16} className="mr-2" />
                Activate Slides
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`px-4 py-2 rounded-md shadow-md flex items-center ${
              notification.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertTriangle size={16} className="mr-2" />
            ) : (
              <CheckCircle size={16} className="mr-2" />
            )}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>

      {/* Context menu for slide options */}
      {slideContextMenu.visible && (
        <div
          className="fixed bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
          style={{
            left: slideContextMenu.x,
            top: slideContextMenu.y
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => showMoveSectionModal(slideContextMenu.slideId)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 flex items-center"
          >
            <MoveHorizontal size={14} className="mr-2" />
            Move to Section
          </button>
        </div>
      )}

      {/* Move to section modal */}
      {moveSectionModal.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-4">Move Slide to Section</h3>

            <p className="text-gray-600 mb-6">
              Select the section where you want to move this slide:
            </p>

            <div className="space-y-2 mb-6">
              {getAvailableSections().map(section => {
                const isCurrentSection = section === moveSectionModal.currentSection;

                return (
                  <button
                    key={section}
                    onClick={() => moveSlideToSection(moveSectionModal.slideId, section)}
                    className={`w-full py-2 px-4 rounded text-left flex items-center justify-between ${
                      isCurrentSection
                        ? 'bg-purple-100 text-purple-800 font-medium'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                    disabled={isCurrentSection}
                  >
                    <span>{section.charAt(0).toUpperCase() + section.slice(1)}</span>
                    {isCurrentSection && (
                      <span className="text-sm text-purple-600">(Current)</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setMoveSectionModal(prev => ({ ...prev, visible: false }))}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create new section modal */}
      {newSectionModal.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-4">Create New Section</h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section Name:
              </label>
              <input
                type="text"
                value={newSectionModal.name}
                onChange={e => setNewSectionModal(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter section name..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setNewSectionModal(prev => ({ ...prev, visible: false }))}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => createSection(newSectionModal.name, newSectionModal.selectedSlides)}
                className="px-4 py-2 bg-purple-600 rounded text-white hover:bg-purple-700"
              >
                Create Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manage section modal */}
      {manageSectionModal.visible && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl mb-4">Manage Section</h3>

            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setManageSectionModal(prev => ({ ...prev, action: 'rename' }))}
                  className={`px-4 py-2 rounded-md ${manageSectionModal.action === 'rename' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Rename
                </button>
                <button
                  onClick={() => setManageSectionModal(prev => ({ ...prev, action: 'delete' }))}
                  className={`px-4 py-2 rounded-md ${manageSectionModal.action === 'delete' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Delete
                </button>
              </div>

              {manageSectionModal.action === 'rename' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Section Name:
                  </label>
                  <input
                    type="text"
                    value={manageSectionModal.newName}
                    onChange={e => setManageSectionModal(prev => ({ ...prev, newName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter new section name..."
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    What would you like to do with the slides in this section?
                  </p>
                  <select
                    value={manageSectionModal.targetSection || ''}
                    onChange={e => setManageSectionModal(prev => ({ ...prev, targetSection: e.target.value || null }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Deactivate all slides</option>
                    {getAvailableSections()
                      .filter(s => s !== manageSectionModal.section)
                      .map(section => (
                        <option key={section} value={section}>
                          Move to {section.charAt(0).toUpperCase() + section.slice(1)}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setManageSectionModal(prev => ({ ...prev, visible: false }))}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              {manageSectionModal.action === 'rename' ? (
                <button
                  onClick={() => renameSection(manageSectionModal.section, manageSectionModal.newName)}
                  className="px-4 py-2 bg-purple-600 rounded text-white hover:bg-purple-700"
                >
                  Rename
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete the "${manageSectionModal.section}" section?`)) {
                      deleteSection(manageSectionModal.section, manageSectionModal.targetSection);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 rounded text-white hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorFunnelV4;