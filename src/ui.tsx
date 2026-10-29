import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Heart,
  Plus,
  X,
  ArrowUpRight,
  Sparkles,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useApp } from './state';
import { api, money, compactMoney, type Watch, type History, type ChatReply } from './types';

export function WatchImage({ watch, priority = false }: { watch: Watch; priority?: boolean }) {
  return (
    <img
      src={watch.image}
      alt={`${watch.brand} ${watch.name} — illustrative watch photography`}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width="1000"
      height="1000"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith('/images/hero.jpg'))
          e.currentTarget.src = '/images/hero.jpg';
      }}
    />
  );
}
export function WatchCard({ watch, index = 0 }: { watch: Watch; index?: number }) {
  const { saved, toggleSaved, comparison, toggleCompare, openWatch } = useApp();
  return (
    <article className="watch-card">
      <div className="watch-image-wrap">
        <button
          className="image-link"
          onClick={() => openWatch(watch)}
          aria-label={`View ${watch.brand} ${watch.name}`}
        >
          <WatchImage watch={watch} priority={index < 3} />
        </button>
        <span className="image-tag">{watch.style}</span>
        <button
          className={`save-button ${saved.includes(watch.id) ? 'is-saved' : ''}`}
          onClick={() => toggleSaved(watch.id)}
          aria-label={`${saved.includes(watch.id) ? 'Unsave' : 'Save'} ${watch.name}`}
          aria-pressed={saved.includes(watch.id)}
        >
          <Heart size={18} fill={saved.includes(watch.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="watch-card-body">
        <p className="eyebrow">{watch.brand}</p>
        <button className="text-button watch-name" onClick={() => openWatch(watch)}>
          {watch.name}
          <ArrowUpRight size={18} />
        </button>
        <p className="watch-reference">
          Ref. {watch.details.reference} <span>·</span> {watch.details.diameter}
        </p>
        <div className="card-bottom">
          <span className="card-price">
            {money(watch.price)} <small>USD · demo</small>
          </span>
          <button
            className={`compare-button ${comparison.includes(watch.id) ? 'selected' : ''}`}
            onClick={() => toggleCompare(watch.id)}
            aria-label={`${comparison.includes(watch.id) ? 'Remove' : 'Compare'} ${watch.name}`}
            aria-pressed={comparison.includes(watch.id)}
          >
            {comparison.includes(watch.id) ? <Check size={15} /> : <Plus size={15} />} Compare
          </button>
        </div>
      </div>
    </article>
  );
}
export function EmptyState({
  title,
  children,
  icon,
}: {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon}
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function CatalogueStatus({ children }: { children: ReactNode }) {
  const { loading, error, reload } = useApp();
  if (loading)
    return (
      <div className="loading-grid" role="status" aria-label="Loading watches">
        {[1, 2, 3].map((n) => (
          <div className="skeleton" key={n} />
        ))}
        <span className="sr-only">Loading the catalogue…</span>
      </div>
    );
  if (error)
    return (
      <EmptyState title="The catalogue couldn’t load">
        <p>{error}</p>
        <button className="button dark" onClick={reload}>
          <RefreshCw size={16} /> Try again
        </button>
      </EmptyState>
    );
  return children;
}
export function Dialog({
  children,
  onClose,
  label,
  className = '',
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      {children}
    </dialog>
  );
}
export function PriceChart({ history, name }: { history: History; name: string }) {
  const id = useId();
  if (!history.points.length)
    return <p className="muted">There is no example history for this watch.</p>;
  const values = history.points.map((p) => p.price),
    min = Math.min(...values) * 0.97,
    max = Math.max(...values) * 1.03;
  const y = (price: number) => 140 - ((price - min) / (max - min || 1)) * 110;
  const coordinates = values.map(
    (price, i) => `${58 + (i / Math.max(1, values.length - 1)) * 470},${y(price)}`,
  );
  return (
    <div className="price-chart">
      <svg viewBox="0 0 560 180" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
        <title id={`${id}-title`}>{name}: synthetic monthly price examples in USD</title>
        <desc id={`${id}-desc`}>
          Illustrative January to December 2025 series, from {money(values[0])} to{' '}
          {money(values.at(-1)!)}. Not real market observations. Values are available below.
        </desc>
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1="58" x2="528" y1={y(v)} y2={y(v)} stroke="currentColor" opacity=".13" />
            <text x="2" y={y(v) + 4} className="chart-label">
              {compactMoney(v)}
            </text>
          </g>
        ))}
        <path
          d={`M${coordinates.join(' L')} L528,140 L58,140 Z`}
          fill="currentColor"
          opacity=".07"
        />
        <polyline
          points={coordinates.join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <text x="58" y="163" className="chart-label">
          Jan 2025
        </text>
        <text x="458" y="163" className="chart-label">
          Dec 2025
        </text>
      </svg>
      <p className="chart-caption">USD · Month · Synthetic example, Jan–Dec 2025</p>
      <details>
        <summary>View monthly values</summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Month (2025)</th>
                <th scope="col">Example price (USD)</th>
              </tr>
            </thead>
            <tbody>
              {history.points.map((p) => (
                <tr key={p.date}>
                  <th scope="row">
                    {new Date(p.date + 'T00:00:00Z').toLocaleDateString('en-US', {
                      month: 'long',
                      timeZone: 'UTC',
                    })}
                  </th>
                  <td>{money(p.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
export function WatchDetails() {
  const { selected: watch, closeWatch, saved, toggleSaved, comparison, toggleCompare } = useApp();
  const [history, setHistory] = useState<History | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    if (!watch) return;
    const controller = new AbortController();
    setHistory(null);
    setError('');
    api<History>(`/api/watches/${watch.id}/history`, { signal: controller.signal })
      .then(setHistory)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [watch]);
  if (!watch) return null;
  const specs = [
    ['Reference', watch.details.reference],
    ['Movement', watch.details.movement],
    ['Case material', watch.details.case],
    ['Diameter', watch.details.diameter],
    ['Water resistance', watch.details.waterResistance],
    ['Power reserve', watch.details.powerReserve],
  ];
  return (
    <Dialog
      onClose={closeWatch}
      label={`${watch.brand} ${watch.name} details`}
      className="watch-dialog"
    >
      <button
        className="icon-button dialog-close"
        onClick={closeWatch}
        aria-label="Close watch details"
        autoFocus
      >
        <X size={20} />
      </button>
      <div className="detail-layout">
        <div className="detail-photo">
          <WatchImage watch={watch} priority />
          <span>Editorial imagery · may differ from reference</span>
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {watch.brand} / {watch.style}
          </p>
          <h2>{watch.name}</h2>
          <p className="detail-price">
            {money(watch.price)} <small>USD · illustrative price</small>
          </p>
          <p className="muted">{watch.description}</p>
          <div className="detail-actions">
            <button className="button dark" onClick={() => toggleSaved(watch.id)}>
              <Heart size={16} fill={saved.includes(watch.id) ? 'currentColor' : 'none'} />
              {saved.includes(watch.id) ? 'Saved' : 'Save watch'}
            </button>
            <button className="button outline" onClick={() => toggleCompare(watch.id)}>
              {comparison.includes(watch.id) ? <Check size={16} /> : <Plus size={16} />}
              {comparison.includes(watch.id) ? 'In comparison' : 'Compare'}
            </button>
          </div>
          <dl className="spec-list">
            {specs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="feature-tags">
            {watch.features.map((f) => (
              <span key={f}>{f}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="detail-history">
        <div className="section-top">
          <div>
            <p className="eyebrow">The data behind the dial</p>
            <h3>Illustrative price history</h3>
          </div>
          <span className="data-badge">Synthetic data</span>
        </div>
        <p className="muted small">
          A reproducible example series for this watch. These are not observed prices or investment
          forecasts.
        </p>
        {error ? (
          <p role="alert">{error}</p>
        ) : history ? (
          <PriceChart history={history} name={watch.name} />
        ) : (
          <p role="status">Loading example history…</p>
        )}
      </div>
    </Dialog>
  );
}
interface Message {
  role: 'user' | 'assistant';
  text: string;
  ids?: string[];
  mode?: string;
}
const welcome: Message = {
  role: 'assistant',
  text: 'A good watch starts with a few good questions. Tell me your style, preferred brand and budget in USD, and I’ll help you explore this catalogue.',
};
export function Assistant() {
  const { assistantOpen, setAssistantOpen, watches, openWatch, config } = useApp();
  const [messages, setMessages] = useState<Message[]>([welcome]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const end = useRef<HTMLDivElement>(null),
    inFlight = useRef(false),
    controller = useRef<AbortController | null>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'instant', block: 'end' });
  }, [messages, busy]);
  useEffect(() => () => controller.current?.abort(), []);
  async function send(text: string) {
    if (!text.trim() || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setInput('');
    setMessages((previous) => [...previous, { role: 'user', text }]);
    controller.current = new AbortController();
    try {
      const reply = await api<ChatReply>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
        signal: AbortSignal.any([controller.current.signal, AbortSignal.timeout(15000)]),
      });
      setMessages((previous) => [
        ...previous,
        { role: 'assistant', text: reply.reply, ids: reply.recommendations, mode: reply.mode },
      ]);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        setError((e as Error).message);
        setInput(text);
      }
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  if (!assistantOpen) return null;
  return (
    <Dialog
      onClose={() => setAssistantOpen(false)}
      label="Watch advisor"
      className="assistant-dialog"
    >
      <div className="assistant-header">
        <div>
          <span className="eyebrow">A considered recommendation</span>
          <h2>
            Your watch advisor <Sparkles size={18} />
          </h2>
        </div>
        <button
          className="icon-button"
          onClick={() => setAssistantOpen(false)}
          aria-label="Close watch advisor"
          autoFocus
        >
          <X size={20} />
        </button>
      </div>
      <p className="assistant-disclosure">
        {config.aiEnabled
          ? 'Catalogue matching + optional AI explanations'
          : 'Built-in catalogue advisor · no AI connection required'}
        . Sample prices in USD. Questions are not saved to our database.
      </p>
      <div
        className="assistant-messages"
        role="log"
        aria-label="Advisor conversation"
        aria-live="polite"
      >
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.role}`}>
            <span className="message-author">
              {m.role === 'user' ? 'You' : 'KYZ advisor'}
              {m.mode === 'ai'
                ? ' · AI generated'
                : m.mode === 'fallback'
                  ? ' · built-in fallback'
                  : ''}
            </span>
            <p>{m.text}</p>
            {m.ids?.map((id) => {
              const w = watches.find((item) => item.id === id);
              return w ? (
                <button key={id} className="recommendation" onClick={() => openWatch(w)}>
                  <span>
                    {w.brand}
                    <strong>{w.name}</strong>
                  </span>
                  <span>
                    {money(w.price)} <ArrowUpRight size={16} />
                  </span>
                </button>
              ) : null;
            })}
          </div>
        ))}
        {busy && (
          <p className="muted small" role="status">
            Considering your question…
          </p>
        )}
        <div ref={end} />
      </div>
      {messages.length === 1 && (
        <div className="suggestions">
          {['Rolex under $25k', 'Dress watches under $100k', 'What is an automatic movement?'].map(
            (q) => (
              <button key={q} onClick={() => void send(q)}>
                {q}
                <ArrowRight size={14} />
              </button>
            ),
          )}
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <form
        className="assistant-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <label className="sr-only" htmlFor="advisor-question">
          Your watch question
        </label>
        <input
          id="advisor-question"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a watch, style or budget…"
          maxLength={1000}
          disabled={busy}
        />
        <button
          className="icon-button dark"
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Send question"
        >
          <Send size={18} />
        </button>
      </form>
      <div className="assistant-bottom">
        <button
          className="text-button"
          disabled={busy}
          onClick={() => {
            setMessages([welcome]);
            setError('');
          }}
        >
          Clear conversation
        </button>
        <Link to="/about" onClick={() => setAssistantOpen(false)}>
          How it works <ArrowUpRight size={13} />
        </Link>
      </div>
    </Dialog>
  );
}
