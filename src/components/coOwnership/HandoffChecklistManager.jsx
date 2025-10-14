import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  User,
  Users,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Calendar,
  ChevronRight,
  Download,
  Upload,
  Star,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { format, formatDistanceToNow, addDays } from 'date-fns';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import RotationManagementService from '../../services/RotationManagementService';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';

/**
 * Handoff Checklist Manager
 * Manages smooth transitions between rotation periods
 */
const HandoffChecklistManager = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const [handoffs, setHandoffs] = useState([]);
  const [selectedHandoff, setSelectedHandoff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [customItem, setCustomItem] = useState('');
  const [filter, setFilter] = useState('active'); // active, completed, all

  useEffect(() => {
    if (familyId) {
      loadHandoffs();
    }
  }, [familyId, filter]);

  const loadHandoffs = () => {
    try {
      let q;
      if (filter === 'active') {
        q = query(
          collection(db, 'handoffs'),
          where('familyId', '==', familyId),
          where('status', 'in', ['scheduled', 'in-progress'])
        );
      } else if (filter === 'completed') {
        q = query(
          collection(db, 'handoffs'),
          where('familyId', '==', familyId),
          where('status', '==', 'completed')
        );
      } else {
        q = query(
          collection(db, 'handoffs'),
          where('familyId', '==', familyId)
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const handoffData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Determine if current user is involved
          const isInvolved = data.fromUserId === (currentUser.uid || currentUser.email) ||
                            data.toUserId === (currentUser.uid || currentUser.email);

          handoffData.push({
            id: doc.id,
            ...data,
            isInvolved,
            isFrom: data.fromUserId === (currentUser.uid || currentUser.email),
            isTo: data.toUserId === (currentUser.uid || currentUser.email)
          });
        });

        // Sort by deadline
        handoffData.sort((a, b) => {
          const aDate = a.completionDeadline?.toDate ? a.completionDeadline.toDate() : new Date(a.completionDeadline);
          const bDate = b.completionDeadline?.toDate ? b.completionDeadline.toDate() : new Date(b.completionDeadline);
          return aDate - bDate;
        });

        setHandoffs(handoffData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading handoffs:', error);
      setLoading(false);
    }
  };

  const toggleChecklistItem = async (handoffId, itemIndex) => {
    try {
      const handoff = handoffs.find(h => h.id === handoffId);
      if (!handoff) return;

      const updatedChecklist = [...handoff.checklist];
      updatedChecklist[itemIndex].completed = !updatedChecklist[itemIndex].completed;

      await updateDoc(doc(db, 'handoffs', handoffId), {
        checklist: updatedChecklist
      });
    } catch (error) {
      console.error('Error updating checklist item:', error);
    }
  };

  const addCustomChecklistItem = async (handoffId) => {
    if (!customItem.trim()) return;

    try {
      const handoff = handoffs.find(h => h.id === handoffId);
      if (!handoff) return;

      const newItem = {
        task: customItem,
        completed: false,
        addedBy: currentUser.uid || currentUser.email,
        addedAt: new Date()
      };

      await updateDoc(doc(db, 'handoffs', handoffId), {
        checklist: arrayUnion(newItem)
      });

      setCustomItem('');
    } catch (error) {
      console.error('Error adding checklist item:', error);
    }
  };

  const addHandoffNote = async (handoffId) => {
    if (!notes.trim()) return;

    try {
      const note = {
        text: notes,
        author: currentUser.uid || currentUser.email,
        timestamp: new Date()
      };

      await updateDoc(doc(db, 'handoffs', handoffId), {
        notes: arrayUnion(note)
      });

      setNotes('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const completeHandoff = async (handoffId) => {
    try {
      await RotationManagementService.completeHandoff(handoffId, 'Completed via checklist manager');
    } catch (error) {
      console.error('Error completing handoff:', error);
    }
  };

  const getCompletionPercentage = (checklist) => {
    if (!checklist || checklist.length === 0) return 0;
    const completed = checklist.filter(item => item.completed).length;
    return Math.round((completed / checklist.length) * 100);
  };

  const getMemberName = (userId) => {
    const member = familyMembers.find(m => m.id === userId || m.email === userId);
    return member?.name || userId;
  };

  const getDomainEmoji = (domain) => {
    const emojis = {
      medical: '🏥',
      meals: '🍽️',
      school: '🎒',
      activities: '⚽',
      household: '🏠',
      finances: '💰'
    };
    return emojis[domain] || '📋';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'text-blue-600 bg-blue-100';
      case 'in-progress':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">
          <ClipboardList className="w-12 h-12 mb-2 mx-auto" />
          <p>Loading handoffs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Handoff Management</h2>
            <p className="opacity-90">Ensure smooth transitions between rotations</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold">
              {handoffs.filter(h => h.status !== 'completed').length}
            </div>
            <div className="text-sm opacity-90">Active Handoffs</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['active', 'completed', 'all'].map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === filterOption
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterOption}
          </button>
        ))}
      </div>

      {/* Handoffs List */}
      <div className="space-y-4">
        {handoffs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            <ClipboardList className="w-12 h-12 mb-4 mx-auto" />
            <p>No {filter === 'active' ? 'active' : filter === 'completed' ? 'completed' : ''} handoffs</p>
          </div>
        ) : (
          handoffs.map((handoff) => {
            const completionPercentage = getCompletionPercentage(handoff.checklist);
            const isExpanded = selectedHandoff === handoff.id;
            const deadlineDate = handoff.completionDeadline?.toDate
              ? handoff.completionDeadline.toDate()
              : new Date(handoff.completionDeadline);
            const isOverdue = deadlineDate < new Date() && handoff.status !== 'completed';

            return (
              <div
                key={handoff.id}
                className={`bg-white rounded-xl shadow-sm border ${
                  isOverdue ? 'border-red-300' : 'border-gray-200'
                } overflow-hidden`}
              >
                {/* Handoff Header */}
                <div
                  onClick={() => setSelectedHandoff(isExpanded ? null : handoff.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getDomainEmoji(handoff.domain)}</span>
                        <div>
                          <h3 className="font-semibold text-lg capitalize">
                            {handoff.domain} Handoff
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-3 h-3" />
                            <span>{getMemberName(handoff.fromUserId)}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span>{getMemberName(handoff.toUserId)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{handoff.checklist?.filter(i => i.completed).length || 0}/{handoff.checklist?.length || 0} items</span>
                          <span>{completionPercentage}% complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              completionPercentage === 100
                                ? 'bg-green-500'
                                : completionPercentage > 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${completionPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Status and Deadline */}
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(handoff.status)}`}>
                          {handoff.status}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="w-3 h-3" />
                          {isOverdue ? (
                            <span className="text-red-600 font-medium">
                              Overdue by {formatDistanceToNow(deadlineDate)}
                            </span>
                          ) : (
                            <span>
                              Due {formatDistanceToNow(deadlineDate, { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {handoff.isInvolved && (
                          <span className="text-xs text-purple-600 font-medium">
                            {handoff.isFrom ? '👤 You\'re handing off' : '👤 You\'re receiving'}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t px-6 py-4 space-y-4">
                    {/* Checklist */}
                    <div>
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Checklist
                      </h4>
                      <div className="space-y-2">
                        {handoff.checklist?.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 group"
                          >
                            <button
                              onClick={() => toggleChecklistItem(handoff.id, idx)}
                              className="mt-0.5"
                              disabled={handoff.status === 'completed' || !handoff.isInvolved}
                            >
                              {item.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                              )}
                            </button>
                            <span className={`text-sm flex-grow ${
                              item.completed ? 'line-through text-gray-500' : ''
                            }`}>
                              {item.task}
                            </span>
                            {item.addedBy && (
                              <span className="text-xs text-gray-400">
                                Added by {getMemberName(item.addedBy)}
                              </span>
                            )}
                          </div>
                        ))}

                        {/* Add custom item */}
                        {handoff.status !== 'completed' && handoff.isInvolved && (
                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={customItem}
                              onChange={(e) => setCustomItem(e.target.value)}
                              placeholder="Add checklist item"
                              className="flex-grow px-3 py-1 text-sm border border-gray-300 rounded-lg"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  addCustomChecklistItem(handoff.id);
                                }
                              }}
                            />
                            <button
                              onClick={() => addCustomChecklistItem(handoff.id)}
                              className="px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Required Documents */}
                    {handoff.requirements?.documentsNeeded?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Required Documents
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <ul className="space-y-1">
                            {handoff.requirements.documentsNeeded.map((doc, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <Download className="w-3 h-3" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Notes & Communication
                      </h4>

                      {handoff.notes?.length > 0 && (
                        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                          {handoff.notes.map((note, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium">
                                  {getMemberName(note.author)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {note.timestamp && formatDistanceToNow(
                                    note.timestamp.toDate ? note.timestamp.toDate() : new Date(note.timestamp),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm">{note.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {handoff.status !== 'completed' && handoff.isInvolved && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add a note..."
                            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-lg"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addHandoffNote(handoff.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => addHandoffNote(handoff.id)}
                            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {handoff.status !== 'completed' && (
                      <div className="flex gap-2 pt-4 border-t">
                        {completionPercentage === 100 && handoff.isTo && (
                          <button
                            onClick={() => completeHandoff(handoff.id)}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete Handoff
                          </button>
                        )}
                        <button className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule Meeting
                        </button>
                      </div>
                    )}

                    {/* Completion confirmation */}
                    {handoff.status === 'completed' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Handoff completed successfully!</span>
                        </div>
                        {handoff.completedAt && (
                          <p className="text-sm text-green-600 mt-1">
                            Completed {formatDistanceToNow(
                              handoff.completedAt.toDate ? handoff.completedAt.toDate() : new Date(handoff.completedAt),
                              { addSuffix: true }
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {handoffs.length > 0
              ? Math.round(
                  (handoffs.filter(h => h.status === 'completed').length / handoffs.length) * 100
                )
              : 0}%
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">Next Deadline</span>
          </div>
          <p className="text-sm text-gray-600">
            {handoffs
              .filter(h => h.status !== 'completed')
              .sort((a, b) => {
                const aDate = a.completionDeadline?.toDate ? a.completionDeadline.toDate() : new Date(a.completionDeadline);
                const bDate = b.completionDeadline?.toDate ? b.completionDeadline.toDate() : new Date(b.completionDeadline);
                return aDate - bDate;
              })[0]?.completionDeadline
              ? formatDistanceToNow(
                  handoffs[0].completionDeadline.toDate
                    ? handoffs[0].completionDeadline.toDate()
                    : new Date(handoffs[0].completionDeadline),
                  { addSuffix: true }
                )
              : 'No pending handoffs'}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Your Handoffs</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {handoffs.filter(h => h.isInvolved && h.status !== 'completed').length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HandoffChecklistManager;