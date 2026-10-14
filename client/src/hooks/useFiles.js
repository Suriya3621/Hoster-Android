import { useEffect, useState, useCallback, useMemo } from 'react';
import { api } from '../services/api';

/**
 * Loads the listing for a virtual path, plus client-side sort/filter that
 * keep the UI snappy without re-hitting the server for every reorder.
 */
export function useFiles(virtualPath, { category = null } = {}) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name'); // name | size | modified | type
  const [sortDir, setSortDir] = useState('asc');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listFiles(virtualPath);
      setEntries(data.entries || []);
    } catch (err) {
      setError(err.message || 'Failed to load files.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [virtualPath]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    let list = entries;
    if (category) {
      list = list.filter((e) => e.isDirectory || e.category === category);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      switch (sortBy) {
        case 'size':
          return ((a.size || 0) - (b.size || 0)) * dir;
        case 'modified':
          return (new Date(a.modified || 0) - new Date(b.modified || 0)) * dir;
        case 'type':
          return (a.extension || '').localeCompare(b.extension || '') * dir;
        default:
          return a.name.localeCompare(b.name, undefined, { numeric: true }) * dir;
      }
    });
  }, [entries, category, sortBy, sortDir]);

  return { entries: visible, rawEntries: entries, loading, error, reload: load, sortBy, setSortBy, sortDir, setSortDir };
}
