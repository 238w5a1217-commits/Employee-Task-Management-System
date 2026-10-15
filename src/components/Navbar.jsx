import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import {
  Menu,
  Plus,
  Search,
  ArrowRight,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function Navbar({ onToggleMobileMenu }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tasks?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="navbar">
        {/* Mobile Left: Hamburger button opens Sidebar Drawer */}
        <button
          className="mobile-header-btn mobile-only"
          onClick={onToggleMobileMenu}
          aria-label="Open sidebar menu"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Left: Global Search Box in Top Header */}
        <div className="nav-left desktop-only">
          <form onSubmit={handleSearchSubmit} className="topbar-search-form">
            <Search size={16} className="topbar-search-icon" />
            <input
              type="text"
              placeholder="Search tasks, descriptions, employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="topbar-search-input"
            />
          </form>
        </div>

        {/* Mobile Center: Brand Name in Light Clean Style */}
        <Link to="/" className="mobile-brand-center mobile-only">
          <div className="brand-logo-wrapper brand-logo-wrapper-sm">
            <img
              src={logoImg}
              alt="Roots Media Marketing"
              className="brand-logo-img"
            />
          </div>
          <span className="mobile-brand-title">Roots Media</span>
        </Link>

        {/* Right Actions */}
        <div className="nav-actions">
          {/* Mobile Right: Search Icon Toggle */}
          <button
            className="mobile-header-btn mobile-only"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label="Search"
          >
            {searchOpen ? <X size={19} /> : <Search size={19} />}
          </button>
        </div>
      </header>

      {/* Mobile Clean Light Search Popover */}
      {searchOpen && (
        <div className="mobile-search-popover mobile-only">
          <form onSubmit={handleSearchSubmit} className="mobile-search-form">
            <Search size={18} className="search-icon-input" />
            <input
              type="text"
              autoFocus
              placeholder="Search tasks, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-submit">
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
