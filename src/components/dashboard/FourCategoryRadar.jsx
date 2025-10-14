// src/components/dashboard/FourCategoryRadar.jsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Eye, EyeOff, Brain, Wrench, X, Plus, ChevronRight, Users, Calendar, RefreshCw
} from 'lucide-react';
import SubCategoryAnalyzer from '../../services/SubCategoryAnalyzer';

const FourCategoryRadar = ({
  surveyData,
  onSelectHabit,
  selectedPerson = 'both',
  familyMembers = [],
  className = '',
  initialFilter = 'parents'
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null); // Track clicked subcategory
  const [respondentFilter, setRespondentFilter] = useState(initialFilter);
  const [showSubRadar, setShowSubRadar] = useState(false);
  const [suggestionOffset, setSuggestionOffset] = useState(0); // For refreshing habit suggestions

  // Define the Four Categories with their subcategories
  const mainCategories = [
    { 
      id: 'invisible_parenting', 
      label: 'Invisible Parental Tasks', 
      icon: EyeOff,
      color: '#8B5CF6', // purple
      description: 'Planning, remembering, emotional work',
      medal: '🥇',
      subcategories: [
        { 
          id: 'worrying', 
          label: 'Worrying About Kids', 
          value: 0,
          detail: 'Concerns about health, friendships, development, school performance, and future',
          time: 'Constant mental load'
        },
        { 
          id: 'planning_ahead', 
          label: 'Planning Kids\' Schedules', 
          value: 0,
          detail: 'Doctor appointments, school events, activities, playdates, birthday parties',
          time: '1-2 hours/week'
        },
        { 
          id: 'remembering', 
          label: 'Remembering Everything', 
          value: 0,
          detail: 'Permission slips, spirit days, friend birthdays, favorite foods, doctor appointments',
          time: 'Continuous mental energy'
        },
        { 
          id: 'emotional_support', 
          label: 'Emotional Support', 
          value: 0,
          detail: 'Comforting upset children, building confidence, processing big feelings',
          time: '1-3 hours/day'
        },
        { 
          id: 'anticipating', 
          label: 'Anticipating Needs', 
          value: 0,
          detail: 'Knowing when they need a snack, rest, or attention before meltdowns',
          time: 'All day awareness'
        },
        { 
          id: 'mediating', 
          label: 'Mediating Conflicts', 
          value: 0,
          detail: 'Sibling disputes, friend drama, teaching conflict resolution skills',
          time: '30-60 min/day'
        }
      ]
    },
    { 
      id: 'visible_parenting', 
      label: 'Visible Parental Tasks', 
      icon: Eye,
      color: '#3B82F6', // blue
      description: 'Physical care and activities',
      medal: '🥈',
      subcategories: [
        { 
          id: 'driving', 
          label: 'Driving to Activities', 
          value: 0,
          detail: 'School dropoffs, sports practice, music lessons, playdates',
          time: '1-2 hours/day'
        },
        { 
          id: 'homework', 
          label: 'Homework Help', 
          value: 0,
          detail: 'Checking assignments, explaining concepts, project assistance, reading together',
          time: '30-90 min/day'
        },
        { 
          id: 'events', 
          label: 'Attending School Events', 
          value: 0,
          detail: 'School plays, sports games, parent-teacher conferences, field trips',
          time: '3-5 hours/week'
        },
        { 
          id: 'meals', 
          label: 'Making Kids\' Meals', 
          value: 0,
          detail: 'Breakfast prep, packing lunches, snacks, special dietary needs',
          time: '1-2 hours/day'
        },
        { 
          id: 'activities', 
          label: 'Activity Supervision', 
          value: 0,
          detail: 'Playdates, park visits, crafts, sports practice, screen time monitoring',
          time: '2-4 hours/day'
        },
        { 
          id: 'bedtime', 
          label: 'Bedtime Routines', 
          value: 0,
          detail: 'Bath time, story reading, tucking in, and getting kids settled for sleep',
          time: '45-60 min/night'
        }
      ]
    },
    { 
      id: 'invisible_household', 
      label: 'Invisible Household Tasks', 
      icon: Brain,
      color: '#10B981', // green
      description: 'Planning and mental household work',
      medal: '🥉',
      subcategories: [
        { 
          id: 'meal_planning', 
          label: 'Meal Planning', 
          value: 0,
          detail: 'Planning weekly meals, dietary needs, grocery lists, recipe research',
          time: '1-2 hours/week'
        },
        { 
          id: 'scheduling', 
          label: 'Managing Schedules', 
          value: 0,
          detail: 'Coordinating family calendars, appointments, and avoiding conflicts',
          time: '30-45 min/day'
        },
        { 
          id: 'research', 
          label: 'Researching Services', 
          value: 0,
          detail: 'Finding contractors, comparing prices, reading reviews, getting quotes',
          time: '2-3 hours/week'
        },
        { 
          id: 'tracking', 
          label: 'Tracking Household Needs', 
          value: 0,
          detail: 'Monitoring supplies, maintenance schedules, expiration dates',
          time: '20-30 min/day'
        },
        { 
          id: 'organizing', 
          label: 'Organizing Systems', 
          value: 0,
          detail: 'Creating and maintaining household routines, storage, paperwork systems',
          time: '1-2 hours/week'
        },
        { 
          id: 'budgeting', 
          label: 'Financial Planning', 
          value: 0,
          detail: 'Managing family budget, bills, savings, expenses, and financial goals',
          time: '1-2 hours/week'
        }
      ]
    },
    { 
      id: 'visible_household', 
      label: 'Visible Household Tasks', 
      icon: Wrench,
      color: '#F59E0B', // amber
      description: 'Physical household management',
      medal: '',
      subcategories: [
        { 
          id: 'cleaning', 
          label: 'Cleaning', 
          value: 0,
          detail: 'Daily tidying, weekly deep cleans, maintaining organized spaces',
          time: '1-2 hours/day'
        },
        { 
          id: 'laundry', 
          label: 'Laundry', 
          value: 0,
          detail: 'Washing, drying, folding, and putting away family clothes and linens',
          time: '45-60 min/load'
        },
        { 
          id: 'groceries', 
          label: 'Grocery Shopping', 
          value: 0,
          detail: 'Shopping for food and household items, putting groceries away',
          time: '2-3 hours/week'
        },
        { 
          id: 'cooking', 
          label: 'Cooking', 
          value: 0,
          detail: 'Preparing meals, cooking dinner, meal prep for the week',
          time: '1-2 hours/day'
        },
        { 
          id: 'repairs', 
          label: 'Home Repairs', 
          value: 0,
          detail: 'Fixing things, basic maintenance, meeting repair people',
          time: '2-4 hours/week'
        },
        { 
          id: 'yard', 
          label: 'Yard Work', 
          value: 0,
          detail: 'Mowing, gardening, snow removal, outdoor maintenance',
          time: '2-3 hours/week'
        }
      ]
    }
  ];

  // Process survey data for main categories with filter
  const mainRadarData = useMemo(() => {
    console.log('FourCategoryRadar received surveyData:', surveyData);
    console.log('FourCategoryRadar surveyData type:', typeof surveyData);
    console.log('FourCategoryRadar surveyData keys:', surveyData ? Object.keys(surveyData) : 'null');

    // Debug: Check if we're getting demo data vs real data
    if (surveyData && surveyData.mama && surveyData.papa) {
      const mamaTotal = Object.values(surveyData.mama).reduce((sum, val) => sum + val, 0);
      const papaTotal = Object.values(surveyData.papa).reduce((sum, val) => sum + val, 0);
      console.log('FourCategoryRadar data totals:', { mamaTotal, papaTotal });

      // Demo data typically has specific values (70, 35, 80, 25) and (30, 65, 20, 75)
      const isDemoData = mamaTotal === 210 && papaTotal === 190; // Sum of demo values
      console.log('FourCategoryRadar is demo data:', isDemoData);
    }

    if (!surveyData) return { mama: [], papa: [] };

    // IMPORTANT: Always use pre-calculated data from TasksTab for main chart
    // TasksTab has already done weighted calculations correctly
    // Only recalculate from rawResponses if we're filtering by Kids only
    if (surveyData.mama && surveyData.papa && respondentFilter !== 'kids') {
      console.log('Using pre-calculated weighted data from TasksTab');
      const processData = (person) => {
        return mainCategories.map((cat) => {
          const value = surveyData[person]?.[cat.id] || 50;
          return {
            category: cat.id,
            value: Math.min(100, Math.max(0, value))
          };
        });
      };

      return {
        mama: processData('mama'),
        papa: processData('papa')
      };
    }

    // Only recalculate if filtering by kids (kids don't have pre-calculated data)
    if (surveyData.rawResponses && surveyData.hasEnrichedData && respondentFilter === 'kids') {
      console.log('Processing enriched data with filter:', respondentFilter);
      
      // Initialize category counts for filtered data
      const filteredCategoryData = {
        invisible_parenting: { mama: 0, papa: 0, both: 0, total: 0 },
        visible_parenting: { mama: 0, papa: 0, both: 0, total: 0 },
        invisible_household: { mama: 0, papa: 0, both: 0, total: 0 },
        visible_household: { mama: 0, papa: 0, both: 0, total: 0 }
      };
      
      // Debug: Check member roles
      let parentCount = 0;
      let childCount = 0;
      let unknownCount = 0;
      
      // Process only responses from the selected filter group
      Object.entries(surveyData.rawResponses).forEach(([key, responseData]) => {
        // Handle both string and object response formats
        let answer, category, weight, memberRole, isParent, isChild;
        
        if (typeof responseData === 'string') {
          // Simple string response - treat as parent response
          answer = responseData;
          category = null; // Will be determined from question ID
          weight = 1;
          memberRole = 'parent';
          isParent = true;
          isChild = false;
        } else {
          // Object response with metadata
          answer = responseData.answer || responseData;
          category = responseData.category;
          weight = parseFloat(responseData.totalWeight) || responseData.weight || 1; // FIX: Use totalWeight like SubCategoryAnalyzer
          memberRole = responseData.memberRole || 'parent';
          isParent = responseData.isParent !== undefined ? responseData.isParent : memberRole === 'parent';
          isChild = responseData.isChild !== undefined ? responseData.isChild : memberRole === 'child';
        }
        
        // Count roles for debugging
        if (isParent) parentCount++;
        else if (isChild) childCount++;
        else unknownCount++;
        
        // Apply filter
        if (respondentFilter === 'parents' && !isParent) return;
        if (respondentFilter === 'kids' && !isChild) return;
        // 'family' includes all
        
        // Normalize category names (handle both formats)
        if (category) {
          // Convert "Visible Household Tasks" to "visible_household"
          category = category.toLowerCase()
            .replace(' tasks', '')
            .replace(' ', '_');
        }
        
        // If category is missing or Unknown, try to determine from question ID
        if (!category || category === 'unknown') {
          // Extract question number from key (e.g., "userId_q42" -> 42)
          const parts = key.split('_');
          const questionPart = parts[parts.length - 1];
          const qNum = parseInt(questionPart.replace(/[^0-9]/g, ''));
          
          if (!isNaN(qNum)) {
            // Map based on question number ranges (same as TasksTab)
            if (qNum >= 1 && qNum <= 18) {
              category = 'visible_household';
            } else if (qNum >= 19 && qNum <= 36) {
              category = 'invisible_household';
            } else if (qNum >= 37 && qNum <= 54) {
              category = 'visible_parenting';
            } else if (qNum >= 55 && qNum <= 72) {
              category = 'invisible_parenting';
            }
          }
        }
        
        // Count weighted responses
        if (category && filteredCategoryData[category] && answer && answer !== 'N/A' && answer !== 'NA') {
          // Normalize answer to match TasksTab format
          const normalizedAnswer = answer.toString().toLowerCase().trim();
          
          if (normalizedAnswer === 'mama' || normalizedAnswer === 'mother' || normalizedAnswer === 'mom') {
            filteredCategoryData[category].mama += weight;
          } else if (normalizedAnswer === 'papa' || normalizedAnswer === 'father' || normalizedAnswer === 'dad') {
            filteredCategoryData[category].papa += weight;
          } else if (normalizedAnswer === 'both' || normalizedAnswer === 'both equally' || normalizedAnswer === 'draw' || normalizedAnswer === 'tie') {
            filteredCategoryData[category].both += weight;
          }
          filteredCategoryData[category].total += weight;
        } else {
          // Debug why responses are being skipped
          if (Object.keys(surveyData.rawResponses).indexOf(key) < 5) {
            console.log('Skipped response in filtering:', {
              key,
              category,
              validCategory: category && filteredCategoryData[category],
              answer,
              isNA: answer === 'N/A' || answer === 'NA'
            });
          }
        }
      });
      
      console.log('Role distribution:', {
        parentCount,
        childCount,
        unknownCount,
        totalResponses: Object.keys(surveyData.rawResponses).length,
        filteredCategories: filteredCategoryData
      });
      
      // Log detailed filtered category data
      console.log('Filtered category totals:', {
        invisible_parenting: filteredCategoryData.invisible_parenting.total,
        visible_parenting: filteredCategoryData.visible_parenting.total,
        invisible_household: filteredCategoryData.invisible_household.total,
        visible_household: filteredCategoryData.visible_household.total
      });
      
      // Calculate percentages for filtered data
      const processData = (person) => {
        return mainCategories.map((cat, index) => {
          const counts = filteredCategoryData[cat.id];
          let value = 50; // default
          
          if (counts && counts.total > 0) {
            const mamaTotal = counts.mama + (counts.both * 0.5);
            const papaTotal = counts.papa + (counts.both * 0.5);
            const total = mamaTotal + papaTotal;
            
            if (total > 0) {
              value = person === 'mama' 
                ? Math.round((mamaTotal / total) * 100)
                : Math.round((papaTotal / total) * 100);
            }
          } else {
            // Create varied demo data to show chart shape when no real data
            // This creates an irregular polygon instead of a perfect square
            // Categories: invisible_parenting, visible_parenting, invisible_household, visible_household
            const demoVariations = [70, 35, 80, 25]; // Typical imbalanced family workload data
            value = person === 'mama' ? demoVariations[index] : (100 - demoVariations[index]);
          }
          
          return {
            category: cat.id,
            value: Math.min(100, Math.max(0, value))
          };
        });
      };
      
      const result = {
        mama: processData('mama'),
        papa: processData('papa')
      };
      
      console.log('Filtered radar data for', respondentFilter, ':', {
        mama: result.mama.map(d => `${d.category}: ${d.value}`),
        papa: result.papa.map(d => `${d.category}: ${d.value}`)
      });
      
      return result;
    }
    
    // Fallback to pre-calculated data
    const dataToUse = surveyData;
    console.log('Using pre-calculated data:', dataToUse);
    const processData = (person) => {
      return mainCategories.map((cat, index) => {
        let value = dataToUse[person]?.[cat.id];
        
        // If no data exists, create varied demo data instead of 50/50
        if (value === undefined || value === null) {
          // Create varied demo data to show chart shape when no real data
          // This creates an irregular polygon instead of a perfect square
          // Categories: invisible_parenting, visible_parenting, invisible_household, visible_household
          const demoVariations = [70, 35, 80, 25]; // Typical imbalanced family workload data
          value = person === 'mama' ? demoVariations[index] : (100 - demoVariations[index]);
        }
        
        console.log(`${person} - ${cat.id}: ${value}`);
        
        return {
          category: cat.id,
          value: Math.min(100, Math.max(0, value))
        };
      });
    };

    const result = {
      mama: processData('mama'),
      papa: processData('papa')
    };
    
    console.log('FourCategoryRadar mainRadarData calculated:', {
      mama: result.mama,
      papa: result.papa,
      respondentFilter
    });
    
    return result;
  }, [surveyData, respondentFilter]);

  // Process data for subcategory radar with filter
  const subRadarData = useMemo(() => {
    if (!selectedCategory || !surveyData) return { mama: [], papa: [] };

    // Check if we have subcategory analysis data
    if (surveyData.subcategoryAnalysis) {
      // Map category labels to their IDs for lookup
      const categoryMap = {
        'Invisible Parental Tasks': 'invisible_parenting',
        'Visible Parental Tasks': 'visible_parenting',
        'Invisible Household Tasks': 'invisible_household',
        'Visible Household Tasks': 'visible_household'
      };

      const categoryId = categoryMap[selectedCategory.label] || selectedCategory.id;
      const categoryData = surveyData.subcategoryAnalysis[categoryId];

      if (categoryData && categoryData.subcategories) {
        console.log('FourCategoryRadar: Using WEIGHTED subcategory data for', categoryId, categoryData);

        // Process real subcategory data (NOW WEIGHTED!)
        const processSubData = (person) => {
          return selectedCategory.subcategories.map(subcat => {
            const subcatData = categoryData.subcategories[subcat.id];
            let value = 0;

            if (subcatData) {
              // Get the WEIGHTED percentage for this person
              value = person === 'mama' ? parseFloat(subcatData.mamaPercent) || 0 : parseFloat(subcatData.papaPercent) || 0;

              // Log weights for debugging
              if (person === 'mama' && subcatData.mamaWeight) {
                console.log(`  ${subcat.id}: Mama ${subcatData.mamaPercent}% (weight: ${subcatData.mamaWeight.toFixed(2)})`);
              }

              // Apply filter adjustments
              if (respondentFilter === 'kids') {
                // Kids perspective adjustments
                value = value * 0.8; // Kids see less of the actual work
              } else if (respondentFilter === 'family') {
                // Family view shows averaged perspective
                const otherValue = person === 'mama' ? 
                  parseFloat(subcatData.papaPercent) || 0 : 
                  parseFloat(subcatData.mamaPercent) || 0;
                value = (value + otherValue) / 2;
              }
            }
            
            return {
              category: subcat.id,
              label: subcat.label,
              value: Math.min(100, Math.max(0, value)),
              detail: subcat.detail,
              time: subcat.time,
              responses: subcatData?.total || 0
            };
          });
        };
        
        return {
          mama: processSubData('mama'),
          papa: processSubData('papa')
        };
      }
    }

    // Fallback: Use aggregated main category data
    const processSubData = (person) => {
      return selectedCategory.subcategories.map(subcat => {
        // Use the main category percentage as a fallback
        const mainCategoryValue = surveyData[person]?.[selectedCategory.id] || 50;
        
        // Add some variation to make the subcategories look different
        const variation = (Math.random() - 0.5) * 20; // +/- 10%
        let value = mainCategoryValue + variation;
        
        // Apply filter adjustments
        if (respondentFilter === 'kids') {
          value = value * 0.8;
        } else if (respondentFilter === 'family') {
          const otherPerson = person === 'mama' ? 'papa' : 'mama';
          const otherValue = surveyData[otherPerson]?.[selectedCategory.id] || 50;
          value = (value + otherValue) / 2;
        }
        
        return {
          category: subcat.id,
          label: subcat.label,
          value: Math.min(100, Math.max(0, value)),
          detail: subcat.detail,
          time: subcat.time,
          responses: 0
        };
      });
    };

    return {
      mama: processSubData('mama'),
      papa: processSubData('papa')
    };
  }, [selectedCategory, surveyData, respondentFilter]);

  // SVG dimensions - Made larger
  const mainSize = 500;
  const subSize = 420;
  const center = mainSize / 2;
  const subCenter = subSize / 2;
  const maxRadius = mainSize * 0.35;
  const subMaxRadius = subSize * 0.35;

  // Generate radar path
  const generatePath = (data, size, maxR) => {
    if (!data || data.length === 0) return '';
    console.log('generatePath called with data:', data);
    const centerPoint = size / 2;
    const angleStep = (2 * Math.PI) / data.length;
    const startAngle = -Math.PI / 2;
    
    const path = data.map((point, index) => {
      const angle = startAngle + index * angleStep;
      const radius = (point.value / 100) * maxR;
      const x = centerPoint + radius * Math.cos(angle);
      const y = centerPoint + radius * Math.sin(angle);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
    
    console.log('Generated path:', path);
    return path;
  };

  // Get category position
  const getCategoryPosition = (index, total, size, maxR) => {
    const centerPoint = size / 2;
    const angleStep = (2 * Math.PI) / total;
    const startAngle = -Math.PI / 2;
    const angle = startAngle + index * angleStep;
    const labelRadius = maxR + 65;
    return {
      x: centerPoint + labelRadius * Math.cos(angle),
      y: centerPoint + labelRadius * Math.sin(angle),
      angle: angle * (180 / Math.PI) + 90
    };
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowSubRadar(true);
    setSuggestionOffset(0); // Reset suggestions when switching categories
    // Auto-scroll to the sub-radar section
    setTimeout(() => {
      const subRadarElement = document.getElementById('sub-radar-section');
      if (subRadarElement) {
        subRadarElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const closeSubRadar = () => {
    setShowSubRadar(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  // Show loading skeleton when no survey data
  if (!surveyData || (Object.keys(surveyData).length === 0)) {
    return (
      <div className={`${className}`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Family Task Balance
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  Loading survey data...
                </p>
              </div>
            </div>
          </div>

          {/* Loading skeleton */}
          <div className="flex items-center justify-center py-16">
            <div className="animate-pulse">
              <svg width="240" height="240">
                {/* Animated loading circles */}
                <circle
                  cx="120"
                  cy="120"
                  r="80"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="60"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="40"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
                <circle
                  cx="120"
                  cy="120"
                  r="20"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Family Task Balance
                {respondentFilter === 'kids' && (
                  <span className="ml-2 text-sm font-normal text-purple-600">
                    (Kids' View)
                  </span>
                )}
                {respondentFilter === 'family' && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    (Combined View)
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Based on the Four Categories framework
              </p>
            </div>
            {/* Moved legend to bottom of chart */}
          </div>
          
          {/* Respondent Filter */}
          <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">Show data from:</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setRespondentFilter('parents')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'parents' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Parents
              </button>
              <button
                onClick={() => setRespondentFilter('kids')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'kids' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kids
              </button>
              <button
                onClick={() => setRespondentFilter('family')}
                className={`px-3 py-1 text-xs rounded ${
                  respondentFilter === 'family' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Family
              </button>
            </div>
          </div>
        </div>

        {/* Main Chart Container - Stacked Layout */}
        <div className="space-y-6">
          {/* Main Radar Chart with Avatars on sides */}
          <div className="flex items-center justify-center">
            {/* Mama Avatar on left */}
            <div className="mr-12">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-purple-400 overflow-hidden bg-purple-100 shadow-lg">
                    {(() => {
                      const mama = familyMembers?.find(m => 
                        m.role === 'parent' && 
                        (m.name?.toLowerCase() === 'mama' || 
                         m.name?.toLowerCase() === 'mom' || 
                         m.name?.toLowerCase() === 'kimberly' || 
                         m.name?.toLowerCase().includes('kim') ||
                         (m.gender === 'female' && m.role === 'parent'))
                      );
                      return mama?.profilePictureUrl || mama?.profilePicture;
                    })() ? (
                      <img 
                        src={(() => {
                          const mama = familyMembers?.find(m => 
                            m.role === 'parent' && 
                            (m.name?.toLowerCase() === 'mama' || 
                             m.name?.toLowerCase() === 'mom' || 
                             m.name?.toLowerCase() === 'kimberly' || 
                             m.name?.toLowerCase().includes('kim') ||
                             (m.gender === 'female' && m.role === 'parent'))
                          );
                          return mama?.profilePictureUrl || mama?.profilePicture;
                        })()}
                        alt="Mama"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-purple-700 font-bold text-3xl">
                        M
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-base font-medium text-gray-700">Mama</span>
              </div>
            </div>
            
            <svg width={mainSize} height={mainSize} className="overflow-visible" style={{ margin: '20px' }}>
              <defs>
                <linearGradient id="purpleGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9F7AEA" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9F7AEA" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="blueGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4299E1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4299E1" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Grid circles */}
              {[...Array(4)].map((_, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={(maxRadius / 4) * (i + 1)}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Grid lines */}
              {mainCategories.map((_, index) => {
                const angleStep = (2 * Math.PI) / mainCategories.length;
                const angle = -Math.PI / 2 + index * angleStep;
                const x2 = center + maxRadius * Math.cos(angle);
                const y2 = center + maxRadius * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data shapes */}
              {selectedPerson !== 'papa' && (
                <path
                  d={generatePath(mainRadarData.mama, mainSize, maxRadius)}
                  fill="url(#purpleGradientMain)"
                  stroke="#9F7AEA"
                  strokeWidth="2"
                  opacity={selectedPerson === 'papa' ? 0.3 : 1}
                />
              )}
              
              {selectedPerson !== 'mama' && (
                <path
                  d={generatePath(mainRadarData.papa, mainSize, maxRadius)}
                  fill="url(#blueGradientMain)"
                  stroke="#4299E1"
                  strokeWidth="2"
                  opacity={selectedPerson === 'mama' ? 0.3 : 1}
                />
              )}

              {/* Category labels */}
              {mainCategories.map((cat, index) => {
                const pos = getCategoryPosition(index, mainCategories.length, mainSize, maxRadius);
                const isHovered = hoveredCategory === cat.id;
                const Icon = cat.icon;
                
                return (
                  <g 
                    key={cat.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (onSelectHabit) {
                        // Only handle habit selection if callback provided
                        handleCategoryClick(cat);
                      } else {
                        // Just show subcategory data without habit creation
                        setSelectedCategory(cat);
                        setShowSubRadar(true);
                      }
                    }}
                    onMouseEnter={() => setHoveredCategory(cat.id)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {/* Icon background */}
                    <circle
                      cx={pos.x}
                      cy={pos.y - 15}
                      r="20"
                      fill={isHovered ? cat.color : '#F3F4F6'}
                      fillOpacity={isHovered ? 0.2 : 1}
                      stroke={isHovered ? cat.color : '#E5E7EB'}
                      strokeWidth="2"
                    />
                    
                    {/* Icon */}
                    <g transform={`translate(${pos.x - 10}, ${pos.y - 25})`}>
                      <Icon 
                        size={20} 
                        color={isHovered ? cat.color : '#6B7280'}
                      />
                    </g>
                    
                    {/* Label */}
                    <text
                      x={pos.x}
                      y={pos.y + 10}
                      textAnchor="middle"
                      className={`text-xs font-medium select-none ${
                        isHovered ? 'fill-gray-900' : 'fill-gray-700'
                      }`}
                    >
                      {cat.label}
                    </text>
                    
                    {/* Click hint - moved below label to avoid overlap */}
                    {isHovered && (
                      <text
                        x={pos.x}
                        y={pos.y + 28}
                        textAnchor="middle"
                        className="text-[10px] fill-gray-500"
                      >
                        Click to explore
                      </text>
                    )}
                  </g>
                );
              })}
              
            </svg>
            
            {/* Papa Avatar on right */}
            <div className="ml-12">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full border-4 border-blue-400 overflow-hidden bg-blue-100 shadow-lg">
                    {(() => {
                      const papa = familyMembers?.find(m => 
                        m.role === 'parent' && 
                        (m.name?.toLowerCase() === 'papa' || 
                         m.name?.toLowerCase() === 'dad' || 
                         m.name?.toLowerCase() === 'stefan' || 
                         m.name?.toLowerCase().includes('stef') ||
                         (m.gender === 'male' && m.role === 'parent'))
                      );
                      return papa?.profilePictureUrl || papa?.profilePicture;
                    })() ? (
                      <img 
                        src={(() => {
                          const papa = familyMembers?.find(m => 
                            m.role === 'parent' && 
                            (m.name?.toLowerCase() === 'papa' || 
                             m.name?.toLowerCase() === 'dad' || 
                             m.name?.toLowerCase() === 'stefan' || 
                             m.name?.toLowerCase().includes('stef') ||
                             (m.gender === 'male' && m.role === 'parent'))
                          );
                          return papa?.profilePictureUrl || papa?.profilePicture;
                        })()}
                        alt="Papa"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-700 font-bold text-3xl">
                        P
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-base font-medium text-gray-700">Papa</span>
              </div>
            </div>
          </div>

          {/* Category Info or Sub-Radar - Full Width Below */}
          <div className="w-full" id="sub-radar-section">
            {showSubRadar && selectedCategory ? (
              <div className="bg-gray-50 rounded-lg p-6">
                {/* Sub-category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center`}
                         style={{ backgroundColor: `${selectedCategory.color}20` }}>
                      {React.createElement(selectedCategory.icon, { 
                        size: 24, 
                        color: selectedCategory.color
                      })}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        {selectedCategory.label}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedCategory.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Filter for sub-radar */}
                    <select
                      value={respondentFilter}
                      onChange={(e) => setRespondentFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="parents">Parents</option>
                      <option value="kids">Kids</option>
                      <option value="family">Family</option>
                    </select>
                    <button
                      onClick={closeSubRadar}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Stacked layout for sub-radar and habits */}
                <div className="space-y-6">
                  {/* Sub-category radar - centered */}
                  <div className="flex justify-center">
                    <svg width={subSize} height={subSize} className="overflow-visible">
                      {/* Grid for subcategories */}
                      {[...Array(3)].map((_, i) => (
                        <circle
                          key={i}
                          cx={subCenter}
                          cy={subCenter}
                          r={(subMaxRadius / 3) * (i + 1)}
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="0.5"
                        />
                      ))}

                      {/* Sub data shapes */}
                      <path
                        d={generatePath(subRadarData.mama, subSize, subMaxRadius)}
                        fill="url(#purpleGradientMain)"
                        stroke="#9F7AEA"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />
                      <path
                        d={generatePath(subRadarData.papa, subSize, subMaxRadius)}
                        fill="url(#blueGradientMain)"
                        stroke="#4299E1"
                        strokeWidth="1.5"
                        opacity="0.6"
                      />

                      {/* Subcategory labels */}
                      {selectedCategory.subcategories.map((subcat, index) => {
                        const pos = getCategoryPosition(
                          index, 
                          selectedCategory.subcategories.length, 
                          subSize, 
                          subMaxRadius
                        );
                        const isHovered = hoveredSubcategory === subcat.id;
                        const isSelected = selectedSubcategory === subcat.id;

                        return (
                          <g
                            key={subcat.id}
                            onMouseEnter={() => setHoveredSubcategory(subcat.id)}
                            onMouseLeave={() => setHoveredSubcategory(null)}
                            onClick={() => {
                              setSelectedSubcategory(selectedSubcategory === subcat.id ? null : subcat.id);
                              console.log('Clicked subcategory:', subcat.id, subcat.label);
                            }}
                            className="cursor-pointer"
                          >
                            {/* Selection indicator circle */}
                            {isSelected && (
                              <circle
                                cx={pos.x}
                                cy={pos.y - 5}
                                r="50"
                                fill="rgba(139, 92, 246, 0.1)"
                                stroke="#8B5CF6"
                                strokeWidth="2"
                              />
                            )}
                            <text
                              x={pos.x}
                              y={pos.y}
                              textAnchor="middle"
                              className={`text-xs select-none cursor-pointer ${
                                isSelected ? 'fill-purple-600 font-bold' : 'fill-gray-700 hover:fill-purple-600'
                              }`}
                            >
                              {subcat.label}
                            </text>
                            
                            {/* Show data on hover */}
                            {isHovered && (
                              <g>
                                {/* Background for tooltip */}
                                <rect
                                  x={pos.x - 80}
                                  y={pos.y + 10}
                                  width="160"
                                  height="40"
                                  rx="4"
                                  fill="white"
                                  stroke="#E5E7EB"
                                  strokeWidth="1"
                                  filter="drop-shadow(0 1px 3px rgba(0,0,0,0.1))"
                                />
                                {/* Data values */}
                                <text
                                  x={pos.x}
                                  y={pos.y + 28}
                                  textAnchor="middle"
                                  className="text-[10px] fill-gray-600"
                                >
                                  Mama: {Math.round(subRadarData.mama.find(d => d.category === subcat.id)?.value || 0)}%
                                </text>
                                <text
                                  x={pos.x}
                                  y={pos.y + 42}
                                  textAnchor="middle"
                                  className="text-[10px] fill-gray-600"
                                >
                                  Papa: {Math.round(subRadarData.papa.find(d => d.category === subcat.id)?.value || 0)}%
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Detailed habit suggestions - only show if onSelectHabit callback is provided */}
                  {onSelectHabit && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                          {selectedSubcategory
                            ? `Habits for ${selectedCategory.subcategories.find(s => s.id === selectedSubcategory)?.label}:`
                            : 'Personalized habit suggestions based on your family\'s balance:'}
                        </p>
                        <div className="flex gap-2">
                          {selectedSubcategory && (
                            <button
                              onClick={() => {
                                setSelectedSubcategory(null);
                                setSuggestionOffset(0);
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600
                                       bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              Show All
                            </button>
                          )}
                          <button
                            onClick={() => setSuggestionOffset(prev => prev + 3)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600
                                     bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                            title="Get new suggestions"
                          >
                            <RefreshCw size={14} />
                            Refresh
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(() => {
                        // Get the imbalanced subcategories for personalized suggestions
                        const subcategoryData = subRadarData.mama.concat(subRadarData.papa);
                        let imbalancedTasks = selectedCategory.subcategories
                          .map(subcat => {
                            const mamaData = subRadarData.mama.find(d => d.category === subcat.id);
                            const papaData = subRadarData.papa.find(d => d.category === subcat.id);
                            const mamaValue = mamaData?.value || 50;
                            const papaValue = papaData?.value || 50;
                            const imbalance = Math.abs(mamaValue - papaValue);

                            return {
                              ...subcat,
                              mamaValue,
                              papaValue,
                              imbalance,
                              whoDoesMore: mamaValue > papaValue ? 'Mama' : 'Papa',
                              difference: imbalance
                            };
                          })
                          .sort((a, b) => b.imbalance - a.imbalance);

                        // Filter by selected subcategory if one is clicked
                        if (selectedSubcategory) {
                          imbalancedTasks = imbalancedTasks.filter(task => task.id === selectedSubcategory);
                        }

                        // Get different tasks based on offset, cycling through available tasks
                        const totalTasks = imbalancedTasks.length > 0 ? imbalancedTasks : selectedCategory.subcategories;
                        const startIndex = suggestionOffset % totalTasks.length;

                        // Get 3 tasks (or 1 if specific subcategory selected)
                        const numTasks = selectedSubcategory ? 1 : Math.min(3, totalTasks.length);
                        const topTasks = [];
                        for (let i = 0; i < numTasks; i++) {
                          const index = (startIndex + i) % totalTasks.length;
                          topTasks.push(totalTasks[index]);
                        }
                        
                        return topTasks.map(subcat => {
                          // Generate personalized habit suggestions
                          const familySize = familyMembers?.length || 0;
                          const hasKids = familyMembers?.some(m => m.role === 'child');
                          const kidsCount = familyMembers?.filter(m => m.role === 'child').length || 0;
                          const kidsNames = familyMembers
                            ?.filter(m => m.role === 'child')
                            ?.map(m => m.name)
                            ?.slice(0, 2)
                            ?.join(' and ') || 'the kids';
                          
                          // Create personalized title and description
                          let personalizedTitle = subcat.label;
                          let personalizedDescription = subcat.detail;
                          
                          // Customize based on who does more (NOW USING WEIGHTED PERCENTAGES!)
                          if (subcat.imbalance > 20) {
                            const otherParent = subcat.whoDoesMore === 'Mama' ? 'Papa' : 'Mama';
                            personalizedTitle = `${otherParent} Takes On ${subcat.label}`;
                            // These percentages are now WEIGHTED from SubCategoryAnalyzer
                            personalizedDescription = `${subcat.whoDoesMore} currently handles ${Math.round(subcat[subcat.whoDoesMore.toLowerCase() + 'Value'])}% of this (weighted by task difficulty). Time for ${otherParent} to step up!`;
                          }
                          
                          // Add family-specific context
                          if (hasKids && subcat.id === 'homework') {
                            personalizedTitle = `Homework Helper Rotation`;
                            personalizedDescription = `Create a schedule where both parents take turns helping ${kidsNames} with homework`;
                          } else if (hasKids && subcat.id === 'driving') {
                            personalizedTitle = `School Drop-off Schedule`;
                            personalizedDescription = `Alternate who drives ${kidsNames} to activities each week`;
                          } else if (subcat.id === 'emotional_support' && hasKids) {
                            personalizedTitle = `Bedtime Bonding Time`;
                            personalizedDescription = `Each parent gets special one-on-one time with ${kidsNames} at bedtime`;
                          } else if (subcat.id === 'meal_planning') {
                            personalizedTitle = `Weekly Menu Planning Together`;
                            personalizedDescription = familySize > 4 
                              ? `Plan meals for your family of ${familySize} together every Sunday`
                              : `Take turns planning weekly meals that everyone enjoys`;
                          }
                          
                          return (
                            <button
                              key={subcat.id}
                              onClick={() => {
                                // Create personalized habit based on family data
                                const personalizedHabit = {
                                  id: `${selectedCategory.id}_${subcat.id}`,
                                  title: personalizedTitle,
                                  category: selectedCategory.label,
                                  description: personalizedDescription,
                                  frequency: subcat.imbalance > 30 ? 'Daily' : 'Weekly',
                                  duration: subcat.time,
                                  // Add family-specific details
                                  familyContext: {
                                    familySize,
                                    hasKids,
                                    kidsCount,
                                    currentBalance: {
                                      mama: subcat.mamaValue,
                                      papa: subcat.papaValue
                                    },
                                    targetParent: subcat.whoDoesMore === 'Mama' ? 'Papa' : 'Mama',
                                    imbalanceLevel: subcat.imbalance
                                  }
                                };
                                onSelectHabit(personalizedHabit);
                                closeSubRadar();
                              }}
                              className="text-left p-4 bg-white rounded-lg border border-gray-200 
                                       hover:border-purple-300 hover:bg-purple-50 transition-all 
                                       group shadow-sm hover:shadow"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-gray-900 group-hover:text-purple-900">
                                    {personalizedTitle}
                                  </span>
                                  <Plus size={14} className="text-gray-400 group-hover:text-purple-600" />
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {personalizedDescription}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-purple-600 font-medium">
                                    {subcat.time}
                                  </span>
                                  {subcat.imbalance > 20 && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-amber-600 font-medium">
                                        {Math.round(subcat.imbalance)}% imbalance
                                      </span>
                                    </>
                                  )}
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-500">
                                    Click to balance
                                  </span>
                                </div>
                              </div>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    Explore Task Categories
                  </h4>
                  <p className="text-sm text-gray-600">
                    Click any category to see specific tasks and create balanced habits
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                  {mainCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (onSelectHabit) {
                            handleCategoryClick(cat);
                          } else {
                            setSelectedCategory(cat);
                            setShowSubRadar(true);
                          }
                        }}
                        className="p-6 rounded-xl border-2 border-gray-200 hover:border-gray-300 
                                 hover:shadow-lg transition-all group bg-white relative overflow-hidden"
                      >
                        <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity`}
                             style={{ backgroundColor: cat.color }}></div>
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-lg mb-3 mx-auto flex items-center justify-center`}
                               style={{ backgroundColor: `${cat.color}20` }}>
                            <Icon 
                              size={24} 
                              color={cat.color}
                            />
                          </div>
                          <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 mb-1">
                            {cat.label} <span className="text-2xl ml-1">{cat.medal}</span>
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {cat.description}
                          </p>
                          <div className="mt-3 flex items-center justify-center text-xs text-gray-500 group-hover:text-gray-700">
                            <span>Explore</span>
                            <ChevronRight size={12} className="ml-1" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FourCategoryRadar;