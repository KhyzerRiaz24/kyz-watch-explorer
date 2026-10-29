import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Heart,
  Scale,
  Sparkles,
  MoveUpRight,
  Download,
  Code2,
  Database,
  Workflow,
  ShieldCheck,
  Bookmark,
} from 'lucide-react';
import { useApp } from './state';
import { WatchCard, CatalogueStatus, EmptyState, PriceChart } from './ui';
import { api, money, compactMoney, type Insights, type History } from './types';

export function Home() {
  const { watches, setAssistantOpen } = useApp();
  return (
    <>
      <section className="hero">
        <div className="hero-photo">
          <img
            src="/images/hero.jpg"
            alt="Close-up of the craftsmanship inside a mechanical watch"
            width="1800"
            height="1200"
          />
        </div>
        <div className="hero-content">
          <p className="eyebrow light">
            <span /> FOR THE LOVE OF TIME
          </p>
          <h1>
            Some things
            <br />
            are worth
            <br />
            <em>taking time for.</em>
          </h1>
          <p className="hero-description">
            Find the watch that feels like you. An independent space to discover, compare and
            appreciate exceptional timepieces.
          </p>
          <div className="hero-actions">
            <Link to="/collections" className="button gold">
              Explore the collection <ArrowUpRight size={18} />
            </Link>
            <button className="hero-secondary" onClick={() => setAssistantOpen(true)}>
              Find my watch <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-footnote">
            <span>CURATED REFERENCES</span>
            <span>TIMELESS DESIGN</span>
            <span>YOUR PERSPECTIVE</span>
          </div>
        </div>
        <div className="hero-side-label">THE KYZ EDIT · VOL. 01</div>
      </section>
      <div className="intro-strip">
        <span>A personal approach to horology.</span>
        <p>
          Two iconic houses. Ten distinctive references.
          <br className="desktop-break" /> A little less searching. A little more discovering.
        </p>
        <span className="strip-mark">K.</span>
      </div>
      <section className="section container">
        <div className="section-top">
          <div>
            <p className="eyebrow">THE CONSIDERED COLLECTION</p>
            <h2>Extraordinary, every day.</h2>
          </div>
          <Link className="arrow-link" to="/collections">
            View all watches <ArrowUpRight size={18} />
          </Link>
        </div>
        <CatalogueStatus>
          <div className="watch-grid featured-grid">
            {watches
              .filter((w) => w.featured)
              .slice(0, 3)
              .map((w, i) => (
                <WatchCard watch={w} index={i} key={w.id} />
              ))}
          </div>
        </CatalogueStatus>
        <p className="catalogue-note">
          Illustrative catalogue · USD example prices · Editorial photography may differ from the
          named reference.
        </p>
      </section>
      <section className="discovery-section">
        <div className="container discovery-inner">
          <div>
            <p className="eyebrow light">GO BEYOND THE FIRST IMPRESSION</p>
            <h2>
              A watch for your wrist.
              <br />
              <em>A story of your own.</em>
            </h2>
            <p>
              Start with what matters to you. A style, a detail, a budget.
              <br />
              Our advisor helps you find a considered place to begin.
            </p>
            <button className="button gold" onClick={() => setAssistantOpen(true)}>
              Meet your watch advisor <Sparkles size={17} />
            </button>
          </div>
          <div className="discovery-steps">
            {[
              ['01', 'Discover', 'Browse by brand, style and the details that matter.'],
              ['02', 'Compare', 'See up to three references, side by side.'],
              ['03', 'Make it personal', 'Save a shortlist that stays with you.'],
            ].map(([number, title, description]) => (
              <div key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <ArrowUpRight size={20} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container editorial">
        <div className="editorial-photo">
          <img
            src="/images/calatrava.jpg"
            alt="Watch photography highlighting a considered, timeless design"
            loading="lazy"
            width="1000"
            height="1000"
          />
        </div>
        <div>
          <p className="eyebrow">BUILT WITH PURPOSE</p>
          <h2>
            Behind every detail,
            <br />
            <em>a little curiosity.</em>
          </h2>
          <p>
            KYZ began as my university project. Today, it is an exploration of how thoughtful
            design, useful data and reliable software can bring a collection to life.
          </p>
          <Link to="/about" className="arrow-link">
            The story behind the project <ArrowUpRight size={18} />
          </Link>
          <span className="signature">
            Khyzer Riaz<span>DESIGN & ENGINEERING</span>
          </span>
        </div>
      </section>
    </>
  );
}

export function Collections({ savedOnly = false }: { savedOnly?: boolean }) {
  const { watches, saved, setAssistantOpen } = useApp();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '',
    brand = params.get('brand') || '',
    style = params.get('style') || '',
    sort = params.get('sort') || 'featured';
  const min = params.get('min') || '',
    max = params.get('max') || '';
  function update(key: string, value: string) {
    // Router renders may be deferred. Read the current URL so rapid changes cannot
    // restore a filter that was just cleared by another navigation.
    const next = new URLSearchParams(window.location.search);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }
  const source = savedOnly ? watches.filter((w) => saved.includes(w.id)) : watches;
  const invalidRange = Boolean(min && max && Number(min) > Number(max));
  const filtered = useMemo(
    () =>
      source
        .filter(
          (w) =>
            (!query ||
              `${w.brand} ${w.name} ${w.details.reference} ${w.features.join(' ')}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!brand || w.brand === brand) &&
            (!style || w.style === style) &&
            (!min || w.price >= Number(min)) &&
            (!max || w.price <= Number(max)),
        )
        .sort((a, b) =>
          sort === 'price-low'
            ? a.price - b.price
            : sort === 'price-high'
              ? b.price - a.price
              : sort === 'name'
                ? a.name.localeCompare(b.name)
                : Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
        ),
    [source, query, brand, style, min, max, sort],
  );
  const active = Boolean(query || brand || style || min || max);
  return (
    <div className="container page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">{savedOnly ? 'A COLLECTION OF YOUR OWN' : 'THE KYZ COLLECTION'}</p>
          <h1>
            {savedOnly ? (
              <>
                Your personal <em>shortlist.</em>
              </>
            ) : (
              <>
                Find your next <em>timepiece.</em>
              </>
            )}
          </h1>
          <p>
            {savedOnly
              ? 'The references that caught your eye. Saved in this browser, ready when you are.'
              : 'Explore distinctive watches from Rolex and Patek Philippe. Take your time. Find your perspective.'}
          </p>
        </div>
        <span className="page-heading-mark">
          {savedOnly ? <Heart size={42} strokeWidth={1} /> : '01—10'}
        </span>
      </div>
      <CatalogueStatus>
        {savedOnly && source.length === 0 ? (
          <EmptyState
            title="Your collection starts with a favourite."
            icon={<Heart size={32} strokeWidth={1} />}
          >
            <p>Tap the heart on any watch to keep it here.</p>
            <Link className="button dark" to="/collections">
              Discover the collection <ArrowRight size={16} />
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="catalogue-layout">
              <aside className="filters" aria-label="Filter watches">
                <div className="filter-title">
                  <h2>
                    <SlidersHorizontal size={16} /> Refine your search
                  </h2>
                  {active && (
                    <button onClick={() => setParams({})} className="text-button">
                      Reset
                    </button>
                  )}
                </div>
                <label htmlFor="catalogue-search">Search the collection</label>
                <input
                  id="catalogue-search"
                  placeholder="Name, reference or feature"
                  value={query}
                  onChange={(e) => update('q', e.target.value)}
                  type="search"
                />
                <label htmlFor="brand-filter">Watchmaker</label>
                <select
                  id="brand-filter"
                  value={brand}
                  onChange={(e) => update('brand', e.target.value)}
                >
                  <option value="">All watchmakers</option>
                  {[...new Set(watches.map((w) => w.brand))].sort().map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
                <label htmlFor="style-filter">Your style</label>
                <select
                  id="style-filter"
                  value={style}
                  onChange={(e) => update('style', e.target.value)}
                >
                  <option value="">All styles</option>
                  {['Dress', 'Diving', 'Sport', 'Travel'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <fieldset>
                  <legend>Budget in USD</legend>
                  <div className="price-inputs">
                    <div>
                      <label htmlFor="min-price">From</label>
                      <input
                        id="min-price"
                        type="number"
                        min="0"
                        max="10000000"
                        placeholder="$0"
                        value={min}
                        onChange={(e) => update('min', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor="max-price">To</label>
                      <input
                        id="max-price"
                        type="number"
                        min="0"
                        max="10000000"
                        placeholder="No limit"
                        value={max}
                        onChange={(e) => update('max', e.target.value)}
                      />
                    </div>
                  </div>
                </fieldset>
                {invalidRange && (
                  <p className="form-error" role="alert">
                    Minimum price must not exceed maximum price.
                  </p>
                )}
                <div className="filter-help">
                  <Sparkles size={18} />
                  <h3>A little guidance?</h3>
                  <p>Tell our advisor what you have in mind.</p>
                  <button className="arrow-link" onClick={() => setAssistantOpen(true)}>
                    Let’s find your watch <ArrowRight size={15} />
                  </button>
                </div>
              </aside>
              <div className="catalogue-results">
                <div className="results-toolbar">
                  <p role="status">
                    <strong>{filtered.length}</strong>{' '}
                    {filtered.length === 1 ? 'timepiece' : 'timepieces'}
                    {active ? ' match your search' : ' to discover'}
                  </p>
                  <div>
                    <label htmlFor="watch-sort">Sort by</label>
                    <select
                      id="watch-sort"
                      value={sort}
                      onChange={(e) => update('sort', e.target.value)}
                    >
                      <option value="featured">The KYZ edit</option>
                      <option value="price-low">Price: low to high</option>
                      <option value="price-high">Price: high to low</option>
                      <option value="name">Name: A–Z</option>
                    </select>
                  </div>
                </div>
                {filtered.length ? (
                  <div className="watch-grid catalogue-grid">
                    {filtered.map((w, i) => (
                      <WatchCard key={w.id} watch={w} index={i} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="A different perspective, perhaps?">
                    <p>No watches match these filters. Try a wider budget or another style.</p>
                    <button className="button dark" onClick={() => setParams({})}>
                      Clear filters <X size={16} />
                    </button>
                  </EmptyState>
                )}
              </div>
            </div>
            <p className="catalogue-note">
              Portfolio demonstration. Example prices in USD, not live quotations. Product
              specifications and images should be verified against the named reference.
            </p>
          </>
        )}
      </CatalogueStatus>
    </div>
  );
}

export function Compare() {
  const { watches, comparison, toggleCompare, clearComparison, openWatch, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const fromLink = params.get('ids');
  const ids =
    fromLink !== null ? [...new Set(fromLink.split(',').filter(Boolean))].slice(0, 3) : comparison;
  const chosen = ids.map((id) => watches.find((w) => w.id === id)).filter((w) => w !== undefined);
  const remove = (id: string) =>
    fromLink !== null
      ? setParams({ ids: ids.filter((v) => v !== id).join(',') })
      : toggleCompare(id);
  async function share() {
    try {
      const url = new URL('/compare', location.origin);
      url.searchParams.set('ids', chosen.map((w) => w.id).join(','));
      await navigator.clipboard.writeText(url.toString());
      notify('Comparison link copied. It works while this website is available.');
    } catch {
      notify('Your browser couldn’t copy the link. You can copy this page’s address instead.');
      setParams({ ids: chosen.map((w) => w.id).join(',') });
    }
  }
  const rows: [string, (w: (typeof chosen)[number]) => string][] = [
    ['Example price (USD)', (w) => money(w.price)],
    ['Watchmaker', (w) => w.brand],
    ['Style', (w) => w.style],
    ['Reference', (w) => w.details.reference],
    ['Movement', (w) => w.details.movement],
    ['Case material', (w) => w.details.case],
    ['Case diameter', (w) => w.details.diameter],
    ['Water resistance', (w) => w.details.waterResistance],
    ['Power reserve', (w) => w.details.powerReserve],
    ['Features', (w) => w.features.join(' · ')],
  ];
  return (
    <div className="container page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE DETAILS MAKE THE DIFFERENCE</p>
          <h1>
            A closer <em>comparison.</em>
          </h1>
          <p>Up to three watches. Every detail, side by side.</p>
        </div>
        <Scale className="page-heading-mark" size={42} strokeWidth={1} />
      </div>
      <CatalogueStatus>
        {chosen.length === 0 ? (
          <EmptyState
            title="Good decisions start with a comparison."
            icon={<Scale size={32} strokeWidth={1} />}
          >
            <p>Add up to three watches using the Compare button in the collection.</p>
            <Link className="button dark" to="/collections">
              Explore watches <ArrowRight size={16} />
            </Link>
          </EmptyState>
        ) : (
          <>
            <div className="comparison-actions">
              <Link to="/collections" className="arrow-link">
                {chosen.length < 3 ? 'Add another watch' : 'Back to collection'}{' '}
                <ArrowUpRight size={16} />
              </Link>
              <div>
                <button className="text-button" onClick={() => void share()}>
                  Copy comparison link
                </button>
                <button
                  className="text-button"
                  onClick={() => {
                    clearComparison();
                    setParams({});
                  }}
                >
                  Clear all
                </button>
              </div>
            </div>
            <div
              className="table-scroll comparison-scroll"
              tabIndex={0}
              role="region"
              aria-label="Watch specification comparison; scroll horizontally on small screens"
            >
              <table className="comparison-table">
                <caption className="sr-only">
                  Comparison of selected watch specifications and example USD prices
                </caption>
                <thead>
                  <tr>
                    <th scope="col">The finer details</th>
                    {chosen.map((w) => (
                      <th key={w.id} scope="col">
                        <button
                          className="compare-remove icon-button"
                          onClick={() => remove(w.id)}
                          aria-label={`Remove ${w.name} from this comparison`}
                        >
                          <X size={16} />
                        </button>
                        <button className="comparison-watch" onClick={() => openWatch(w)}>
                          <img
                            src={w.image}
                            alt={`${w.name} illustrative photography`}
                            width="300"
                            height="300"
                          />
                          <span className="eyebrow">{w.brand}</span>
                          <strong>{w.name}</strong>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([title, value]) => (
                    <tr key={title}>
                      <th scope="row">{title}</th>
                      {chosen.map((w) => (
                        <td key={w.id}>{value(w)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="catalogue-note">
              Illustrative specifications and prices. Water-resistance ratings are not a substitute
              for manufacturer guidance. Editorial images may differ from reference.
            </p>
          </>
        )}
      </CatalogueStatus>
    </div>
  );
}

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}
export function InsightsPage() {
  const { watches } = useApp();
  const [insights, setInsights] = useState<Insights | null>(null),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [watchId, setWatchId] = useState('submariner-date'),
    [history, setHistory] = useState<History | null>(null),
    [historyError, setHistoryError] = useState('');
  useEffect(() => {
    const c = new AbortController();
    setError('');
    api<Insights>('/api/insights', { signal: c.signal })
      .then(setInsights)
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [attempt]);
  useEffect(() => {
    if (!watches.length) return;
    const c = new AbortController();
    setHistory(null);
    setHistoryError('');
    const id = watches.some((w) => w.id === watchId) ? watchId : watches[0].id;
    api<History>(`/api/watches/${id}/history`, { signal: c.signal })
      .then(setHistory)
      .catch((e) => {
        if (!c.signal.aborted) setHistoryError(e.message);
      });
    return () => c.abort();
  }, [watchId, watches]);
  function download() {
    const content =
      '\uFEFF' +
      [
        ['Source', 'Brand', 'Name', 'Reference', 'Style', 'Example price (USD)'],
        ...watches.map((w) => [
          'Illustrative demo snapshot',
          w.brand,
          w.name,
          w.details.reference,
          w.style,
          w.price,
        ]),
      ]
        .map((row) => row.map(csvCell).join(','))
        .join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kyz-illustrative-catalogue.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="container page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A DIFFERENT LENS</p>
          <h1>
            Behind the <em>numbers.</em>
          </h1>
          <p>Explore the shape of our collection, one data point at a time.</p>
        </div>
        <MoveUpRight className="page-heading-mark" size={42} strokeWidth={1} />
      </div>
      <div className="data-notice">
        <span className="data-badge">Demonstration dataset</span>
        <p>
          Catalogue prices are illustrative snapshots. Monthly series are synthetically generated
          examples for this portfolio, not observed market data or investment advice.
        </p>
      </div>
      {error ? (
        <EmptyState title="Insights couldn’t load">
          <p>{error}</p>
          <button className="button dark" onClick={() => setAttempt((a) => a + 1)}>
            Try again
          </button>
        </EmptyState>
      ) : !insights ? (
        <p className="loading-text" role="status">
          Preparing collection insights…
        </p>
      ) : insights.count === 0 ? (
        <EmptyState title="There are no watches to analyse.">
          <p>Add a reference through the catalogue studio.</p>
        </EmptyState>
      ) : (
        <>
          <div className="metric-row">
            {[
              ['References', String(insights.count), 'across the catalogue'],
              [
                'Median example price',
                compactMoney(insights.median ?? 0),
                'USD · midpoint of the collection',
              ],
              [
                'Entry example price',
                compactMoney(insights.min ?? 0),
                'USD · lowest catalogue price',
              ],
              ['Watchmakers', String(insights.brands.length), 'represented in the collection'],
            ].map(([label, value, note]) => (
              <div key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                <span>{note}</span>
              </div>
            ))}
          </div>
          <div className="insight-grid">
            <section className="insight-panel">
              <p className="eyebrow">COLLECTION COMPOSITION</p>
              <h2>Two houses. Different perspectives.</h2>
              <p className="muted small">Mean example catalogue price by watchmaker (USD).</p>
              <div className="brand-bars">
                {insights.brands.map((b) => (
                  <div key={b.brand}>
                    <div>
                      <span>
                        {b.brand}
                        <small>{b.count} references</small>
                      </span>
                      <strong>{money(Math.round(b.average))}</strong>
                    </div>
                    <div className="bar-track">
                      <span
                        style={{
                          width: `${(b.average / Math.max(...insights.brands.map((item) => item.average))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="chart-caption">
                Source: illustrative catalogue snapshot · Mean of listed prices · USD
              </p>
            </section>
            <section className="insight-panel style-panel">
              <p className="eyebrow">A MATTER OF TASTE</p>
              <h2>Something for every day.</h2>
              <p className="muted small">Count of references by watch style.</p>
              <div className="style-stats">
                {insights.styles.map((s) => (
                  <div key={s.style}>
                    <span>{s.style}</span>
                    <div>
                      <strong>{s.count}</strong>
                      <small>{Math.round((s.count / insights.count) * 100)}% of collection</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <section className="insight-panel history-panel">
            <div className="section-top">
              <div>
                <p className="eyebrow">EXPLORING A TIME SERIES</p>
                <h2>An illustrative year.</h2>
              </div>
              <div className="chart-select">
                <label htmlFor="history-watch">Watch reference</label>
                <select
                  id="history-watch"
                  value={watches.some((w) => w.id === watchId) ? watchId : watches[0]?.id}
                  onChange={(e) => setWatchId(e.target.value)}
                >
                  {watches.map((w) => (
                    <option value={w.id} key={w.id}>
                      {w.brand} {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {historyError ? (
              <p role="alert">{historyError}</p>
            ) : history ? (
              <PriceChart
                history={history}
                name={watches.find((w) => w.id === watchId)?.name ?? 'Selected watch'}
              />
            ) : (
              <p role="status">Loading example series…</p>
            )}
          </section>
          <div className="insights-method">
            <div>
              <p className="eyebrow">TRANSPARENT BY DESIGN</p>
              <h2>A dataset you can explore.</h2>
              <p>
                Median, range and group averages are computed from the database. The fixed example
                series makes charts reproducible. No live market feed, valuations or forecasting
                model is connected.
              </p>
              <Link to="/about" className="arrow-link">
                Read the methodology <ArrowUpRight size={16} />
              </Link>
            </div>
            <button className="button outline" onClick={download}>
              <Download size={17} /> Export catalogue CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function About() {
  return (
    <div className="container page-content about-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PERSON BEHIND THE PROJECT</p>
          <h1>
            Built with curiosity.
            <br />
            <em>Refined with purpose.</em>
          </h1>
          <p>A software engineering portfolio by Khyzer Riaz.</p>
        </div>
        <span className="page-heading-mark">K.</span>
      </div>
      <div className="about-story">
        <div className="about-image">
          <img
            src="/images/hero.jpg"
            alt="The intricate workings of a mechanical watch"
            width="1000"
            height="1000"
            loading="lazy"
          />
        </div>
        <div>
          <p className="eyebrow">FROM UNIVERSITY PROJECT TO KYZ</p>
          <h2>
            Good work is
            <br />
            always evolving.
          </h2>
          <p>
            I originally built KYZ JEWELLERS as a university website project. This version develops
            that foundation into a complete watch discovery experience, with a persistent catalogue,
            comparisons, saved watches and a more dependable advisor.
          </p>
          <p>
            It brings together the parts of software I enjoy: a thoughtful interface, clear data,
            and the engineering that makes everything work behind the scenes.
          </p>
          <a
            className="arrow-link"
            href="https://www.linkedin.com/in/khyzer-riaz-56b143360"
            target="_blank"
            rel="noreferrer"
          >
            Connect with me on LinkedIn <ArrowUpRight size={17} />
          </a>
        </div>
      </div>
      <section className="about-engineering">
        <p className="eyebrow">MORE THAN WHAT MEETS THE EYE</p>
        <h2>Considered from the inside out.</h2>
        <div className="engineering-grid">
          {[
            [
              Code2,
              'The experience',
              'React and TypeScript power responsive browsing, accessible dialogs, shareable filters and comparisons.',
            ],
            [
              Database,
              'The foundation',
              'An Express API reads and writes a SQLite catalogue with validated inputs, prepared queries and protected editing.',
            ],
            [
              Sparkles,
              'The advisor',
              'Budget and brand constraints are enforced by catalogue logic. Optional server-side AI adds general watch explanations; fallback mode stays clearly labelled.',
            ],
            [
              Workflow,
              'The delivery',
              'Automated regression tests, browser checks and a reproducible container support a consistent build and deployment process.',
            ],
          ].map(([Icon, title, text]) => {
            const Component = Icon as typeof Code2;
            return (
              <article key={String(title)}>
                <Component size={22} strokeWidth={1.4} />
                <h3>{String(title)}</h3>
                <p>{String(text)}</p>
              </article>
            );
          })}
        </div>
      </section>
      <section className="methodology">
        <div>
          <ShieldCheck size={30} strokeWidth={1.2} />
          <h2>Clarity comes first.</h2>
          <p>
            This is an independent portfolio demonstration, not a retailer, authorised dealer or
            investment service. It has no affiliation with Rolex or Patek Philippe.
          </p>
        </div>
        <div>
          <h3>About the catalogue</h3>
          <p>
            The ten original watch records are retained as illustrative examples. Prices are sample
            USD figures from the original project and are not current quotations. Specifications are
            unverified examples; always check the exact reference with its manufacturer. Photography
            is editorial and may show a different model.
          </p>
          <h3>About the charts</h3>
          <p>
            Each seeded watch has a distinct synthetic monthly series for January–December 2025.
            These values are generated from a fixed formula anchored to its sample price. Statistics
            describe this small demonstration catalogue and should not be generalised to the watch
            market.
          </p>
          <h3>About the assistant and your data</h3>
          <p>
            Catalogue matching runs on the server and does not train a machine-learning model.
            Optional AI answers use the configured OpenAI model for general watch questions. If
            enabled, those questions are sent to OpenAI with response storage disabled; provider
            retention policies still apply. Conversation history stays in memory and can be cleared.
            Saved watches stay in this browser’s local storage.
          </p>
          <h3>About access</h3>
          <p>
            The catalogue studio uses a private access key. Saved watches do not require an account
            and do not sync across devices. This project does not collect payments or personal
            customer details.
          </p>
        </div>
      </section>
      <Link to="/collections" className="button dark">
        Back to discovering <ArrowRight size={16} />
      </Link>
    </div>
  );
}
export function NotFound() {
  return (
    <div className="container page-content">
      <EmptyState title="This page has slipped out of time." icon={<Bookmark size={32} />}>
        <p>The link may have changed. There’s still plenty to discover.</p>
        <Link className="button dark" to="/">
          Back to KYZ <ArrowRight size={16} />
        </Link>
      </EmptyState>
    </div>
  );
}
