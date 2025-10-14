import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageSquare, Calendar, CheckCircle, Clock, 
  FileText, Image, AlertCircle, ChevronDown, ChevronRight,
  Search, Filter, Download, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { useFamily } from '../../contexts/FamilyContext';
import EmailConfigurationService from '../../services/EmailConfigurationService';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

const FamilyInbox = () => {
  const { familyId } = useFamily();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [familyEmail, setFamilyEmail] = useState('');

  // Format phone number for display
  const formatPhoneNumber = (phone) => {
    if (!phone) return 'Unknown';
    // Remove any non-digits
    const cleaned = phone.replace(/\D/g, '');
    // Format as (XXX) XXX-XXXX
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length > 10) {
      // International number
      return phone;
    }
    return phone;
  };

  useEffect(() => {
    loadFamilyEmail();
  }, [familyId]);

  const loadFamilyEmail = async () => {
    if (familyId) {
      const email = await EmailConfigurationService.getFamilyEmail(familyId);
      setFamilyEmail(email || '');
    }
  };

  // Set up real-time listener for messages
  useEffect(() => {
    if (!familyId) return;

    setLoading(true);

    // Query for family documents and emails
    const documentsQuery = query(
      collection(db, 'familyDocuments'),
      where('familyId', '==', familyId),
      orderBy('uploadedAt', 'desc'),
      limit(50)
    );

    const emailsQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );

    const smsQuery = query(
      collection(db, 'smsInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );

    // Set up real-time listeners
    const unsubscribeDocuments = onSnapshot(documentsQuery, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'document',
          from: 'Document Upload',
          subject: doc.data().title || doc.data().fileName,
          receivedAt: doc.data().uploadedAt,
          processedAt: doc.data().processedAt,
          status: doc.data().status || 'pending',
          content: {
            text: doc.data().summary || doc.data().description || 'Processing document...',
            attachments: [doc.data().fileName]
          },
          actions: doc.data().actions || [],
          aiAnalysis: doc.data().aiAnalysis,
          fileUrl: doc.data().fileUrl,
          ...doc.data()
        }));
        
        // Update messages with documents
        setMessages(prev => {
          const emailMessages = prev.filter(m => m.type !== 'document');
          return [...docs, ...emailMessages].sort((a, b) => {
            const dateA = a.receivedAt?.toDate?.() || new Date(a.receivedAt || 0);
            const dateB = b.receivedAt?.toDate?.() || new Date(b.receivedAt || 0);
            return dateB - dateA;
          });
        });
      },
      (error) => {
        console.error('Error fetching documents:', error);
      }
    );

    const unsubscribeEmails = onSnapshot(emailsQuery,
      (snapshot) => {
        const emails = snapshot.docs.map(doc => ({
          id: doc.id,
          type: 'email',
          ...doc.data()
        }));
        
        // Update messages with emails
        setMessages(prev => {
          const docMessages = prev.filter(m => m.type === 'document');
          const smsMessages = prev.filter(m => m.type === 'sms' || m.type === 'mms');
          return [...docMessages, ...emails, ...smsMessages].sort((a, b) => {
            const dateA = a.receivedAt?.toDate?.() || new Date(a.receivedAt || 0);
            const dateB = b.receivedAt?.toDate?.() || new Date(b.receivedAt || 0);
            return dateB - dateA;
          });
        });
        
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching emails:', error);
        setLoading(false);
      }
    );

    const unsubscribeSMS = onSnapshot(smsQuery,
      (snapshot) => {
        const smsMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Update messages with SMS
        setMessages(prev => {
          const docMessages = prev.filter(m => m.type === 'document');
          const emailMessages = prev.filter(m => m.type === 'email');
          return [...docMessages, ...emailMessages, ...smsMessages].sort((a, b) => {
            const dateA = a.receivedAt?.toDate?.() || new Date(a.receivedAt || 0);
            const dateB = b.receivedAt?.toDate?.() || new Date(b.receivedAt || 0);
            return dateB - dateA;
          });
        });
      },
      (error) => {
        console.error('Error fetching SMS messages:', error);
      }
    );

    // Listen for document processed events
    const handleDocumentProcessed = (event) => {
      console.log('Document processed event:', event.detail);
      // The real-time listener will automatically update the UI
    };

    window.addEventListener('document-processed', handleDocumentProcessed);

    // Cleanup
    return () => {
      unsubscribeDocuments();
      unsubscribeEmails();
      unsubscribeSMS();
      window.removeEventListener('document-processed', handleDocumentProcessed);
    };
  }, [familyId, filter]);

  // Helper function to safely format date
  const safeFormatDate = (date) => {
    if (!date) return new Date();
    
    try {
      // Handle Firestore Timestamp
      if (date && date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
      } else if (date && date.seconds) {
        return new Date(date.seconds * 1000);
      } else if (typeof date === 'string' || typeof date === 'number') {
        return new Date(date);
      } else if (date instanceof Date) {
        return date;
      }
      return new Date();
    } catch (error) {
      console.error('Date parsing error:', error);
      return new Date();
    }
  };

  // Mock data (kept for fallback, but won't be used with real-time data)
  const mockMessages = [
    {
      id: '1',
      type: 'email',
      from: 'mom@gmail.com',
      to: familyEmail || 'family@allie.family',
      subject: 'Fwd: Soccer Schedule Spring 2025',
      receivedAt: new Date('2025-01-15T10:30:00'),
      processedAt: new Date('2025-01-15T10:30:45'),
      status: 'processed',
      content: {
        text: 'Here\'s the soccer schedule for this season...',
        attachments: ['Spring_Soccer_Schedule.pdf']
      },
      actions: [
        {
          type: 'calendar',
          status: 'completed',
          description: 'Added 12 soccer practices to calendar',
          details: [
            'Every Tuesday & Thursday 4:00 PM - 5:30 PM',
            'Starting January 20, 2025',
            'Location: City Park Field 3'
          ]
        },
        {
          type: 'calendar',
          status: 'completed',
          description: 'Added 8 soccer games to calendar',
          details: [
            'Saturdays at various times',
            'Home and away games',
            'First game: Jan 25 vs Eagles'
          ]
        },
        {
          type: 'contact',
          status: 'completed',
          description: 'Added Coach contact',
          details: ['Coach Smith: (555) 123-4567']
        }
      ]
    },
    {
      id: '2',
      type: 'sms',
      from: '+15551234567',
      to: 'Allie SMS',
      receivedAt: new Date('2025-01-14T15:45:00'),
      processedAt: new Date('2025-01-14T15:45:30'),
      status: 'processed',
      content: {
        text: 'Doctor appointment reminder',
        images: ['appointment_card.jpg']
      },
      actions: [
        {
          type: 'calendar',
          status: 'completed',
          description: 'Added doctor appointment',
          details: [
            'Dr. Johnson - Pediatrics',
            'January 28, 2025 at 2:30 PM',
            'Annual checkup for Emma'
          ]
        },
        {
          type: 'reminder',
          status: 'completed',
          description: 'Set reminder',
          details: ['Reminder set for 1 day before']
        }
      ]
    },
    {
      id: '3',
      type: 'email',
      from: 'school@elementary.edu',
      to: familyEmail || 'family@allie.family',
      subject: 'February Events Newsletter',
      receivedAt: new Date('2025-01-13T09:00:00'),
      processedAt: new Date('2025-01-13T09:02:00'),
      status: 'partial',
      content: {
        text: 'February events at Lincoln Elementary...',
        attachments: ['February_Newsletter.pdf']
      },
      actions: [
        {
          type: 'calendar',
          status: 'completed',
          description: 'Added 3 school events',
          details: [
            'Feb 14: Valentine\'s Day Party',
            'Feb 20: Parent-Teacher Conferences',
            'Feb 28: Science Fair'
          ]
        },
        {
          type: 'question',
          status: 'pending',
          description: 'Needs clarification',
          details: ['Multiple time slots for conferences - which do you prefer?']
        }
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'contact':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'question':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const filteredMessages = messages.filter(msg => {
    // Apply type filter
    if (filter === 'email' && msg.type !== 'email') return false;
    if (filter === 'sms' && msg.type !== 'sms' && msg.type !== 'mms') return false;
    if (filter === 'document' && msg.type !== 'document') return false;
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (msg.from || '').toLowerCase().includes(search) ||
        (msg.subject || '').toLowerCase().includes(search) ||
        (msg.content?.text || '').toLowerCase().includes(search) ||
        (msg.fileName || '').toLowerCase().includes(search) ||
        (msg.title || '').toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="h-full flex">
      {/* Message List */}
      <div className="w-1/3 border-r bg-white">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold mb-4">Family Inbox</h2>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('document')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                filter === 'document' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <FileText className="w-3 h-3" />
              Docs
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                filter === 'email' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Mail className="w-3 h-3" />
              Email
            </button>
            <button
              onClick={() => setFilter('sms')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                filter === 'sms' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              SMS
            </button>
          </div>
        </div>

        {/* Message List */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredMessages.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No messages found</div>
          ) : (
            filteredMessages.map(message => (
              <div
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {message.type === 'email' ? (
                      <Mail className="w-4 h-4 text-gray-400" />
                    ) : message.type === 'document' ? (
                      <FileText className="w-4 h-4 text-gray-400" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">
                      {message.type === 'sms' || message.type === 'mms' 
                        ? formatPhoneNumber(message.from) 
                        : message.from}
                    </span>
                  </div>
                  {getStatusIcon(message.status)}
                </div>
                
                {message.subject && (
                  <div className="text-sm font-medium text-gray-900 mb-1">
                    {message.subject}
                  </div>
                )}
                
                <div className="text-xs text-gray-500 line-clamp-2">
                  {message.content.text}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {format(safeFormatDate(message.receivedAt), 'MMM d, h:mm a')}
                  </span>
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex gap-1">
                      {message.actions.map((action, idx) => (
                        <div key={idx}>{getActionIcon(action.type)}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className="flex-1 bg-gray-50">
        {selectedMessage ? (
          <MessageDetail message={selectedMessage} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select a message to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Message Detail Component
const MessageDetail = ({ message }) => {
  const [showOriginal, setShowOriginal] = useState(false);

  // Helper function to safely format date
  const safeFormatDate = (date) => {
    if (!date) return new Date();
    
    try {
      // Handle Firestore Timestamp
      if (date && date.toDate && typeof date.toDate === 'function') {
        return date.toDate();
      } else if (date && date.seconds) {
        return new Date(date.seconds * 1000);
      } else if (typeof date === 'string' || typeof date === 'number') {
        return new Date(date);
      } else if (date instanceof Date) {
        return date;
      }
      return new Date();
    } catch (error) {
      console.error('Date parsing error:', error);
      return new Date();
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'calendar':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-purple-500" />;
      case 'contact':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'question':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              {message.type === 'email' ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Email from {message.from}</span>
                </>
              ) : message.type === 'document' ? (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Document: {message.fileName || 'Uploaded File'}</span>
                </>
              ) : (
                <>
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS from {message.from}</span>
                </>
              )}
            </div>
            {message.subject && (
              <h3 className="text-xl font-semibold">{message.subject}</h3>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Received: {format(safeFormatDate(message.receivedAt), 'MMM d, yyyy h:mm a')}
            </div>
            {message.processedAt && (
              <div className="text-sm text-gray-500">
                Processed: {format(safeFormatDate(message.processedAt), 'h:mm:ss a')}
              </div>
            )}
          </div>
        </div>

        {/* Attachments */}
        {message.content.attachments && message.content.attachments.length > 0 && (
          <div className="flex gap-2">
            {message.content.attachments.map((attachment, idx) => (
              <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                <FileText className="w-3 h-3" />
                <span>{attachment}</span>
              </div>
            ))}
          </div>
        )}

        {/* Images */}
        {message.content.images && message.content.images.length > 0 && (
          <div className="flex gap-2 mt-2">
            {message.content.images.map((image, idx) => (
              <div key={idx} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                <Image className="w-3 h-3" />
                <span>{image}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Allie's Actions */}
        {message.actions && message.actions.length > 0 ? (
          <div className="bg-white rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-lg mb-4">What Allie Did</h4>
            <div className="space-y-4">
              {message.actions.map((action, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  {getActionIcon(action.type)}
                  <span className="font-medium">{action.description}</span>
                  {action.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500 ml-auto" />
                  )}
                </div>
                {action.details && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {action.details.map((detail, detailIdx) => (
                      <li key={detailIdx}>• {detail}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            </div>
          </div>
        ) : message.type === 'document' && message.status === 'pending' ? (
          <div className="bg-yellow-50 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-lg mb-2 text-yellow-800">Queued for Processing</h4>
            <p className="text-yellow-700">Allie is analyzing this document...</p>
          </div>
        ) : null}

        {/* Original Content */}
        <div className="bg-white rounded-lg p-6">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="flex items-center gap-2 font-semibold text-lg mb-4 hover:text-blue-600"
          >
            {showOriginal ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {message.type === 'document' ? 'Document Details' : 'Original Message'}
          </button>
          
          {showOriginal && (
            <>
              {message.type === 'document' && message.fileUrl && (
                <div className="mb-4">
                  <a
                    href={message.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                    View Document
                  </a>
                </div>
              )}
              <div className="bg-gray-50 rounded p-4 font-mono text-sm whitespace-pre-wrap">
                {message.type === 'document' && message.aiAnalysis ? (
                  <div>
                    {message.aiAnalysis.summary || message.content.text}
                    {message.extractedText && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="font-semibold mb-2">Extracted Text:</div>
                        {message.extractedText}
                      </div>
                    )}
                  </div>
                ) : (
                  message.content.text
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FamilyInbox;