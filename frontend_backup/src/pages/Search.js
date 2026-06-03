import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../api';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Users, FileText } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery]   = useState(searchParams.get('q') || '');
  const [users, setUsers]   = useState([]);
  const [posts, setPosts]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q) => {
    if (!q || !q.trim()) return;
    setLoading(true);
    setError('');
    setUsers([]);
    setPosts([]);
    setSearched(true);
    try {
      const [usersRes, postsRes] = await Promise.all([
        apiRequest(`/users/search?q=${encodeURIComponent(q)}`),
        apiRequest(`/posts/search?q=${encodeURIComponent(q)}`),
      ]);
      setUsers(usersRes || []);
      setPosts(postsRes || []);
    } catch {
      setError('Search failed. Please try again.');
    }
    setLoading(false);
  }, []);

  // Auto-run search when URL param changes (e.g. navigated here from header)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      runSearch(q);
    }
  }, [searchParams, runSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    // Sync to URL so header stays in sync
    setSearchParams({ q });
    runSearch(q);
  };

  return (
    <div className="search-page">
      <div className="search-card">
        <h2 className="search-title">Search</h2>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-wrap">
            <SearchIcon size={17} className="search-icon-inside" />
            <input
              className="search-input"
              type="text"
              placeholder="Search users and posts…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <button className="search-button" type="submit" disabled={loading}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && <div className="search-error">{error}</div>}
      </div>

      {searched && (
        <div className="search-results">
          {/* Users */}
          <section className="search-section">
            <h3 className="search-section-title">
              <Users size={16} className="search-section-icon" />
              Users
            </h3>

            {users.length === 0 ? (
              <div className="search-empty">No users found</div>
            ) : (
              <ul className="search-list">
                {users.map(user => {
                  const avatarSrc = user.avatar
                    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`)
                    : null;
                  return (
                    <li className="search-user-item" key={user.id}>
                      <Link className="search-user-link" to={`/profile/${user.username}`}>
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="avatar" className="search-avatar-img" />
                        ) : (
                          <div className="search-avatar">
                            {(user.displayname || user.username)?.[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="search-user-name">{user.displayname || user.username}</div>
                          <div className="search-user-username">@{user.username}</div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Posts */}
          <section className="search-section">
            <h3 className="search-section-title">
              <FileText size={16} className="search-section-icon" />
              Posts
            </h3>

            {posts.length === 0 ? (
              <div className="search-empty">No posts found</div>
            ) : (
              <ul className="search-list">
                {posts.map(post => (
                  <li className="search-post-item" key={post.id}>
                    <Link
                      className="search-post-author-link"
                      to={`/profile/${post.user?.username}`}
                    >
                      <div className="search-post-author">
                        {post.user?.displayname || post.user?.username}
                        <span className="search-post-uname">@{post.user?.username}</span>
                      </div>
                    </Link>
                    <p className="search-post-text">{post.text}</p>
                    {post.createdAt && (
                      <span className="search-post-date">
                        {new Date(post.createdAt).toLocaleDateString('uk-UA', {
                          day: 'numeric', month: 'short',
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Search;
