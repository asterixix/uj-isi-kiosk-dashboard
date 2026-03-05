import { useState, useEffect } from 'react';
import type { NewsItem } from '../types';

export function useStudentNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/student-news');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: NewsItem[] = await res.json();
        setNews(data);
        setError(false);
      } catch {
        setError(true);
      }
    };

    fetchNews();

    const id = setInterval(fetchNews, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return { news, error };
}
