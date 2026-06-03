import React, { useState } from 'react';
import { apiRequest } from '../api';
import { Heart, Bookmark, MessageSquare, Trash2 } from 'lucide-react';
import CommentSection from './CommentSection';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Post({ post, onLike, onFavorite, onDelete, currentUserId }) {
  const [liked,         setLiked]        = useState(post.liked || false);
  const [favorited,     setFavorited]    = useState(post.favorited || false);
  const [likeCount,     setLikeCount]    = useState(post.likesCount || 0);
  const [loadingLike,   setLoadingLike]  = useState(false);
  const [loadingFav,    setLoadingFav]   = useState(false);
  const [loadingDelete, setLoadingDelete]= useState(false);
  const [showComments,  setShowComments] = useState(false);
  const [error,         setError]        = useState('');

  const handleLike = async () => {
    setLoadingLike(true);
    setError('');
    try {
      await apiRequest(`/posts/${post.id}/like`, 'POST');
      const next = !liked;
      setLiked(next);
      setLikeCount(next ? likeCount + 1 : likeCount - 1);
      if (onLike) onLike(post.id, next);
    } catch (e) {
      setError(e.message || 'Like error');
    } finally {
      setLoadingLike(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setLoadingDelete(true);
    setError('');
    try {
      await apiRequest(`/posts/${post.id}`, 'DELETE');
      if (onDelete) onDelete(post.id);
    } catch (e) {
      setError(e.message || 'Delete error');
    } finally {
      setLoadingDelete(false);
    }
  };

  const handleFavorite = async () => {
    setLoadingFav(true);
    setError('');
    try {
      await apiRequest(`/posts/${post.id}/favorite`, 'POST');
      const next = !favorited;
      setFavorited(next);
      if (onFavorite) onFavorite(post.id, next);
    } catch (e) {
      setError(e.message || 'Favorite error');
    } finally {
      setLoadingFav(false);
    }
  };

  const avatarSrc = post.user?.avatar
    ? (post.user.avatar.startsWith('http') ? post.user.avatar : `${API_URL}${post.user.avatar}`)
    : null;

  const imageSrc = post.image
    ? (post.image.startsWith('http') ? post.image : `${API_URL}${post.image}`)
    : null;

  return (
    <div className="post">
      {/* Header */}
      <div className="post-header">
        {avatarSrc ? (
          <img src={avatarSrc} alt="avatar" className="post-avatar" />
        ) : (
          <div className="post-avatar-placeholder">
            {(post.user?.displayname || post.user?.username || '?')[0].toUpperCase()}
          </div>
        )}
        <div className="post-header-info">
          <div className="post-displayname">
            {post.user?.displayname || post.user?.username}
          </div>
          <div className="post-username">@{post.user?.username}</div>
        </div>
      </div>

      {/* Content */}
      <div className="post-text">{post.text}</div>

      {imageSrc && (
        <img src={imageSrc} alt="post" className="post-image" />
      )}

      {/* Actions */}
      <div className="post-actions">
        {/* Like */}
        <button
          className={`post-like-button${liked ? ' liked' : ''}`}
          onClick={handleLike}
          disabled={loadingLike}
          title="Like"
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span className="post-like-count">{likeCount}</span>
        </button>

        {/* Comments toggle */}
        <button
          className={`post-comment-button${showComments ? ' active' : ''}`}
          onClick={() => setShowComments(v => !v)}
          title="Comments"
        >
          <MessageSquare size={18} />
        </button>

        {/* Favorite / Save */}
        <button
          className={`post-favorite-button${favorited ? ' favorited' : ''}`}
          onClick={handleFavorite}
          disabled={loadingFav}
          title="Save"
        >
          <Bookmark size={18} fill={favorited ? 'currentColor' : 'none'} />
        </button>

        <span className="post-date">
          {new Date(post.createdAt).toLocaleDateString('uk-UA', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>

        {/* Delete — only for own posts */}
        {currentUserId && post.user?.id === currentUserId && (
          <button
            className="post-delete-button"
            onClick={handleDelete}
            disabled={loadingDelete}
            title="Delete post"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {error && <div className="post-error">{error}</div>}

      {/* Inline comments */}
      {showComments && (
        <div className="post-comments-wrap">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}

export default Post;
