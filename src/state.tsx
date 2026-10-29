import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type Watch } from './types';

function readSaved(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem('kyz.saved.v1') || '[]');
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string').slice(0, 500)
      : [];
  } catch {
    return [];
  }
}
interface State {
  watches: Watch[];
  loading: boolean;
  error: string;
  reload: () => void;
  saved: string[];
  toggleSaved: (id: string) => void;
  comparison: string[];
  toggleCompare: (id: string) => void;
  clearComparison: () => void;
  selected: Watch | null;
  openWatch: (watch: Watch) => void;
  closeWatch: () => void;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  toast: string;
  notify: (message: string) => void;
  config: { aiEnabled: boolean; adminEnabled: boolean };
}
const Context = createContext<State | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [watches, setWatches] = useState<Watch[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0),
    [saved, setSaved] = useState(readSaved),
    [comparison, setComparison] = useState<string[]>([]);
  const [selected, setSelected] = useState<Watch | null>(null),
    [assistantOpen, setAssistantOpen] = useState(false),
    [toast, setToast] = useState('');
  const [config, setConfig] = useState({ aiEnabled: false, adminEnabled: false });
  const notify = useCallback((message: string) => setToast(message), []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api<{ watches: Watch[] }>('/api/watches', { signal: controller.signal })
      .then((data) => setWatches(data.watches))
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    api<typeof config>('/api/config', { signal: controller.signal })
      .then(setConfig)
      .catch(() => {});
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const handler = () => setSaved(readSaved());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((item) => item !== id) : [...saved, id];
    try {
      localStorage.setItem('kyz.saved.v1', JSON.stringify(next));
      setSaved(next);
      notify(
        next.includes(id) ? 'Added to your saved watches.' : 'Removed from your saved watches.',
      );
    } catch {
      notify('This browser couldn’t save your selection. Check its storage settings.');
    }
  };
  const toggleCompare = (id: string) => {
    if (comparison.includes(id)) setComparison(comparison.filter((item) => item !== id));
    else if (comparison.length >= 3)
      notify('Compare up to three watches. Remove one to add another.');
    else {
      setComparison([...comparison, id]);
      notify('Added to comparison.');
    }
  };
  return (
    <Context.Provider
      value={{
        watches,
        loading,
        error,
        reload: () => setAttempt((n) => n + 1),
        saved,
        toggleSaved,
        comparison,
        toggleCompare,
        clearComparison: () => setComparison([]),
        selected,
        openWatch: (w) => {
          setAssistantOpen(false);
          setSelected(w);
        },
        closeWatch: () => setSelected(null),
        assistantOpen,
        setAssistantOpen,
        toast,
        notify,
        config,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const state = useContext(Context);
  if (!state) throw new Error('Missing application provider');
  return state;
}
