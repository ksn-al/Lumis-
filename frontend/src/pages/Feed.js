import React, { useEffect, useState, useRef, useCallback } from 'react';
import { apiRequest } from '../api';
import { useSocket } from '../context/SocketContext';
import Post from '../components/Post';
import { ChevronDown } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Feed() {
  const [posts, setPosts]               = useState([]);
  const [newPost, setNewPost]           = useState('');
  const [postError, setPostError]       = useState('');
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [nextCursor, setNextCursor]     = useState(null);
  const socket = useSocket();
  const [currentUserId, setCurrentUserId] = useState(null);

  const renderedIds = useRef(new Set());

  useEffect(() => {
    apiRequest('/posts/feed')
      .then(data => {
        const incoming = data.posts || [];
        setPosts(incoming);
        setNextCursor(data.nextCursor ?? null);
        renderedIds.current = new Set(incoming.map(p => p.id));
      })
      .catch(() => setPosts([]));

    apiRequest('/users/me')
      .then(data => { if (data.user) setCurrentUserId(data.user.id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNewPost = (post) => {
      if (renderedIds.current.has(post.id)) return;
      renderedIds.current.add(post.id);
      setPosts(prev => [post, ...prev]);
    };
    socket.on('new-post', handleNewPost);
    return () => socket.off('new-post', handleNewPost);
  }, [socket]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await apiRequest(
        `/posts/feed?before=${encodeURIComponent(nextCursor)}`
      );
      const incoming = (data.posts || []).filter(p => !renderedIds.current.has(p.id));
      incoming.forEach(p => renderedIds.current.add(p.id));
      setPosts(prev => [...prev, ...incoming]);
      setNextCursor(data.nextCursor ?? null);
    } catch {
      
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (newPost.length === 0 || newPost.length > 280) {
      setPostError('Текст поста повинен бути від 1 до 280 символів');
      return;
    }
    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setPostError('Картинка не повинна перевищувати 5MB');
      return;
    }
    setPostError('');
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', newPost);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.post) {
       
        if (!renderedIds.current.has(data.post.id)) {
          renderedIds.current.add(data.post.id);
          setPosts(prev => [data.post, ...prev]);
        }
        setNewPost('');
        setImageFile(null);
        setImagePreview(null);
      } else {
        setPostError(data.message || 'Помилка створення поста');
      }
    } catch (error) {
      setPostError(error.message || 'Помилка створення поста');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPostError('Картинка не повинна перевищувати 5MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="feed-card">
      <h2 className="feed-title">Feed</h2>

      <form onSubmit={handleCreatePost} className="feed-create-form">
        <textarea
          className="feed-textarea"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          maxLength={280}
          placeholder="What's new?"
          required
        />
        <div className="feed-create-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              className="feed-image-btn"
              title="Add image"
              onClick={() => document.getElementById('feed-image-input').click()}
            >
              📎
            </button>
            <input
              id="feed-image-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="feed-image-preview-wrap">
                <img src={imagePreview} alt="preview" />
                <button
                  type="button"
                  className="feed-remove-image"
                  onClick={handleRemoveImage}
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <button className="feed-create-btn" type="submit" disabled={loading}>
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
        {postError && <div className="feed-post-error">{postError}</div>}
      </form>

      <div className="feed-posts">
        {posts.length > 0 ? (
          posts.map(post => (
            <Post
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onDelete={postId => {
                renderedIds.current.delete(postId);
                setPosts(prev => prev.filter(p => p.id !== postId));
              }}
            />
          ))
        ) : (
          <div className="feed-empty">Постів ще немає</div>
        )}
      </div>

      {nextCursor && (
        <div className="feed-load-more">
          <button
            className="feed-load-more-btn"
            onClick={loadMore}
            disabled={loadingMore}
          >
            <ChevronDown size={15} style={{ marginRight: 5 }} />
            {loadingMore ? 'Loading…' : 'Load older posts'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Feed;
