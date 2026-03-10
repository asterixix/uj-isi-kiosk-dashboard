import './TargiNewsTicker.css';

const TARGI_NEWS_ITEMS = [
  'WYKŁADY OTWARTE (Aula Duża A, parter)',
  'PUNKT INFORMACYJNO-REKRUTACYJNY (Hall, parter) – przedstawiciele Działu Rekrutacji na Studia odpowiedzą na wszystkie pytania związane z rekrutacją na studia, udzielą informacji o zasadach kwalifikacji, limitach przyjęć, harmonogramie rekrutacji, sposobie rejestracji na studia i na temat uwzględniania osiągnięć w olimpiadach ogólnopolskich i konkursach. Dodatkowe spotkania: 9:00 (Aula Duża A) oraz 12:00 (Aula Duża B).',
  'STOISKA 16 WYDZIAŁÓW (Sala Wystawowa, II piętro) – bezpośrednia rozmowa ze studentami i pracownikami naukowymi oraz zapoznanie się z ofertą edukacyjną Wydziałów.',
  'STOISKA ORGANIZACJI STUDENCKICH (Hall I i II piętro) I JEDNOSTEK UJ (Sala Seminaryjna, II piętro) – kultura, zdrowie i rekreacja, rozwijanie pasji – poznaj bogatą ofertę UJ poza aulami wykładowymi.',
  'PREZENTACJE WYDZIAŁÓW (Aula Duża A i B, Aula Średnia A i B, Aula Mała) – prezentacje poszczególnych Wydziałów w formie multimedialnej, filmów i dyskusji.',
  'WYDARZENIA TOWARZYSZĄCE NA WYDZIAŁACH',
];

export function TargiNewsTicker() {
  const content = TARGI_NEWS_ITEMS.join(' • ') + ' • ';

  return (
    <div className="targi-news-ticker">
      <div className="targi-ticker-wrap">
        <div className="targi-ticker-move">
          <div className="targi-ticker-item">{content}</div>
          <div className="targi-ticker-item" aria-hidden="true">{content}</div>
        </div>
      </div>
    </div>
  );
}
