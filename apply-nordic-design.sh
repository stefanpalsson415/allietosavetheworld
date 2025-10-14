#!/bin/bash

# Apply Nordic Design Updates to TasksTab

echo "Applying Nordic Design updates..."

# 1. Ensure all files have been created
echo "1. Checking for required files..."

# Check RevisedCycleJourney.jsx
if [ ! -f "src/components/dashboard/RevisedCycleJourney.jsx" ]; then
  echo "ERROR: src/components/dashboard/RevisedCycleJourney.jsx is missing!"
  exit 1
fi

# Check NordicRadarChart.jsx
if [ ! -f "src/components/dashboard/NordicRadarChart.jsx" ]; then
  echo "ERROR: src/components/dashboard/NordicRadarChart.jsx is missing!"
  exit 1
fi

# Check nordic-styles.css
if [ ! -f "src/components/dashboard/nordic-styles.css" ]; then
  echo "ERROR: src/components/dashboard/nordic-styles.css is missing!"
  exit 1
fi

echo "All required files found."

# 2. Add imports to index.js
echo "2. Adding style import to index.js..."
if grep -q "nordic-styles.css" src/index.js; then
  echo "Nordic styles already imported in index.js"
else
  # Add import to index.js after the last import statement
  sed -i '' '/import/a\
import "./components/dashboard/nordic-styles.css";
' src/index.js
fi

# 3. Fix file paths
echo "3. Ensuring correct paths in import statements..."

# Check for relative path in TasksTab.jsx
if grep -q "import '../nordic-styles.css'" src/components/dashboard/tabs/TasksTab.jsx; then
  echo "Fixing path in TasksTab.jsx"
  sed -i '' 's|import '"'"'../nordic-styles.css'"'"';|import '"'"'../../../components/dashboard/nordic-styles.css'"'"';|' src/components/dashboard/tabs/TasksTab.jsx
fi

# 4. Add the RADAR_CHART_ENHANCEMENTS.md to git
echo "4. Adding documentation to git..."
git add RADAR_CHART_ENHANCEMENTS.md

echo "Nordic Design updates applied successfully!"
echo "Please run 'npm start' to see the changes in action."