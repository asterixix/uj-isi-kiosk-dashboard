export const KOLO_FORM_URL = 'https://forms.cloud.microsoft/e/BK6NYkxNuj';

export interface InfoTask {
  id: string;
  title: string;
  time: string;
  story: string;
  asks: string[];
  hints: string[];
  answers: string[];
}

export const TASKS: InfoTask[] = [
  {
    id: 'polandball',
    title: 'Kulka, która podbiła internet',
    time: '3-5 min',
    story:
      'Polandball to jeden z najbardziej znanych polskich memów na świecie. Zanim powstał pierwszy komiks, polscy internauci w 2009 roku wspólnymi siłami „zajęli” pewną stronę internetową.',
    asks: [
      'Jak nazywała się strona, którą zajęli Polacy?',
      'Na jakim forum opublikowano pierwszy komiks z Polandballem?',
      'Pod jakim pseudonimem występował jego autor?',
    ],
    hints: [
      'Zacznij od hasła „Polandball” w Wikipedii, najlepiej w wersji angielskiej. Szukaj części o historii.',
      'Na tej stronie wszyscy rysowali na jednym, wspólnym kole. Jej nazwa zawiera słowo „ball”.',
      'Chcesz zobaczyć tę stronę na własne oczy? Wpisz jej adres w Wayback Machine: web.archive.org',
    ],
    answers: [
      'Drawball.com',
      'Krautchan, niemiecki imageboard (anglojęzyczny dział /int/)',
      'FALCO, użytkownik z Wielkiej Brytanii. Komiks wyśmiewał polskiego użytkownika o nicku WOJAK.',
    ],
  },
  {
    id: 'ela',
    title: 'Tego Google Ci nie powie',
    time: '5 min',
    story:
      'Część danych w internecie nie istnieje jako gotowe strony. Powstają dopiero wtedy, gdy wybierzesz opcje w formularzu, więc wyszukiwarka ich nie widzi. To jest właśnie ukryta sieć (deep web), a nie tajemniczy Tor.',
    asks: [
      'Ilu absolwentów studiów I stopnia na kierunku Zarządzanie informacją UJ odnotowano w roku 2024?',
      'Jaki procent z nich kontynuował naukę po uzyskaniu dyplomu?',
    ],
    hints: [
      'Ministerstwo nauki prowadzi system, który śledzi losy absolwentów wszystkich polskich uczelni na podstawie danych z ZUS.',
      'Ten system nazywa się ELA (Ekonomiczne Losy Absolwentów): ela.nauka.gov.pl',
      'Wybierz uczelnię, kierunek i poziom studiów. Liczba absolwentów i dalsza nauka są w osobnych sekcjach raportu.',
    ],
    answers: [
      '61 absolwentów (rocznik 2024)',
      '80,3% kontynuowało naukę',
      'Źródło: ela.nauka.gov.pl',
    ],
  },
  {
    id: 'maciag',
    title: 'Dwóch Rafałów Maciągów',
    time: '5 min',
    story:
      'Dr hab. Rafał Maciąg, prof. UJ, z naszego Instytutu bada, jak sztuczna inteligencja zmienia wiedzę. Problem: to samo imię i nazwisko nosi lekarz radiolog, a Repozytorium UJ na hasło „Maciąg” zwraca prawie 900 wyników.',
    asks: [
      'Znajdź w Repozytorium UJ dowolną publikację dr. hab. Rafała Maciąga, która dotyczy sztucznych sieci neuronowych.',
      'Pokaż zapytanie, którego użyłeś lub użyłaś.',
    ],
    hints: [
      'Repozytorium UJ: ruj.uj.edu.pl. Wyszukiwarka rozumie operatory AND, OR, NOT (pisane wielkimi literami) oraz frazy w cudzysłowie.',
      'Połącz nazwisko z tematem: Maciąg AND "sieci neuronowe". Część prac jest po angielsku, więc dodaj OR "neural networks".',
      'Uważaj na pułapkę: w wynikach jest artykuł, który tylko cytuje Maciąga. Sprawdź, kto jest autorem.',
    ],
    answers: [
      'Zapytanie: Maciąg AND ("sieci neuronowe" OR "neural networks") daje 9 wyników zamiast 890.',
      'Zaliczamy: „Zaawansowane procedury NLP jako przesłanka rekonstrukcji idei wiedzy” (2022)',
      'Zaliczamy: „Advanced NLP procedures as premises for the reconstruction of the idea of knowledge” (2022)',
      'Zaliczamy: „The hermeneutics of artificial text” (2023)',
      'Zaliczamy: „Large language models technology as a center of knowledge flows in the organization” (2024)',
      'Zaliczamy: „Knowledge in the management process in the context of large language models and artificial text” (2025)',
      'Nie zaliczamy: artykuł Ł. Wordliczka (2023), który tylko cytuje Maciąga.',
    ],
  },
];

