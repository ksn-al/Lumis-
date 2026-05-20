import React, { useState } from "react";
import { apiRequest } from "../api";
import { Link } from "react-router-dom";

function Search() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUsers([]);
    setPosts([]);
    try {
      // Поиск пользователей
     const usersRes = await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
      setUsers(usersRes || []);
      // Поиск постов
      const postsRes = await apiRequest(`/posts/search?q=${encodeURIComponent(query)}`);
      setPosts(postsRes || []);
    } catch (err) {
      setError("Помилка пошуку");
    }
    setLoading(false);
  };

  return (
  <div className="search-page">
    <div className="search-card">
      <h2 className="search-title">Пошук</h2>

      <form onSubmit={handleSearch} className="search-form">
        <input
          className="search-input"
          type="text"
          placeholder="Введіть запит..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          required
        />

        <button className="search-button" type="submit" disabled={loading}>
          {loading ? "Пошук..." : "Знайти"}
        </button>
      </form>

      {error && <div className="search-error">{error}</div>}
    </div>

    <div className="search-results">
      <section className="search-section">
        <h3 className="search-section-title">Користувачі</h3>

        {users.length === 0 ? (
          <div className="search-empty">Не знайдено</div>
        ) : (
          <ul className="search-list">
            {users.map(user => (
              <li className="search-user-item" key={user.id}>
                <Link className="search-user-link" to={`/profile/${user.username}`}>
                  <div className="search-avatar">
                    {(user.displayname || user.username)?.[0]?.toUpperCase()}
                  </div>

                  <div>
                    <div className="search-user-name">
                      {user.displayname || user.username}
                    </div>
                    <div className="search-user-username">
                      @{user.username}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="search-section">
        <h3 className="search-section-title">Пости</h3>

        {posts.length === 0 ? (
          <div className="search-empty">Не знайдено</div>
        ) : (
          <ul className="search-list">
            {posts.map(post => (
              <li className="search-post-item" key={post.id}>
                <p className="search-post-text">{post.text}</p>

                {post.createdAt && (
                  <span className="search-post-date">
                    {post.createdAt.slice(0, 10)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  </div>
);
}

export default Search;
