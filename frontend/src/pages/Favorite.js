import React, { useEffect, useState } from 'react';
import Post from '../components/Post';
import { apiRequest } from '../api';

function Favorite() {
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    apiRequest('/users/me')
      .then(d => { if (d.user) setCurrentUserId(d.user.id); })
      .catch(() => {});

    const fetchFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiRequest('/posts/favorites');
        setPosts(data.posts || []);
      } catch (e) {
        setPosts([]);
        setError(e.message || 'Error loading favorites');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  return (
    <div className="favorite">
      <div className="favorite-header">
        <h2 className="favorite-title">Favorites</h2>
        <p className="favorite-subtitle">Posts you've saved</p>
      </div>

      {error && <div className="favorite-error">{error}</div>}
      {loading && <div className="favorite-loading">Loading...</div>}

      <div className="favorite-posts">
        {!loading && !error && posts.length === 0 && (
          <div className="favorite-empty">No saved posts yet</div>
        )}
        {posts.map(post => (
          <Post
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onDelete={postId => setPosts(prev => prev.filter(p => p.id !== postId))}
          />
        ))}
      </div>
    </div>
  );
}

export default Favorite;
