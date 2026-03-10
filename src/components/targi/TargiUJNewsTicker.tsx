import './TargiUJNewsTicker.css';

const ISI_TEXT =
  'Studia pierwszego i drugiego stopnia w Instytucie Studiów Informacyjnych na kierunku zarządzanie informacją, to studia dla wszystkich osób o szerokich horyzontach, podczas których wiedza o relacjach między człowiekiem i informacją, a także osiągnięcia nauk o komunikacji społecznej i mediach oraz innych dyscyplin łączone są z kształceniem umiejętności praktycznych i rozwijaniem kompetencji niezbędnych do profesjonalnego zarządzania informacją w różnych kontekstach zawodowych.';

const ANNOTATION = 'Dowiedz się więcej na isi.uj.edu.pl';

export function TargiUJNewsTicker() {
  const content = `${ISI_TEXT}  ·  ${ANNOTATION}  ·  `;

  return (
    <div className="targi-uj-news-ticker">
      <div className="targi-uj-ticker-wrap">
        <div className="targi-uj-ticker-move">
          <div className="targi-uj-ticker-item">{content}</div>
          <div className="targi-uj-ticker-item" aria-hidden="true">{content}</div>
        </div>
      </div>
    </div>
  );
}
