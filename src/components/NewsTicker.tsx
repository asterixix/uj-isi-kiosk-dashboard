import type { NewsItem } from '../types';
import './NewsTicker.css';

interface NewsTickerProps {
  news: NewsItem[];
  error: boolean;
}

export const NewsTicker = ({ news, error }: NewsTickerProps) => {
  const fallbackText = 'Witaj na Uniwersytecie Jagiellońskim! Życzymy udanego dnia.';
  let displayItems = news.map((item) => item.text);

  if (displayItems.length === 0 || error) {
    displayItems = [fallbackText];
  }

  const content = displayItems.join(' • ') + ' • ';

  return (
    <div className="news-ticker">
      <div className="ticker-wrap">
        <div className="ticker-move">
          <div className="ticker-item">{content}</div>
          <div className="ticker-item" aria-hidden="true">{content}</div>
        </div>
      </div>
    </div>
  );
};
