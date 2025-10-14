// BlogComments.jsx - Google Docs style commenting for blog posts
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Check, X, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BlogCommentService from '../../services/BlogCommentService';
import UserAvatar from '../common/UserAvatar';

const BlogComments = ({ postId }) => {
  const { currentUser, currentUserProfile } = useAuth();
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [textRange, setTextRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const commentBoxRef = useRef(null);

  // For non-logged-in users
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  useEffect(() => {
    if (!postId) return;
    loadComments();
  }, [postId]);

  // Load comments from Firestore
  const loadComments = async () => {
    try {
      const fetchedComments = await BlogCommentService.getComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  // Handle text selection
  const handleTextSelect = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      setSelectedText(text);
      setTextRange({
        start: selection.anchorOffset,
        end: selection.focusOffset,
        text: text
      });
      setShowCommentBox(true);
    }
  };

  // Add a comment
  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedText) return;

    // Validate guest user fields
    if (!currentUser) {
      if (!guestName.trim() || !guestEmail.trim()) {
        alert('Please enter your name and email to comment');
        return;
      }
      if (!guestEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      const newComment = await BlogCommentService.addComment({
        blogPostId: postId,
        selectedText: selectedText,
        textStart: textRange.start,
        textEnd: textRange.end,
        userId: currentUser ? currentUser.uid : `guest_${Date.now()}`,
        userName: currentUser ? (currentUserProfile?.name || currentUser.email || 'Anonymous') : guestName,
        userEmail: currentUser ? currentUser.email : guestEmail,
        commentText: commentText.trim()
      });

      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setSelectedText('');
      setShowCommentBox(false);
      setTextRange(null);
      setGuestName('');
      setGuestEmail('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add a reply
  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;

    // Validate guest user fields
    if (!currentUser) {
      if (!guestName.trim() || !guestEmail.trim()) {
        alert('Please enter your name and email to reply');
        return;
      }
      if (!guestEmail.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      await BlogCommentService.addReply(commentId, {
        userId: currentUser ? currentUser.uid : `guest_${Date.now()}`,
        userName: currentUser ? (currentUserProfile?.name || currentUser.email || 'Anonymous') : guestName,
        userEmail: currentUser ? currentUser.email : guestEmail,
        replyText: replyText.trim()
      });

      await loadComments(); // Reload to get updated comment with reply
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resolve a comment
  const handleResolveComment = async (commentId) => {
    try {
      await BlogCommentService.resolveComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error resolving comment:', error);
    }
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="blog-comments-container">
      {/* Comment Selection Box */}
      {showCommentBox && (
        <div
          ref={commentBoxRef}
          className="fixed right-8 bg-white rounded-lg shadow-2xl border border-gray-200 p-4 w-80 z-50"
          style={{ top: '200px' }}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-2">Selected text:</p>
              <p className="text-sm text-gray-700 italic bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                "{selectedText.length > 100 ? selectedText.substring(0, 100) + '...' : selectedText}"
              </p>
            </div>
            <button
              onClick={() => {
                setShowCommentBox(false);
                setCommentText('');
                setSelectedText('');
                setGuestName('');
                setGuestEmail('');
              }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {/* Guest user name/email fields */}
          {!currentUser && (
            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Your email (will not be published)"
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add your comment..."
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            autoFocus={currentUser} // Only autofocus if logged in, let guests focus name field
          />

          <div className="flex justify-end mt-2 gap-2">
            <button
              onClick={() => {
                setShowCommentBox(false);
                setCommentText('');
                setGuestName('');
                setGuestEmail('');
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleAddComment}
              disabled={loading || !commentText.trim() || (!currentUser && (!guestName.trim() || !guestEmail.trim()))}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              {loading ? 'Adding...' : (
                <>
                  <Send size={14} />
                  Comment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Comments Sidebar */}
      {comments.length > 0 && (
        <div className="fixed right-0 top-20 bottom-0 w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto p-4 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle size={18} />
              Comments ({comments.length})
            </h3>
          </div>

          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                {/* Comment Header */}
                <div className="flex items-start gap-2 mb-2">
                  <UserAvatar
                    user={{ name: comment.userName, email: comment.userEmail }}
                    size={32}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {comment.userName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResolveComment(comment.id)}
                    className="text-gray-400 hover:text-green-600"
                    title="Resolve comment"
                  >
                    <Check size={16} />
                  </button>
                </div>

                {/* Selected Text */}
                <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded mb-2 border-l-2 border-yellow-400">
                  <span className="italic">"{comment.selectedText}"</span>
                </div>

                {/* Comment Text */}
                <p className="text-sm text-gray-800 mb-3">
                  {comment.commentText}
                </p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-4 space-y-2 mb-2 border-l-2 border-gray-200 pl-3">
                    {comment.replies.map((reply, idx) => (
                      <div key={idx} className="text-sm">
                        <p className="font-medium text-gray-700">{reply.userName}</p>
                        <p className="text-gray-600">{reply.replyText}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(reply.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Input */}
                {replyingTo === comment.id ? (
                  <div className="mt-2">
                    {/* Guest user name/email fields for replies */}
                    {!currentUser && (
                      <div className="mb-2 space-y-2">
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Your name"
                          className="w-full border border-gray-300 rounded p-2 text-xs"
                          required
                        />
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          placeholder="Your email (will not be published)"
                          className="w-full border border-gray-300 rounded p-2 text-xs"
                          required
                        />
                      </div>
                    )}
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full border border-gray-300 rounded p-2 text-sm resize-none"
                      rows={2}
                      autoFocus={currentUser}
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyText('');
                        }}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddReply(comment.id)}
                        disabled={loading || !replyText.trim() || (!currentUser && (!guestName.trim() || !guestEmail.trim()))}
                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Reply
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions for users */}
      {comments.length === 0 && !showCommentBox && (
        <div className="fixed right-8 bottom-8 bg-blue-50 border border-blue-200 rounded-lg p-4 w-64 shadow-lg">
          <p className="text-sm text-blue-900 flex items-start gap-2">
            <MessageCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>Select any text to add a comment!</span>
          </p>
        </div>
      )}

      {/* Hidden element to capture text selection */}
      <div
        onMouseUp={handleTextSelect}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: -1 }}
      />
    </div>
  );
};

export default BlogComments;
