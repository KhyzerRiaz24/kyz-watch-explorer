import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Heart, Menu, MessageCircle, Scale, X } from 'lucide-react';
import { Provider, useApp } from './state';
import { Home, Collections, Compare, InsightsPage, About, NotFound } from './pages';
import { Assistant, WatchDetails } from './ui';
const Studio = lazy(() => import('./Studio'));

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="container page-content">
        <h1>Let’s try that again.</h1>
        <p>Something interrupted the page. Reload to return to the collection.</p>
        <button className="button dark" onClick={() => location.reload()}>
          Reload KYZ
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
function Layout() {
  const { saved, watches, comparison, clearComparison, setAssistantOpen, selected, toast } =
    useApp();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    const titles: Record<string, string> = {
      '/': 'Watch Explorer',
      '/collections': 'The Collection',
      '/saved': 'Your Saved Watches',
      '/compare': 'Compare Watches',
      '/insights': 'Collection Insights',
      '/about': 'The Project',
      '/studio': 'Catalogue Studio',
    };
    document.title = `KYZ — ${titles[location.pathname] || 'Page not found'}`;
  }, [location.pathname]);
  useEffect(() => {
    if (!menu) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [menu]);
  const savedCount = saved.filter((id) => watches.some((w) => w.id === id)).length;
  const validComparison = comparison.filter((id) => watches.some((w) => w.id === id));
  const showTray = validComparison.length > 0 && location.pathname !== '/compare';
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="demo-banner">
        AN INDEPENDENT PORTFOLIO PROJECT <span>by Khyzer Riaz</span>
        <Link to="/about">
          Discover the story <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <div className="nav-container">
          <Link to="/" className="wordmark" aria-label="KYZ Watch Explorer home">
            KYZ<span>WATCH EXPLORER</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/collections">The collection</NavLink>
            <NavLink to="/insights">Insights</NavLink>
            <NavLink to="/about">The project</NavLink>
          </nav>
          <div className="nav-actions">
            <NavLink to="/saved" className="saved-nav" aria-label={`Saved watches, ${savedCount}`}>
              <Heart size={18} />
              <span>Saved</span>
              {savedCount > 0 && <b>{savedCount}</b>}
            </NavLink>
            <button
              className="menu-toggle icon-button"
              aria-label={menu ? 'Close navigation' : 'Open navigation'}
              aria-expanded={menu}
              aria-controls="mobile-navigation"
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav className="mobile-nav" id="mobile-navigation" aria-label="Mobile navigation">
            <NavLink to="/collections">
              The collection <ArrowUpRight size={17} />
            </NavLink>
            <NavLink to="/insights">
              Collection insights <ArrowUpRight size={17} />
            </NavLink>
            <NavLink to="/about">
              The project <ArrowUpRight size={17} />
            </NavLink>
            <NavLink to="/saved">
              Your saved watches <Heart size={17} />
            </NavLink>
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/saved" element={<Collections savedOnly />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/about" element={<About />} />
          <Route
            path="/studio"
            element={
              <Suspense
                fallback={
                  <p className="container loading-text" role="status">
                    Opening the studio…
                  </p>
                }
              >
                <Studio />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Link to="/" className="wordmark">
                KYZ<span>WATCH EXPLORER</span>
              </Link>
              <p>Time, considered.</p>
            </div>
            <div className="footer-links">
              <Link to="/collections">The collection</Link>
              <Link to="/saved">Your shortlist</Link>
              <Link to="/compare">Compare watches</Link>
              <Link to="/about">About the project</Link>
            </div>
            <div className="footer-author">
              <span>DESIGNED & ENGINEERED BY</span>
              <a
                href="https://www.linkedin.com/in/khyzer-riaz-56b143360"
                target="_blank"
                rel="noreferrer"
              >
                Khyzer Riaz <ArrowUpRight size={15} />
              </a>
              <Link to="/studio">Catalogue studio</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              Portfolio demonstration. Sample prices in USD. Synthetic charts. Editorial images.
            </p>
            <span>Independent of all featured watchmakers.</span>
          </div>
        </div>
      </footer>
      <button
        className={`advisor-trigger ${showTray ? 'with-tray' : ''}`}
        onClick={() => setAssistantOpen(true)}
        aria-label="Open watch advisor"
      >
        <MessageCircle size={19} />
        <span>Ask the advisor</span>
      </button>
      {showTray && (
        <div className="compare-tray" role="region" aria-label="Your watch comparison">
          <span>
            <Scale size={18} />
            <strong>{validComparison.length}/3</strong>
            <span>ready to compare</span>
          </span>
          <div>
            <button className="text-button" onClick={clearComparison} aria-label="Clear comparison">
              <X size={17} />
            </button>
            <Link to="/compare" className="button gold">
              Compare <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">
        {toast && <div className="toast">{toast}</div>}
      </div>
      {selected && <WatchDetails />}
      <Assistant />
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <Provider>
        <Layout />
      </Provider>
    </ErrorBoundary>
  );
}
