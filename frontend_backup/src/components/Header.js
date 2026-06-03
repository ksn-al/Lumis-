import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const go = () => {
    const query = inputRef.current?.value?.trim();
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    go();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') go();
  };

  return (
    <header className="app-header">
      <form onSubmit={handleSubmit} className="header-search-form">
        <Search size={16} className="header-search-icon" />
        <input
          ref={inputRef}
          className="header-search-input"
          type="text"
          name="search"
          placeholder="Search users &amp; posts…"
          autoComplete="off"
          onKeyDown={handleKeyDown}
        />
        <button type="submit" className="header-search-btn" aria-label="Search">
          Search
        </button>
      </form>
    </header>
  );
};

export default Header;
