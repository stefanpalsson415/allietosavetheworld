import React, { useState, useEffect } from 'react';
import { 
  Mail, Phone, Copy, Check, Edit2, Save, X, 
  MessageSquare, AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import EmailConfigurationService from '../../services/EmailConfigurationService';

const FamilyCommunicationSettings = () => {
  const { currentFamily, familyId } = useFamily();
  const [copied, setCopied] = useState({ email: false, phone: false });
  const [editing, setEditing] = useState(false);
  const [settings, setSettings] = useState({
    familyEmail: '',
    phoneNumber: '',
    phoneVerified: false,
    emailForwarding: true,
    smsEnabled: true,
    notifications: {
      emailProcessed: true,
      smsProcessed: true,
      weeklyDigest: true
    }
  });
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Load settings from family data
    const loadSettings = async () => {
      if (currentFamily && familyId) {
        const familyEmail = await EmailConfigurationService.getFamilyEmail(familyId);
        
        setSettings({
          familyEmail: familyEmail || 'family@allie.family',
          phoneNumber: currentFamily.phoneNumber || '+1 (555) 123-4567',
          phoneVerified: currentFamily.phoneVerified || true,
          emailForwarding: currentFamily.emailForwarding ?? true,
          smsEnabled: currentFamily.smsEnabled ?? true,
          notifications: currentFamily.notifications || {
            emailProcessed: true,
            smsProcessed: true,
            weeklyDigest: true
          }
        });
      }
    };
    
    loadSettings();
  }, [currentFamily, familyId]);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => {
      setCopied({ ...copied, [type]: false });
    }, 2000);
  };

  const handleEdit = () => {
    setEditForm(settings);
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      // Save to backend
      const response = await fetch('/api/family/communication-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: currentFamily.id,
          ...editForm
        })
      });
      
      if (response.ok) {
        setSettings(editForm);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setEditForm({});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Family Email Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Family Email Address
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Forward schedules, documents, and important emails here
            </p>
          </div>
          {!editing && (
            <button
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-mono text-lg">{settings.familyEmail}</div>
            <button
              onClick={() => copyToClipboard(settings.familyEmail, 'email')}
              className="flex items-center gap-2 px-3 py-1 bg-white border rounded-md hover:bg-gray-50"
            >
              {copied.email ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Allie automatically processes all forwarded emails</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Events and tasks are added to your family calendar</span>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5" />
              <span>View all processed emails in your Family Inbox</span>
            </div>
          </div>
        </div>

        {/* How to use */}
        <details className="group">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <Info className="w-4 h-4" />
            How to forward emails
          </summary>
          <div className="mt-3 pl-5 space-y-2 text-sm text-gray-600">
            <p><strong>Gmail:</strong> Click Forward → Enter {settings.familyEmail}</p>
            <p><strong>Outlook:</strong> Right-click → Forward → Add family email</p>
            <p><strong>Apple Mail:</strong> Click arrow → Forward → Type family email</p>
            <p className="text-xs text-gray-500 mt-2">
              Tip: Add this email to your contacts as "Allie Family" for quick access
            </p>
          </div>
        </details>
      </div>

      {/* SMS Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              SMS Number
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Text photos of flyers, notes, or quick reminders
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="font-mono text-lg">{settings.phoneNumber}</div>
              {settings.phoneVerified && (
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Verified
                </span>
              )}
            </div>
            <button
              onClick={() => copyToClipboard(settings.phoneNumber, 'phone')}
              className="flex items-center gap-2 px-3 py-1 bg-white border rounded-md hover:bg-gray-50"
            >
              {copied.phone ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Text photos of schedules, flyers, or handwritten notes</span>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Send quick reminders like "Soccer practice at 4pm"</span>
            </div>
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-green-500 mt-0.5" />
              <span>Allie responds with confirmation of what was added</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Save this number in your contacts</p>
              <p className="text-yellow-700">Name it "Allie SMS" for easy access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Processing Notifications</div>
              <div className="text-sm text-gray-600">Get notified when Allie processes your emails</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.emailProcessed}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
                  emailProcessed: e.target.checked
                }
              })}
              className="w-5 h-5 text-blue-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">SMS Processing Notifications</div>
              <div className="text-sm text-gray-600">Get notified when Allie processes your texts</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.smsProcessed}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
                  smsProcessed: e.target.checked
                }
              })}
              className="w-5 h-5 text-blue-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Digest</div>
              <div className="text-sm text-gray-600">Summary of all processed items each week</div>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.weeklyDigest}
              onChange={(e) => setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
                  weeklyDigest: e.target.checked
                }
              })}
              className="w-5 h-5 text-blue-600"
            />
          </label>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Need Help?</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <a href="#" className="flex items-center gap-2 hover:underline">
            <ExternalLink className="w-4 h-4" />
            View Family Inbox to see all processed messages
          </a>
          <a href="#" className="flex items-center gap-2 hover:underline">
            <ExternalLink className="w-4 h-4" />
            Learn more about email forwarding
          </a>
          <a href="#" className="flex items-center gap-2 hover:underline">
            <ExternalLink className="w-4 h-4" />
            Troubleshooting guide
          </a>
        </div>
      </div>
    </div>
  );
};

export default FamilyCommunicationSettings;