export interface KoloSlide {
  img: string;
  title: string;
  text: string;
  position?: string;
}

export const KOLO_SLIDES: KoloSlide[] = [
  {
    img: '/images/knzi/5.jpg',
    title: 'AI Literacy Lab',
    text: 'Cykl warsztatów z generatywnej AI dla 26 studentów UJ, także spoza naszego Wydziału. Projekt sfinansowany z Inicjatywy Doskonałości UJ.',
  },
  {
    img: '/images/knzi/2.jpg',
    title: 'Wykład otwarty o bezpieczeństwie AI',
    text: 'Inż. Rafał Maciejewski i dr Robert Kłopotek z Instytutu Informatyki UKSW o zagrożeniach dla systemów sztucznej inteligencji. Przyszło 40 studentów UJ.',
  },
  {
    img: '/images/knzi/3.jpg',
    title: 'Człowiek: wróg, ofiara czy przyjaciel AI?',
    text: 'Ataków na modele AI nie da się przeprowadzić bez człowieka. Jak się przed nimi bronić, tłumaczyli goście z UKSW.',
  },
  {
    img: '/images/knzi/4.jpg',
    title: 'Wojna hybrydowa i kognitywna',
    text: 'Spotkanie z dr Katarzyną Batorowską z ISI UJ o konfliktach w cyberprzestrzeni i bezpieczeństwie informacji.',
  },
  {
    img: '/images/knzi/1.jpg',
    title: 'Studenckie Korki',
    text: 'Regularne spotkania, na których studenci ISI wspólnie powtarzają i porządkują materiał z zajęć.',
  },
  {
    img: '/images/knzi/6.jpg',
    title: 'Infokawka',
    text: 'Rozmowy o nauce przy kawie w pokoju Koła. Gościły u nas dr Sabina Cisek i dr hab. Monika Krakowska, prof. UJ.',
  },
  {
    img: '/images/knzi/8.jpg',
    title: 'Po godzinach',
    text: 'Planszówki, RPG i praca nad projektem Digital Signage, czyli ekranami takimi jak ten, dla lepszej komunikacji w Instytucie.',
    position: 'center 65%',
  },
  {
    img: '/images/knzi/7.jpg',
    title: 'Od 1987 roku',
    text: 'Działamy nieprzerwanie od 24 listopada 1987, najpierw jako Koło Naukowe Bibliotekoznawców UJ. Tak wygląda kampus z okna naszego pokoju.',
  },
];

export const MINDMAP_CENTER = 'Zarządzanie informacją';

export const MINDMAP_NODES: { label: string; detail: string }[] = [
  { label: 'Języki informacyjno-wyszukiwawcze', detail: 'tezaurusy, klasyfikacje, metadane' },
  { label: 'Bazy danych', detail: 'projektowanie i przeszukiwanie' },
  { label: 'Business Intelligence', detail: 'dane, które pomagają decydować' },
  { label: 'Sieci', detail: 'sieci komputerowe i internet' },
  { label: 'Badania ilościowe', detail: 'ankiety, statystyka, bibliometria' },
  { label: 'Badania jakościowe', detail: 'wywiady, obserwacja, analiza treści' },
  { label: 'Zarządzanie', detail: 'projekty, procesy, zespoły' },
  { label: 'Dokumentacja', detail: 'obieg i opis dokumentów' },
  { label: 'Testy funkcjonalne', detail: 'czy system działa tak, jak powinien' },
  { label: 'UX / UI', detail: 'badania użytkowników i projektowanie' },
  { label: 'OSINT i infobrokering', detail: 'biały wywiad i weryfikacja źródeł' },
  { label: 'Archiwa cyfrowe', detail: 'digitalizacja i repozytoria' },
  { label: 'Sztuczna inteligencja', detail: 'AI literacy, modele językowe, etyka' },
];

export const CAREERS: { role: string; benefit: string }[] = [
  { role: 'Menedżer informacji', benefit: 'Porządkujesz wiedzę firmy, zanim zamieni się w chaos.' },
  { role: 'Broker informacji, analityk OSINT', benefit: 'Znajdujesz i weryfikujesz to, czego inni nie potrafią znaleźć.' },
  { role: 'Specjalista UX', benefit: 'Projektujesz serwisy, z których ludzie chcą korzystać.' },
  { role: 'Analityk danych', benefit: 'Zamieniasz dane w decyzje dla marketingu i biznesu.' },
  { role: 'Specjalista archiwów cyfrowych', benefit: 'Dbasz o to, żeby dokumenty i dane przetrwały dekady.' },
  { role: 'Badacz', benefit: 'Prowadzisz własne badania w Szkole Doktorskiej Nauk Społecznych UJ.' },
];

export const RESEARCH_TRENDS: { topic: string; title: string; authors: string }[] = [
  {
    topic: 'Człowiek ocenia AI',
    title: 'User-centric evaluation of explainability of AI with and for humans',
    authors: 'Bobek, Korycińska, Krakowska, Mozolewski, Rak, Zych (2025)',
  },
  {
    topic: 'Rozmowa z AI zamiast wyszukiwarki',
    title: 'Dialogic information retrieval and the falsifiability of Wilson’s model',
    authors: 'Krakowska, Zych (2026)',
  },
  {
    topic: 'Neuroróżnorodność i dostępność',
    title: 'Bibliotekarz jako ambasador dostępności (projekt NCN NEURO-INC)',
    authors: 'Wójcik, Gerc, Korycińska, Rak, Ulatowska (2026)',
  },
  {
    topic: 'Dezinformacja i weryfikacja',
    title: 'The gossiping machine: ethical tensions in AI-assisted verification systems',
    authors: 'Gaweł (2026)',
  },
  {
    topic: 'Archiwa, które przetrwają',
    title: 'Proaktywne zarządzanie ryzykiem w archiwach cyfrowych w świetle modelu OAIS z 2024 r.',
    authors: 'Januszko-Szakiel (2026)',
  },
  {
    topic: 'Otwarta nauka',
    title: 'The causal effect of the global crisis on open science research impact',
    authors: 'Deja (2025)',
  },
];

export const ALUMNI: { name: string; role?: string }[] = [
  { name: 'dr hab. Magdalena Wójcik, prof. UJ', role: 'Dyrektor Instytutu' },
  { name: 'dr Sabina Cisek', role: 'Wicedyrektor ds. dydaktyki' },
  { name: 'dr hab. Monika Krakowska, prof. UJ' },
  { name: 'dr Marek Deja' },
  { name: 'dr Barbara Krawczyk' },
  { name: 'dr Paloma Korycińska', role: 'Opiekunka Koła' },
  { name: 'dr Aneta Januszko-Szakiel', role: 'Opiekunka Koła' },
  { name: 'dr Dorota Rak' },
];

export const STUDENT_PUBLICATIONS: { title: string; author: string; where: string }[] = [
  {
    title: 'Agenty AI i Model Context Protocol w repozytoriach naukowych bibliotek akademickich',
    author: 'Artur Sendyka',
    where: 'AI w bibliotekach, 2026',
  },
  {
    title: 'Wyszukiwanie i przegląd z użyciem narzędzi AI na przykładzie bibliotek',
    author: 'Kacper Kurpisz',
    where: 'AI w bibliotekach, 2026',
  },
  {
    title: 'Patologie kultury internetu: dokąd zmierza społeczność w internecie?',
    author: 'Artur Sendyka',
    where: '2025',
  },
];

export const THESIS_TOPICS: string[] = [
  'Dark patterns w UX portali komercyjnych',
  'Architektura informacji aplikacji SofaScore i FlashScore',
  'ChatGPT i Copilot w białym wywiadzie (OSINT)',
  'Proces doręczenia przesyłki w Poczcie Polskiej w notacji BPMN',
  'Fandom jako środowisko informacyjne',
  'Zachowania informacyjne fanów Eurowizji',
  'Język informacyjny gier wideo',
  'Gra komputerowa jako środowisko informacyjne gracza',
];
