import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, Plus, Save, Trash2, LogOut, X, ArrowRight } from 'lucide-react';
import { useApp } from './state';
import { api, money, type Watch } from './types';
import { EmptyState } from './ui';

const blank = (): Watch => ({
  id: '',
  name: '',
  brand: '',
  collection: 'Independent edit',
  style: 'Dress',
  price: 1000,
  currency: 'USD',
  image: '/images/hero.jpg',
  description: '',
  features: [],
  diameterMm: 40,
  waterResistanceM: 30,
  powerReserveH: 48,
  featured: false,
  details: {
    reference: '',
    movement: '',
    case: '',
    diameter: '40mm',
    waterResistance: '30 meters',
    powerReserve: '48 hours',
  },
});
export default function Studio() {
  const { watches, reload, notify, config } = useApp();
  const [key, setKey] = useState(''),
    [token, setToken] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<Watch | null>(null),
    [deleting, setDeleting] = useState('');
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/admin/session', { headers: { Authorization: `Bearer ${key}` } });
      setToken(key);
      setKey('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const value = (name: string) => String(form.get(name) || '').trim();
    const watch = {
      ...editing,
      name: value('name'),
      brand: value('brand'),
      collection: value('collection'),
      style: value('style'),
      price: Number(value('price')),
      image: value('image'),
      description: value('description'),
      features: value('features')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      diameterMm: Number(value('diameterMm')),
      waterResistanceM: Number(value('waterResistanceM')),
      powerReserveH: Number(value('powerReserveH')),
      featured: form.get('featured') === 'on',
      details: {
        reference: value('reference'),
        movement: value('movement'),
        case: value('case'),
        diameter: `${value('diameterMm')}mm`,
        waterResistance: `${value('waterResistanceM')} meters`,
        powerReserve: `${value('powerReserveH')} hours`,
      },
    };
    try {
      await api(editing.id ? `/api/admin/watches/${editing.id}` : '/api/admin/watches', {
        method: editing.id ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(watch),
      });
      setEditing(null);
      reload();
      notify(editing.id ? 'Watch updated.' : 'Watch added to the catalogue.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError('');
    try {
      await api(`/api/admin/watches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleting('');
      reload();
      notify('Watch removed from the catalogue.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (!config.adminEnabled) {
    return (
      <div className="container page-content">
        <EmptyState title="Catalogue editing is private." icon={<LockKeyhole size={30} />}>
          <p>This public demonstration is for discovering, saving and comparing watches.</p>
          <Link className="button dark" to="/collections">
            Explore the collection <ArrowRight size={16} />
          </Link>
        </EmptyState>
      </div>
    );
  }
  return (
    <div className="container page-content studio-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">BEHIND THE COLLECTION</p>
          <h1>
            Catalogue <em>studio.</em>
          </h1>
          <p>A private space to curate the KYZ demonstration catalogue.</p>
        </div>
        <LockKeyhole className="page-heading-mark" size={36} strokeWidth={1} />
      </div>
      {!token ? (
        <form className="studio-login" onSubmit={(e) => void login(e)}>
          <LockKeyhole size={28} strokeWidth={1.2} />
          <h2>For the curator.</h2>
          <p>Enter your private studio access key. Access is kept in memory for this visit only.</p>
          <label htmlFor="studio-key">Private access key</label>
          <input
            id="studio-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
            minLength={16}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button dark" disabled={busy}>
            {busy ? 'Checking access…' : 'Enter the studio'} <ArrowRight size={16} />
          </button>
          <details>
            <summary>First time setting up?</summary>
            <p>
              Run <code>npm run setup</code> in the project folder, restart the server, then run{' '}
              <code>npm run admin-key</code> to view your private key. Keep it out of screenshots
              and source control.
            </p>
          </details>
        </form>
      ) : (
        <>
          <div className="studio-toolbar">
            <p>{watches.length} references · Example prices in USD</p>
            <div>
              <button
                className="button outline"
                onClick={() => {
                  setEditing(blank());
                  setError('');
                }}
              >
                <Plus size={16} /> Add reference
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setToken('');
                  setEditing(null);
                  setDeleting('');
                  setError('');
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {editing ? (
            <form key={editing.id || 'new'} className="studio-form" onSubmit={(e) => void save(e)}>
              <div className="section-top">
                <h2>{editing.id ? 'Edit reference' : 'Add a reference'}</h2>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Cancel editing"
                  onClick={() => {
                    setEditing(null);
                    setError('');
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="form-grid">
                {(
                  [
                    ['name', 'Watch name', editing.name],
                    ['brand', 'Watchmaker', editing.brand],
                    ['collection', 'Collection', editing.collection],
                    ['reference', 'Reference', editing.details.reference],
                    ['movement', 'Movement', editing.details.movement],
                    ['case', 'Case material', editing.details.case],
                  ] as const
                ).map(([name, label, value]) => (
                  <div key={name}>
                    <label htmlFor={`edit-${name}`}>{label}</label>
                    <input
                      id={`edit-${name}`}
                      name={name}
                      defaultValue={value}
                      maxLength={160}
                      required
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="edit-style">Style</label>
                  <select id="edit-style" name="style" defaultValue={editing.style}>
                    {['Dress', 'Sport', 'Diving', 'Travel'].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {(
                  [
                    ['price', 'Example price (USD)', editing.price, 10000000],
                    ['diameterMm', 'Case diameter (mm)', editing.diameterMm, 100],
                    ['waterResistanceM', 'Water resistance (m)', editing.waterResistanceM, 20000],
                    ['powerReserveH', 'Power reserve (hours)', editing.powerReserveH, 1000],
                  ] as const
                ).map(([name, label, value, max]) => (
                  <div key={name}>
                    <label htmlFor={`edit-${name}`}>{label}</label>
                    <input
                      id={`edit-${name}`}
                      name={name}
                      type="number"
                      min="0.01"
                      step="any"
                      max={max}
                      defaultValue={value}
                      required
                    />
                  </div>
                ))}
              </div>
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                name="description"
                defaultValue={editing.description}
                rows={3}
                maxLength={1200}
                required
              />
              <label htmlFor="edit-features">Features (separate with commas, up to 12)</label>
              <input
                id="edit-features"
                name="features"
                defaultValue={editing.features.join(', ')}
              />
              <label htmlFor="edit-image">Image path or full HTTPS image URL</label>
              <input
                id="edit-image"
                name="image"
                defaultValue={editing.image}
                maxLength={1000}
                required
              />
              <label className="checkbox-label">
                <input type="checkbox" name="featured" defaultChecked={editing.featured} /> Include
                in the homepage edit
              </label>
              <p className="muted small">
                Changing the example price does not rewrite the fixed synthetic history. New
                references start without a history series.
              </p>
              <div className="form-actions">
                <button className="button dark" disabled={busy}>
                  <Save size={16} />
                  {busy ? 'Saving…' : 'Save reference'}
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => setEditing(null)}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="studio-list">
              {watches.map((w) => (
                <article key={w.id}>
                  <img src={w.image} alt="" width="72" height="72" />
                  <div>
                    <span className="eyebrow">{w.brand}</span>
                    <h2>{w.name}</h2>
                    <span className="muted small">
                      {w.details.reference} · {money(w.price)}
                    </span>
                  </div>
                  {deleting === w.id ? (
                    <div className="delete-confirm">
                      <p>Remove this reference and its example history?</p>
                      <button
                        className="button danger"
                        disabled={busy}
                        onClick={() => void remove(w.id)}
                      >
                        Confirm removal
                      </button>
                      <button className="text-button" onClick={() => setDeleting('')}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="studio-row-actions">
                      <button
                        className="button outline"
                        onClick={() => {
                          setEditing(w);
                          setError('');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${w.name}`}
                        onClick={() => setDeleting(w.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
