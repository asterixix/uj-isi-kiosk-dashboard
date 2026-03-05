import type { UJNewsItem } from '../types';
import './UJNewsTicker.css';

const MORE_SUFFIX = 'Więcej przeczytasz na uj.edu.pl/wiadomosci';
const MAX_TITLES = 3;

interface UJNewsTickerProps {
  news: UJNewsItem[];
  error: boolean;
}

export const UJNewsTicker = ({ news, error }: UJNewsTickerProps) => {
  const fallbackText = MORE_SUFFIX;

  if (error || news.length === 0) {
    return (
      <div className="uj-news-ticker">
        <div className="uj-ticker-wrap">
          <div className="uj-ticker-move">
            <div className="uj-ticker-item">{fallbackText}</div>
            <div className="uj-ticker-item" aria-hidden="true">{fallbackText}</div>
          </div>
        </div>
      </div>
    );
  }

  const titles = news.slice(0, MAX_TITLES).map((item) => item.title);
  const content = [...titles, MORE_SUFFIX].join(' | ') + ' | ';

  return (
    <div className="uj-news-ticker">
      <div className="uj-ticker-wrap">
        <div className="uj-ticker-move">
          <div className="uj-ticker-item">{content}</div>
          <div className="uj-ticker-item" aria-hidden="true">{content}</div>
        </div>
      </div>
    </div>
  );
};
