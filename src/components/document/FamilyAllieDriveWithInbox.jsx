import React, { useState } from 'react';
import { 
  FileText, Mail, MessageSquare, Upload, Inbox as InboxIcon,
  Calendar, CheckCircle, Clock, Filter, Search, Grid, List,
  Settings, Download, Eye, Trash2
} from 'lucide-react';
import FamilyAllieDrive from './FamilyAllieDrive';
import UnifiedFamilyInbox from '../inbox/UnifiedFamilyInbox';
import FamilyCommunicationSettings from '../settings/FamilyCommunicationSettings';

const FamilyAllieDriveWithInbox = () => {
  const [activeView, setActiveView] = useState('documents');
  const [stats, setStats] = useState({
    documents: 42,
    emails: 15,
    sms: 8,
    processed: 23
  });

  const views = [
    { 
      id: 'documents', 
      label: 'Documents', 
      icon: FileText,
      count: stats.documents,
      description: 'Upload and manage family documents'
    },
    { 
      id: 'inbox', 
      label: 'Message Inbox', 
      icon: InboxIcon,
      count: stats.emails + stats.sms,
      description: 'Forwarded emails and text messages'
    },
    { 
      id: 'settings', 
      label: 'Email & SMS Setup', 
      icon: Settings,
      description: 'Manage your family communication channels'
    }
  ];

  return (
    <div className="min-h-full">
      {/* Navigation Tabs */}
      <div className="bg-white border-b mb-6 -mx-6 px-6">
        <nav className="flex space-x-8">
          {views.map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all flex items-center gap-2 ${
                activeView === view.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <view.icon className="w-5 h-5" />
              <span>{view.label}</span>
              {view.count !== undefined && (
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  activeView === view.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {view.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Quick Stats for Inbox */}
      {activeView === 'inbox' && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Messages</p>
                <p className="text-2xl font-bold">{stats.emails + stats.sms}</p>
              </div>
              <InboxIcon className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Processed</p>
                <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Calendar Events</p>
                <p className="text-2xl font-bold text-blue-600">18</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">3</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="bg-white rounded-lg">
        {activeView === 'documents' && (
          <FamilyAllieDrive />
        )}
        
        {activeView === 'inbox' && (
          <div style={{ height: 'calc(100vh - 400px)' }}>
            <UnifiedFamilyInbox />
          </div>
        )}
        
        {activeView === 'settings' && (
          <div className="p-6">
            <FamilyCommunicationSettings />
          </div>
        )}
      </div>

      {/* Help Section */}
      {activeView === 'inbox' && (
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            How Message Processing Works
          </h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-1">📧 Forward Emails</h4>
              <p className="text-gray-600">
                Send schedules and documents to your family email address. 
                Allie automatically extracts events and saves attachments.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">📱 Text Photos</h4>
              <p className="text-gray-600">
                Text photos of flyers or notes to your Allie SMS number. 
                They'll be processed and saved as documents.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-1">🤖 Allie Actions</h4>
              <p className="text-gray-600">
                See exactly what Allie did with each message - events added, 
                documents saved, and any questions that need your input.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyAllieDriveWithInbox;