import React, { useState, useEffect } from 'react';
import {
  Vote,
  Users,
  ThumbsUp,
  ThumbsDown,
  MinusCircle,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  FileText,
  User,
  Calendar,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Send,
  PlusCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import ConsensusDecisionService from '../../services/ConsensusDecisionService';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * Consensus Voting Interface
 * Democratic decision-making UI for families
 */
const ConsensusVotingInterface = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending'); // pending, history, create
  const [decisions, setDecisions] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [comment, setComment] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // New decision form state
  const [newDecision, setNewDecision] = useState({
    title: '',
    description: '',
    category: 'household',
    importance: 'medium',
    urgency: 'normal'
  });

  useEffect(() => {
    if (familyId && currentUser) {
      loadDecisions();
    }
  }, [familyId, currentUser, activeTab]);

  const loadDecisions = () => {
    try {
      let q;
      if (activeTab === 'pending') {
        q = query(
          collection(db, 'decisions'),
          where('familyId', '==', familyId),
          where('status', 'in', ['deliberating', 'voting'])
        );
      } else {
        q = query(
          collection(db, 'decisions'),
          where('familyId', '==', familyId),
          where('status', 'in', ['approved', 'rejected', 'implemented'])
        );
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const decisionData = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          // Check if current user can vote on this decision
          const canVote = data.consensusRules?.eligibleVoters?.includes(currentUser.uid) ||
                         data.consensusRules?.eligibleVoters?.includes(currentUser.email);
          decisionData.push({
            id: doc.id,
            ...data,
            canVote,
            userVote: data.votes?.[currentUser.uid] || data.votes?.[currentUser.email]
          });
        });
        setDecisions(decisionData);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading decisions:', error);
      setLoading(false);
    }
  };

  const handleVote = async (decisionId, vote) => {
    try {
      await ConsensusDecisionService.castVote(
        decisionId,
        currentUser.uid || currentUser.email,
        vote,
        comment
      );
      setComment('');
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('Error casting vote: ' + error.message);
    }
  };

  const handleCreateDecision = async () => {
    try {
      await ConsensusDecisionService.createDecision(familyId, {
        ...newDecision,
        initiatedBy: currentUser.uid || currentUser.email
      });

      // Reset form
      setNewDecision({
        title: '',
        description: '',
        category: 'household',
        importance: 'medium',
        urgency: 'normal'
      });
      setShowCreateForm(false);
      setActiveTab('pending');
    } catch (error) {
      console.error('Error creating decision:', error);
      alert('Error creating decision: ' + error.message);
    }
  };

  const loadAISuggestions = async (decisionId) => {
    try {
      setShowAISuggestions(true);
      const suggestions = await ConsensusDecisionService.getAISuggestions(decisionId);
      setAiSuggestions(suggestions);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      financial: '💰',
      schedule: '📅',
      household: '🏠',
      children: '👶',
      emergency: '🚨'
    };
    return icons[category] || '📋';
  };

  const getVoteBreakdown = (decision) => {
    const votes = Object.values(decision.votes || {});
    return {
      yes: votes.filter(v => v.vote === 'yes').length,
      no: votes.filter(v => v.vote === 'no').length,
      abstain: votes.filter(v => v.vote === 'abstain').length,
      pending: votes.filter(v => v.vote === 'pending').length,
      total: votes.length
    };
  };

  const getApprovalPercentage = (decision) => {
    const breakdown = getVoteBreakdown(decision);
    const effectiveVotes = breakdown.yes + breakdown.no;
    return effectiveVotes > 0 ? Math.round((breakdown.yes / effectiveVotes) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">
          <Vote className="w-12 h-12 mb-2 mx-auto" />
          <p>Loading decisions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Family Consensus</h2>
            <p className="opacity-90">Make important decisions together</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Decision</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Pending ({decisions.filter(d => d.status === 'deliberating' || d.status === 'voting').length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            activeTab === 'history'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          History
        </button>
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {decisions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500">
            <Vote className="w-12 h-12 mb-4 mx-auto" />
            <p>No {activeTab === 'pending' ? 'pending' : 'completed'} decisions</p>
          </div>
        ) : (
          decisions.map((decision) => {
            const breakdown = getVoteBreakdown(decision);
            const approvalPercentage = getApprovalPercentage(decision);
            const isExpanded = selectedDecision === decision.id;

            return (
              <div
                key={decision.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Decision Header */}
                <div
                  onClick={() => setSelectedDecision(isExpanded ? null : decision.id)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getCategoryIcon(decision.category)}</span>
                        <div>
                          <h3 className="font-semibold text-lg">{decision.title}</h3>
                          <p className="text-sm text-gray-600">
                            {decision.status === 'deliberating' && 'In deliberation'}
                            {decision.status === 'voting' && 'Voting open'}
                            {decision.status === 'approved' && 'Approved'}
                            {decision.status === 'rejected' && 'Rejected'}
                            {decision.status === 'implemented' && 'Implemented'}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{decision.description}</p>

                      {/* Vote Progress */}
                      <div className="flex items-center gap-4">
                        <div className="flex-grow">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Votes: {breakdown.total - breakdown.pending}/{breakdown.total}</span>
                            <span>{approvalPercentage}% approval</span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                            <div
                              className="bg-green-500 transition-all"
                              style={{ width: `${(breakdown.yes / breakdown.total) * 100}%` }}
                            />
                            <div
                              className="bg-red-500 transition-all"
                              style={{ width: `${(breakdown.no / breakdown.total) * 100}%` }}
                            />
                            <div
                              className="bg-gray-400 transition-all"
                              style={{ width: `${(breakdown.abstain / breakdown.total) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <div className="flex gap-3 text-xs">
                              <span className="text-green-600">Yes: {breakdown.yes}</span>
                              <span className="text-red-600">No: {breakdown.no}</span>
                              <span className="text-gray-600">Abstain: {breakdown.abstain}</span>
                            </div>
                            <span className="text-xs text-purple-600">
                              Required: {Math.round(decision.consensusRules?.requiredThreshold * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* User's Vote Status */}
                      {decision.canVote && decision.userVote && (
                        <div className="mt-3 flex items-center gap-2">
                          {decision.userVote.vote === 'yes' && (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-600">You voted yes</span>
                            </>
                          )}
                          {decision.userVote.vote === 'no' && (
                            <>
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-red-600">You voted no</span>
                            </>
                          )}
                          {decision.userVote.vote === 'abstain' && (
                            <>
                              <MinusCircle className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">You abstained</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t px-6 py-4 space-y-4">
                    {/* Voting Actions */}
                    {decision.canVote && decision.userVote?.vote === 'pending' && (
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm font-medium text-purple-900 mb-3">Cast Your Vote</p>

                        {/* Comment Input */}
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Add your thoughts (optional)"
                          className="w-full px-3 py-2 border border-purple-200 rounded-lg mb-3 text-sm"
                          rows="2"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVote(decision.id, 'yes')}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Yes
                          </button>
                          <button
                            onClick={() => handleVote(decision.id, 'no')}
                            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            No
                          </button>
                          <button
                            onClick={() => handleVote(decision.id, 'abstain')}
                            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center gap-2"
                          >
                            <MinusCircle className="w-4 h-4" />
                            Abstain
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Discussion Thread */}
                    {decision.discussion?.thread?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Discussion
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {decision.discussion.thread.map((entry, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-gray-500" />
                                <span className="text-xs font-medium">
                                  {familyMembers.find(m => m.id === entry.userId || m.email === entry.userId)?.name || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {entry.timestamp && formatDistanceToNow(
                                    entry.timestamp.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp),
                                    { addSuffix: true }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm">{entry.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pros and Cons */}
                    {(decision.discussion?.pros?.length > 0 || decision.discussion?.cons?.length > 0) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-green-700">Pros</h4>
                          <ul className="space-y-1">
                            {decision.discussion.pros?.map((pro, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                                <span className="text-green-600">+</span> {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2 text-red-700">Cons</h4>
                          <ul className="space-y-1">
                            {decision.discussion.cons?.map((con, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                                <span className="text-red-600">−</span> {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* AI Suggestions */}
                    <div>
                      {!showAISuggestions ? (
                        <button
                          onClick={() => loadAISuggestions(decision.id)}
                          className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg flex items-center gap-2 text-sm"
                        >
                          <Brain className="w-4 h-4" />
                          Get AI Suggestions
                        </button>
                      ) : aiSuggestions ? (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-900">
                            <Brain className="w-4 h-4" />
                            AI Analysis
                          </h4>
                          <p className="text-sm text-gray-700">{aiSuggestions.recommendation}</p>
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Initiated by {decision.initiatedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {decision.initiatedAt && format(
                          decision.initiatedAt.toDate ? decision.initiatedAt.toDate() : new Date(decision.initiatedAt),
                          'MMM d, yyyy'
                        )}
                      </span>
                      {decision.consensusRules?.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Deadline: {format(
                            decision.consensusRules.deadline.toDate
                              ? decision.consensusRules.deadline.toDate()
                              : new Date(decision.consensusRules.deadline),
                            'MMM d'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Decision Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Decision</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newDecision.title}
                  onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="What needs to be decided?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newDecision.description}
                  onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Provide context and details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newDecision.category}
                  onChange={(e) => setNewDecision({ ...newDecision, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="financial">Financial</option>
                  <option value="schedule">Schedule</option>
                  <option value="household">Household</option>
                  <option value="children">Children</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Importance
                  </label>
                  <select
                    value={newDecision.importance}
                    onChange={(e) => setNewDecision({ ...newDecision, importance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Urgency
                  </label>
                  <select
                    value={newDecision.urgency}
                    onChange={(e) => setNewDecision({ ...newDecision, urgency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleCreateDecision}
                  disabled={!newDecision.title || !newDecision.description}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Decision
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsensusVotingInterface;