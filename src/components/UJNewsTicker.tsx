import type { UJNewsItem } from '../types';
import './UJNewsTicker.css';

const MORE_SUFFIX = 'Więcej wydarzeń w kalendarzu UJ: uj.edu.pl/kalendarz';

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

  const entries = news.map((item) => `${item.date} · ${item.title}`);
  const content = [...entries, MORE_SUFFIX].join(' | ') + ' | ';

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
