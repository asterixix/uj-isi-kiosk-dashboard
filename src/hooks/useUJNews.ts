import { useState, useEffect } from 'react';
import type { UJNewsItem } from '../types';

const FETCH_INTERVAL_MS = 60 * 60 * 1000;

export function useUJNews(): { news: UJNewsItem[]; error: boolean } {
  const [news, setNews] = useState<UJNewsItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchNews() {
      try {
        const response = await fetch('/api/uj-news');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as UJNewsItem[];
        setNews(data);
        setError(false);
      } catch {
        setError(true);
      }
    }

    fetchNews();
    const interval = setInterval(fetchNews, FETCH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return { news, error };
}
