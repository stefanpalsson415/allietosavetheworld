import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import habitDiagnostics from '../../utils/HabitDiagnostics';
import { 
  AlertTriangle, 
  CheckCircle, 
  Database, 
  FileText, 
  RefreshCw, 
  Search, 
  X, 
  Download, 
  Wrench
} from 'lucide-react';

/**
 * A debug panel that shows diagnostic information about habits
 * and allows running tests to verify the habit flow.
 */
const HabitDiagnosticPanel = ({ onClose }) => {
  const { familyId } = useFamily();
  const [diagnosticReport, setDiagnosticReport] = useState(null);
  const [habitId, setHabitId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  const [repairPlan, setRepairPlan] = useState(null);
  const [logEntries, setLogEntries] = useState([]);

  useEffect(() => {
    // Load initial diagnostics
    updateStatus();
    
    // Set up interval to update logs
    const logInterval = setInterval(() => {
      const report = habitDiagnostics.getReport();
      setLogEntries(report.logs);
    }, 1000);
    
    return () => {
      clearInterval(logInterval);
    };
  }, []);

  const updateStatus = async () => {
    setIsLoading(true);
    
    try {
      if (!familyId) {
        throw new Error("Family ID is required");
      }
      
      const diagnosisResult = await habitDiagnostics.diagnoseAllHabits(familyId);
      setDiagnosticReport(diagnosisResult);
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const runHabitDiagnostic = async () => {
    if (!habitId) {
      alert("Please enter a habit ID to diagnose");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await habitDiagnostics.diagnoseHabitPersistence(familyId, habitId);
      
      // Show result
      console.log("Habit diagnostic result:", result);
      
      // Update full report to include the new diagnosis
      if (diagnosticReport) {
        const updatedReport = {
          ...diagnosticReport,
          details: [
            ...diagnosticReport.details.filter(d => d.habitId !== habitId),
            result
          ]
        };
        setDiagnosticReport(updatedReport);
      }
      
      // Switch to status tab to show result
      setActiveTab('status');
    } catch (error) {
      console.error("Error running habit diagnostic:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRepairPlan = async () => {
    setIsLoading(true);
    
    try {
      const plan = await habitDiagnostics.createHabitRepairPlan(familyId);
      setRepairPlan(plan);
      
      // Switch to repair tab
      setActiveTab('repair');
    } catch (error) {
      console.error("Error generating repair plan:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Execute a repair for a specific habit
  const executeRepair = async (habitId) => {
    if (!habitId || !familyId) {
      console.error("Missing habitId or familyId for repair");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Indicate repair is in progress
      const loadingMessage = `Repairing habit ${habitId}...`;
      habitDiagnostics.log(loadingMessage);
      
      // Run the repair
      const result = await habitDiagnostics.repairHabit(familyId, habitId);
      
      // Show result as log
      if (result.success) {
        habitDiagnostics.log(`✅ Repair successful for habit ${habitId}`, result);
      } else {
        habitDiagnostics.error(`❌ Repair failed for habit ${habitId}`, result);
      }
      
      // Update the repair plan to reflect the changes
      await generateRepairPlan();
      
      // Switch to logs tab to show the repair steps
      setActiveTab('logs');
    } catch (error) {
      console.error("Error executing repair:", error);
      habitDiagnostics.error(`Error executing repair for ${habitId}`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Execute all repairs in the repair plan
  const executeAllRepairs = async () => {
    if (!repairPlan || !repairPlan.actions || repairPlan.actions.length === 0) {
      habitDiagnostics.warn("No repairs to execute");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Indicate batch repair is starting
      habitDiagnostics.log(`Starting batch repair for ${repairPlan.actions.length} habits...`);
      
      // Run the batch repair
      const result = await habitDiagnostics.executeBatchRepair(familyId);
      
      // Show result as log
      if (result.success) {
        habitDiagnostics.log(`✅ Batch repair completed successfully`, {
          habitsRepaired: result.habitsRepaired,
          total: result.totalHabits
        });
      } else {
        habitDiagnostics.error(`❌ Batch repair had errors`, {
          successful: result.repairsSucceeded,
          attempted: result.repairsAttempted
        });
      }
      
      // Update the repair plan to reflect the changes
      await generateRepairPlan();
      
      // Switch to logs tab to show the repair steps
      setActiveTab('logs');
    } catch (error) {
      console.error("Error executing batch repair:", error);
      habitDiagnostics.error("Error executing batch repair", error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadDiagnostics = () => {
    try {
      const report = habitDiagnostics.getReport();
      
      // Combine with habit diagnostics
      const fullReport = {
        timestamp: new Date().toISOString(),
        logs: report.logs,
        lastError: report.lastError,
        habitDiagnostics: diagnosticReport
      };
      
      // Create blob and download
      const blob = new Blob([JSON.stringify(fullReport, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-diagnostics-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading diagnostics:", error);
    }
  };

  const clearLogs = () => {
    habitDiagnostics.clearLogs();
    setLogEntries([]);
  };

  const renderStatus = () => {
    if (!diagnosticReport) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-500">No diagnostic data available</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={updateStatus}
          >
            Run Diagnostics
          </button>
        </div>
      );
    }
    
    const { summary, details, error } = diagnosticReport;
    
    if (error) {
      return (
        <div className="p-4">
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error running diagnostics</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={updateStatus}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="mb-6 border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium">Summary</h3>
            <button 
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
              onClick={updateStatus}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Total Habits</div>
                <div className="text-2xl font-semibold">{summary.totalHabits}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Persisting Habits</div>
                <div className="text-2xl font-semibold text-green-600">{summary.persistingHabits}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Inconsistent Habits</div>
                <div className="text-2xl font-semibold text-orange-500">{summary.inconsistentHabits}</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-sm text-gray-500">Errors</div>
                <div className="text-2xl font-semibold text-red-500">{summary.errorHabits}</div>
              </div>
            </div>
            
            {summary.inconsistentHabits > 0 && (
              <button 
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 w-full"
                onClick={generateRepairPlan}
              >
                <Wrench className="w-4 h-4 inline-block mr-1" />
                Generate Repair Plan
              </button>
            )}
          </div>
        </div>
        
        {details && details.length > 0 && (
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="bg-gray-100 px-4 py-3">
              <h3 className="font-medium">Habit Details</h3>
            </div>
            
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-4">
                {details.slice(0, 10).map((habit) => (
                  <div 
                    key={habit.habitId}
                    className={`p-3 rounded-md border ${
                      !habit.persists 
                        ? 'bg-red-50 border-red-200'
                        : !habit.isConsistent
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="font-mono text-sm">{habit.habitId}</div>
                      <div className="flex items-center">
                        {!habit.persists ? (
                          <span className="text-red-500 flex items-center text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Missing
                          </span>
                        ) : !habit.isConsistent ? (
                          <span className="text-yellow-500 flex items-center text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Inconsistent
                          </span>
                        ) : (
                          <span className="text-green-500 flex items-center text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            OK
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div className={`px-2 py-1 rounded ${
                        habit.locations.familiesCollection?.exists
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        Families: {habit.locations.familiesCollection?.exists ? 'Yes' : 'No'}
                      </div>
                      
                      <div className={`px-2 py-1 rounded ${
                        habit.locations.topLevelCollection?.exists
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        Top Level: {habit.locations.topLevelCollection?.exists ? 'Yes' : 'No'}
                      </div>
                      
                      <div className={`px-2 py-1 rounded ${
                        habit.instances.exists
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        Instances: {habit.instances.count}
                      </div>
                    </div>
                  </div>
                ))}
                
                {details.length > 10 && (
                  <div className="text-center text-sm text-gray-500">
                    + {details.length - 10} more habits
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHabitDiagnostic = () => {
    return (
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Habit ID
          </label>
          <div className="flex">
            <input
              type="text"
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              placeholder="Enter habit ID to diagnose"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 flex items-center"
              onClick={runHabitDiagnostic}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span className="ml-1">Diagnose</span>
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 border-t border-gray-200 pt-4 mt-4">
          <p>Enter a habit ID to run detailed diagnostics. This will check:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>If the habit exists in the families collection</li>
            <li>If the habit exists in the top-level collection</li>
            <li>If habit instances are properly recorded</li>
            <li>If streak data is consistent</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderRepair = () => {
    if (!repairPlan) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-500">No repair plan generated yet</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={generateRepairPlan}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </div>
            ) : (
              'Generate Repair Plan'
            )}
          </button>
        </div>
      );
    }
    
    if (repairPlan.error) {
      return (
        <div className="p-4">
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Error generating repair plan</p>
                <p className="text-sm">{repairPlan.error}</p>
              </div>
            </div>
          </div>
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={generateRepairPlan}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Try Again'}
          </button>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start">
            <Wrench className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-blue-500" />
            <div>
              <p className="font-semibold text-blue-700">Repair Plan Generated</p>
              <p className="text-sm text-blue-600">
                Found {repairPlan.totalHabits} habits, with {repairPlan.actionsNeeded} repair actions needed.
              </p>
            </div>
          </div>
        </div>
        
        {repairPlan.actions.length > 0 ? (
          <>
            <div className="mb-4 flex justify-end">
              <button 
                className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 flex items-center"
                onClick={executeAllRepairs}
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Repairing All...' : 'Execute All Repairs'}
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-3">
                <h3 className="font-medium">Repair Actions</h3>
              </div>
              
              <div className="p-4 max-h-64 overflow-y-auto">
                <div className="space-y-4">
                  {repairPlan.actions.map((action, idx) => (
                    <div 
                      key={`${action.habitId}-${idx}`}
                      className="p-3 rounded-md border border-gray-200"
                    >
                      <div className="font-medium text-sm">
                        {action.type === 'restore' ? 'Restore' : 'Repair'}: {action.habitId}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">{action.description}</div>
                      
                      <div className="space-y-2 mt-3">
                        {action.steps.map((step, stepIdx) => (
                          <div
                            key={`${action.habitId}-${idx}-${stepIdx}`}
                            className="flex items-center bg-gray-50 p-2 rounded text-xs"
                          >
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mr-2">
                              {stepIdx + 1}
                            </div>
                            <div>{step.description}</div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex justify-end">
                        <button 
                          className="px-3 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600 flex items-center"
                          onClick={() => executeRepair(action.habitId)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Wrench className="w-3 h-3 mr-1" />
                          )}
                          {isLoading ? 'Repairing...' : 'Execute Repair'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 border border-gray-200 rounded-md">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <p className="text-gray-700">No repair actions needed</p>
            <p className="text-sm text-gray-500">All habits appear to be in good condition.</p>
          </div>
        )}
      </div>
    );
  };

  const renderLogs = () => {
    return (
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <button
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
            onClick={clearLogs}
          >
            Clear Logs
          </button>
          
          <button
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
            onClick={downloadDiagnostics}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </button>
        </div>
        
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-100 px-4 py-2 text-sm font-medium">
            Diagnostic Logs ({logEntries.length})
          </div>
          
          <div className="p-0 max-h-96 overflow-y-auto bg-gray-900 text-white font-mono text-xs">
            {logEntries.length === 0 ? (
              <div className="p-4 text-gray-400 italic">No logs yet</div>
            ) : (
              <table className="min-w-full">
                <tbody>
                  {logEntries.map((entry, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-gray-800 ${
                        entry.type === 'error' 
                          ? 'bg-red-900 bg-opacity-30'
                          : entry.type === 'warn'
                            ? 'bg-yellow-900 bg-opacity-30'
                            : entry.message.includes('STEP:')
                              ? 'bg-blue-900 bg-opacity-20'
                              : ''
                      }`}
                    >
                      <td className="px-3 py-1 whitespace-nowrap text-gray-400 w-48">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-1">
                        <div className="flex items-start">
                          {entry.type === 'error' ? (
                            <AlertTriangle className="w-3 h-3 mr-1 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : entry.type === 'warn' ? (
                            <AlertTriangle className="w-3 h-3 mr-1 text-yellow-500 mt-0.5 flex-shrink-0" />
                          ) : entry.message.includes('STEP:') ? (
                            <ArrowRight className="w-3 h-3 mr-1 text-blue-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <FileText className="w-3 h-3 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <div>{entry.message}</div>
                            {entry.data && (
                              <pre className="mt-1 text-gray-400 overflow-x-auto text-[10px]">
                                {JSON.stringify(entry.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md border border-gray-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center bg-gray-50">
          <div className="flex items-center">
            <Database className="w-5 h-5 mr-2 text-blue-500" />
            <h2 className="font-medium text-lg">Habit Diagnostics</h2>
          </div>
          <button 
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="border-b border-gray-200 px-6 py-2 bg-gray-50">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'status'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('status')}
            >
              Status
            </button>
            
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'diagnose'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('diagnose')}
            >
              Diagnose Habit
            </button>
            
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'repair'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('repair')}
            >
              Repair
            </button>
            
            <button
              className={`px-4 py-2 text-sm ${
                activeTab === 'logs'
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'status' && renderStatus()}
          {activeTab === 'diagnose' && renderHabitDiagnostic()}
          {activeTab === 'repair' && renderRepair()}
          {activeTab === 'logs' && renderLogs()}
        </div>
        
        <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Family ID: {familyId || 'Unknown'}
          </div>
          
          <div className="flex space-x-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
              onClick={onClose}
            >
              Close
            </button>
            
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center"
              onClick={updateStatus}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Running...' : 'Run Diagnostics'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing component in the import, define a simple version here
const ArrowRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default HabitDiagnosticPanel;