import { useState, useEffect } from 'react';

export function useRotation(count: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  return index;
}
