import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Server, AlertCircle } from 'lucide-react';
import config from '../../config';

const ServerStatus = () => {
  const [servers, setServers] = useState({
    frontend: { status: 'online', port: 3000 },
    proxy: { status: 'checking', port: 3001 },
    backend: { status: 'checking', port: 3002 },
    tunnel: { status: 'checking', url: 'https://tunnel.checkallie.com' }
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  
  useEffect(() => {
    const checkServers = async () => {
      // Check Claude proxy
      try {
        const proxyResponse = await fetch(`${config.backend.url.replace(':3002', ':3001')}/health`, { 
          method: 'GET',
          mode: 'cors'
        });
        if (proxyResponse.ok || proxyResponse.status === 404) {
          // If we get any response (even 404), the server is running
          setServers(prev => ({ 
            ...prev, 
            proxy: { ...prev.proxy, status: 'online' }
          }));
        } else {
          setServers(prev => ({ 
            ...prev, 
            proxy: { ...prev.proxy, status: 'offline' }
          }));
        }
      } catch (error) {
        // Network error - server is truly offline
        setServers(prev => ({ 
          ...prev, 
          proxy: { ...prev.proxy, status: 'offline' }
        }));
      }
      
      // Check backend
      try {
        const backendResponse = await fetch(`${config.backend.url}/api/test`);
        const data = await backendResponse.json();
        setServers(prev => ({ 
          ...prev, 
          backend: { ...prev.backend, status: data.success ? 'online' : 'offline' }
        }));
      } catch (error) {
        setServers(prev => ({ 
          ...prev, 
          backend: { ...prev.backend, status: 'offline' }
        }));
      }
      
      // Check tunnel
      try {
        const tunnelResponse = await fetch('https://tunnel.checkallie.com/api/test', {
          method: 'GET',
          mode: 'cors'
        });
        if (tunnelResponse.ok || tunnelResponse.status === 404) {
          setServers(prev => ({ 
            ...prev, 
            tunnel: { ...prev.tunnel, status: 'online' }
          }));
        } else {
          setServers(prev => ({ 
            ...prev, 
            tunnel: { ...prev.tunnel, status: 'offline' }
          }));
        }
      } catch (error) {
        setServers(prev => ({ 
          ...prev, 
          tunnel: { ...prev.tunnel, status: 'offline' }
        }));
      }
    };
    
    // Check immediately (only in development mode)
    if (process.env.NODE_ENV === 'development') {
      checkServers();
      
      // Then check every 2 minutes (less frequent to reduce noise)
      const interval = setInterval(checkServers, 120000);
      
      return () => clearInterval(interval);
    }
    
    // If not in development, just return a no-op cleanup function
    return () => {};
  }, []);
  
  // Don't show server status in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const allOnline = Object.values(servers).every(s => s.status === 'online');
  const someOffline = Object.values(servers).some(s => s.status === 'offline');
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`p-3 rounded-full shadow-lg transition-all ${
          allOnline ? 'bg-green-500 hover:bg-green-600' : 
          someOffline ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 
          'bg-yellow-500 hover:bg-yellow-600'
        } text-white`}
        title="Server Status"
      >
        {allOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 w-80 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Server className="w-5 h-5" />
            Server Status
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Frontend (React)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">:3000</span>
                <div className={`w-3 h-3 rounded-full ${
                  servers.frontend.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Claude Proxy</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">:3001</span>
                <div className={`w-3 h-3 rounded-full ${
                  servers.proxy.status === 'online' ? 'bg-green-500' : 
                  servers.proxy.status === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Backend API</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">:3002</span>
                <div className={`w-3 h-3 rounded-full ${
                  servers.backend.status === 'online' ? 'bg-green-500' : 
                  servers.backend.status === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm font-medium">Email Webhook</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 text-right">tunnel.checkallie.com</span>
                <div className={`w-3 h-3 rounded-full ${
                  servers.tunnel.status === 'online' ? 'bg-green-500' : 
                  servers.tunnel.status === 'offline' ? 'bg-red-500' : 'bg-gray-300'
                }`} />
              </div>
            </div>
          </div>
          
          {someOffline && (
            <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Some servers are offline</div>
                  <div className="text-xs mt-1">Run the terminal commands to start them</div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            Status updates every 2 minutes
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerStatus;