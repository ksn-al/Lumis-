import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api';
import { Heart, Trash2, Send, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function CommentSection({ postId, currentUserId }) {
  const [comments, setComments]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/posts/${postId}/comments`)
      .then(data => { if (!cancelled) setComments(data || []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const comment = await apiRequest(`/posts/${postId}/comments`, 'POST', { text: trimmed });
      setComments(prev => [...prev, comment]);
      setText('');
    } catch (err) {
      setError(err.message || 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId) => {
    try {
      await apiRequest(`/posts/comments/${commentId}/like`, 'POST');
      setComments(prev => prev.map(c => {
        if (c.id !== commentId) return c;
        const liked = !c.liked;
        return { ...c, liked, likesCount: liked ? c.likesCount + 1 : c.likesCount - 1 };
      }));
    } catch {}
  };

  const handleDelete = async (commentId) => {
    try {
      await apiRequest(`/posts/comments/${commentId}`, 'DELETE');
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {}
  };

  return (
    <div className="comments-section">
      {/* Input form */}
      <form onSubmit={handleSubmit} className="comment-form">
        <input
          className="comment-input"
          type="text"
          placeholder="Add a comment…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={280}
          disabled={submitting}
        />
        <button
          className={`comment-submit${submitting ? ' loading' : ''}`}
          type="submit"
          disabled={submitting || !text.trim()}
          aria-label="Post comment"
        >
          {submitting ? <Loader size={15} className="spin-icon" /> : <Send size={15} />}
        </button>
      </form>

      {error && <div className="comment-error">{error}</div>}

      {/* List */}
      <div className="comments-list">
        {loading ? (
          <div className="comments-loading">
            <Loader size={18} className="spin-icon" />
          </div>
        ) : comments.length === 0 ? (
          <div className="comments-empty">No comments yet — be the first!</div>
        ) : (
          comments.map(comment => {
            const src = comment.user?.avatar
              ? (comment.user.avatar.startsWith('http')
                  ? comment.user.avatar
                  : `${API_URL}${comment.user.avatar}`)
              : null;

            return (
              <div className="comment-item" key={comment.id}>
                {/* Avatar */}
                <div className="comment-avatar-col">
                  {src ? (
                    <img src={src} alt="av" className="comment-avatar" />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {(comment.user?.displayname || comment.user?.username || '?')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="comment-body">
                  <div className="comment-meta">
                    <span className="comment-name">
                      {comment.user?.displayname || comment.user?.username}
                    </span>
                    <span className="comment-username">@{comment.user?.username}</span>
                    <span className="comment-dot">·</span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('uk-UA', {
                        day: 'numeric', month: 'short',
                      })}
                    </span>
                  </div>

                  <p className="comment-text">{comment.text}</p>

                  <div className="comment-actions">
                    <button
                      className={`comment-like-btn${comment.liked ? ' liked' : ''}`}
                      onClick={() => handleLike(comment.id)}
                    >
                      <Heart size={13} />
                      {comment.likesCount > 0 && (
                        <span className="comment-like-count">{comment.likesCount}</span>
                      )}
                    </button>

                    {comment.userId === currentUserId && (
                      <button
                        className="comment-delete-btn"
                        onClick={() => handleDelete(comment.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
