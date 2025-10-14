// src/components/chat/ChatErrorFallback.jsx
import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Code, ExternalLink } from 'lucide-react';
import ClaudeApiTester from '../../utils/ClaudeApiTester';

/**
 * A component that displays when chat encounters an error
 * Provides debugging options and self-test capabilities
 */
const ChatErrorFallback = ({ error, onRetry }) => {
  const [testInProgress, setTestInProgress] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [expanded, setExpanded] = useState(false);
  
  // Get proxy URL based on environment
  const getProxyUrl = () => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname.includes('127.0.0.1');
    
    if (isLocalhost) {
      return 'http://localhost:3001/api/claude';
    } else {
      return 'https://europe-west1-parentload-ba995.cloudfunctions.net/claude';
    }
  };
  
  const runApiTest = async () => {
    setTestInProgress(true);
    setTestResults(null);
    
    try {
      const proxyUrl = getProxyUrl();
      const results = await ClaudeApiTester.testConnection(proxyUrl);
      setTestResults(results);
    } catch (err) {
      setTestResults({
        success: false,
        message: `Test error: ${err.message}`
      });
    } finally {
      setTestInProgress(false);
    }
  };
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start">
        <AlertTriangle className="text-red-500 mr-3 mt-0.5 flex-shrink-0" size={20} />
        <div className="flex-grow">
          <h3 className="text-red-700 font-medium text-sm mb-1">
            Chat service encountered an error
          </h3>
          <p className="text-red-600 text-xs mb-3">
            {error?.message || "I'm sorry, I encountered an error processing your request."}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <button
              onClick={onRetry}
              className="flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium transition-colors"
            >
              <RefreshCw size={14} className="mr-1" />
              Try Again
            </button>
            
            <button
              onClick={runApiTest}
              disabled={testInProgress}
              className={`flex items-center px-3 py-1 ${
                testInProgress 
                  ? "bg-gray-100 text-gray-500" 
                  : "bg-blue-100 hover:bg-blue-200 text-blue-700"
              } rounded text-xs font-medium transition-colors`}
            >
              {testInProgress ? (
                <>
                  <RefreshCw size={14} className="mr-1 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Code size={14} className="mr-1" />
                  Run API Test
                </>
              )}
            </button>
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
            >
              {expanded ? "Hide Details" : "Show Details"}
            </button>
          </div>
          
          {expanded && (
            <div className="mt-3 border-t border-red-200 pt-3">
              <h4 className="text-xs font-medium text-red-700 mb-1">Error Details</h4>
              <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-auto max-h-32 whitespace-pre-wrap">
                {JSON.stringify(error, null, 2) || "No detailed error information available"}
              </pre>
              
              {error?.stack && (
                <>
                  <h4 className="text-xs font-medium text-red-700 mt-2 mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-white p-2 rounded border border-red-200 overflow-auto max-h-32 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </>
              )}
            </div>
          )}
          
          {testResults && (
            <div className={`mt-3 border-t pt-3 ${
              testResults.success ? "border-green-200" : "border-red-200"
            }`}>
              <h4 className={`text-xs font-medium mb-1 ${
                testResults.success ? "text-green-700" : "text-red-700"
              }`}>
                API Test Results: {testResults.success ? "Success" : "Failed"}
              </h4>
              
              <div className={`text-xs p-2 rounded border ${
                testResults.success 
                  ? "bg-green-50 border-green-200 text-green-800" 
                  : "bg-red-50 border-red-200 text-red-800"
              }`}>
                <p className="mb-1"><strong>Status:</strong> {testResults.success ? "Connected" : "Connection Failed"}</p>
                <p className="mb-1"><strong>Message:</strong> {testResults.message}</p>
                
                {testResults.success && (
                  <>
                    <p className="mb-1"><strong>Model:</strong> {testResults.model}</p>
                    <p className="mb-1"><strong>Response:</strong> {testResults.content}</p>
                    <p><strong>Latency:</strong> {testResults.latency?.total}ms</p>
                  </>
                )}
                
                {!testResults.success && testResults.stage && (
                  <p className="mb-1"><strong>Failed Stage:</strong> {testResults.stage}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500 border-t border-gray-200 pt-2">
            <p>
              If the issue persists, try refreshing the page or checking your connection.
              <a 
                href="https://forms.gle/5QKmqD3Rh1NWqZ6j7" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-1 text-blue-600 hover:underline inline-flex items-center"
              >
                Report an issue <ExternalLink size={10} className="ml-1" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatErrorFallback;