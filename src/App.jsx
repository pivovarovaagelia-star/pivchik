import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Bell, Bookmark, Check, ChevronLeft, ChevronRight, Clapperboard, Clock3,
  Film, Heart, House, Info, ListVideo, Menu, Play, Search, Settings, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, Tv, X,
} from 'lucide-react';

const ANILIST = 'https://graphql.anilist.co';
const TMDB = 'https://api.themoviedb.org/3';
const IMAGE = 'https://image.tmdb.org/t/p/';
const LOCAL = [
  { id: 'black-clover', title: 'Чёрный клевер', english: 'Black Clover', kind: 'Аниме', year: 2017, rating: 8.1, genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-xJzQyr0LoETP.jpg', overview: 'Аста мечтает стать Королём магов в мире, где магия есть у каждого — кроме него.' },
  { id: 'interstellar', title: 'Интерстеллар', english: 'Interstellar', kind: 'Фильм', year: 2014, rating: 8.7, genre: 'Фантастика', poster: `${IMAGE}w500/gEU2QniE6E77NI6lCU6Mxs0POf3.jpg`, overview: 'Исследователи отправляются за пределы нашей галактики в поисках нового дома для человечества.' },
  { id: 'dune-two', title: 'Дюна: Часть вторая', english: 'Dune: Part Two', kind: 'Фильм', year: 2024, rating: 8.5, genre: 'Фантастика', poster: `${IMAGE}w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg`, overview: 'Пол Атрейдес объединяется с фременами на пути к собственной судьбе.' },
  { id: 'arcane', title: 'Аркейн', english: 'Arcane', kind: 'Сериал', year: 2021, rating: 9.0, genre: 'Фэнтези', poster: `${IMAGE}w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg`, overview: 'История двух сестёр в мире Пилтовера и Зауна.' },
  { id: 'naruto', title: 'Наруто', english: 'Naruto', kind: 'Аниме', year: 2002, rating: 8.4, genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-8Q3Jp6v7XnEq.jpg', overview: 'Юный ниндзя мечтает стать Хокагэ и добиться признания.' },
  { id: 'demon-slayer', title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', kind: 'Аниме', year: 2019, rating: 8.7, genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-3uD1xX9OD06l.jpg', overview: 'Тандзиро вступает в отряд охотников на демонов.' },
  { id: 'one-piece', title: 'Ван-Пис', english: 'One Piece', kind: 'Аниме', year: 1999, rating: 9.0, genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-C6L0l3D4oVmA.jpg', overview: 'Луффи и команда отправляются на поиски величайшего сокровища.' },
  { id: 'inception', title: 'Начало', english: 'Inception', kind: 'Фильм', year: 2010, rating: 8.8, genre: 'Фантастика', poster: `${IMAGE}w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg`, overview: 'Команда специалистов проникает в сны, чтобы изменить реальность.' },
  { id: 'stranger-things', title: 'Очень странные дела', english: 'Stranger Things', kind: 'Сериал', year: 2016, rating: 8.6, genre: 'Фантастика', poster: `${IMAGE}w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg`, overview: 'В небольшом городке происходят необъяснимые события.' },
  { id: 'your-name', title: 'Твоё имя', english: 'Your Name', kind: 'Аниме', year: 2016, rating: 8.4, genre: 'Мелодрама', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-ksVHCkKAMUQy.jpg', overview: 'Двое подростков загадочным образом меняются телами.' },
  { id: 'breaking-bad', title: 'Во все тяжкие', english: 'Breaking Bad', kind: 'Сериал', year: 2008, rating: 9.5, genre: 'Драма', poster: `${IMAGE}w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg`, overview: 'Учитель химии делает выбор, который меняет его жизнь.' },
  { id: 'spirited-away', title: 'Унесённые призраками', english: 'Spirited Away', kind: 'Аниме', year: 2001, rating: 8.6, genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199-6e9DVd4s0xwq.jpg', overview: 'Девочка попадает в загадочный мир духов.' },
];

const cache = new Map();
function normalizeText(text = '') {
  return text.toLocaleLowerCase('ru').replaceAll('ё', 'е').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
function mediaKind(type) { return type === 'TV' || type === 'TV_SHORT' || type === 'ONA' ? 'Аниме' : 'Аниме'; }
function fromAniList(item) {
  const nativeTitle = item.title?.native || '';
  const english = item.title?.english || item.title?.romaji || '';
  const title = nativeTitle || english || 'Аниме';
  return {
    id: `anilist-${item.id}`, externalId: item.id, title, english,
    kind: mediaKind(item.format), year: item.startDate?.year || null,
    rating: item.averageScore ? (item.averageScore / 10).toFixed(1) : '',
    genre: (item.genres || []).slice(0, 2).join(' · ') || 'Аниме',
    poster: item.coverImage?.large || item.coverImage?.medium || '',
    overview: (item.description || 'Описание отсутствует.').replace(/<[^>]*>/g, ' '),
    source: 'AniList',
  };
}
function fromTmdb(item) {
  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date);
  return {
    id: `tmdb-${isTv ? 'tv' : 'movie'}-${item.id}`, externalId: item.id,
    title: item.title || item.name || item.original_title || item.original_name || 'Без названия',
    english: item.original_title || item.original_name || '', kind: isTv ? 'Сериал' : 'Фильм',
    year: Number((item.release_date || item.first_air_date || '').slice(0, 4)) || null,
    rating: item.vote_average ? Number(item.vote_average).toFixed(1) : '',
    genre: 'Каталог TMDB', poster: item.poster_path ? `${IMAGE}w500${item.poster_path}` : '',
    backdrop: item.backdrop_path ? `${IMAGE}w1280${item.backdrop_path}` : '',
    overview: item.overview || 'Описание отсутствует.', source: 'TMDB',
  };
}
async function getAniList(query, page = 1) {
  const key = `ani:${query}:${page}`;
  if (cache.has(key)) return cache.get(key);
  const gql = `query ($search: String, $page: Int) { Page(page: $page, perPage: 24) { media(search: $search, type: ANIME, sort: POPULARITY_DESC) { id format title { romaji english native } coverImage { large medium } startDate { year } averageScore genres description } } }`;
  const response = await fetch(ANILIST, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query: gql, variables: { search: query || undefined, page } }) });
  if (!response.ok) throw new Error(`AniList: HTTP ${response.status}`);
  const json = await response.json();
  const result = (json.data?.Page?.media || []).map(fromAniList);
  cache.set(key, result);
  return result;
}
async function getTmdb(query, kind, token, page = 1) {
  if (!token) return [];
  const key = `tmdb:${query}:${kind}:${page}:${token.slice(-5)}`;
  if (cache.has(key)) return cache.get(key);
  const path = query ? '/search/multi' : kind === 'Фильм' ? '/movie/popular' : kind === 'Сериал' ? '/tv/popular' : '/trending/all/week';
  const params = new URLSearchParams({ language: 'ru-RU', page: String(page), include_adult: 'false' });
  if (query) params.set('query', query);
  const response = await fetch(`${TMDB}${path}?${params}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`TMDB: HTTP ${response.status}`);
  const json = await response.json();
  const results = (json.results || []).filter(x => x.media_type !== 'person').map(fromTmdb);
  cache.set(key, results);
  return results;
}

function Poster({ item, onOpen, isFavorite, onFavorite }) {
  const [failed, setFailed] = useState(false);
  return <article className="poster-card">
    <button className="poster" onClick={() => onOpen(item)} aria-label={`Открыть ${item.title}`}>
      {item.poster && !failed ? <img src={item.poster} alt={`Постер: ${item.title}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="poster-fallback"><Film size={30} /><b>{item.title}</b></span>}
      <span className="poster-shade" />
      {item.rating && <span className="rating"><Star size={12} fill="currentColor" /> {item.rating}</span>}
      <span className="poster-play"><Play size={18} fill="currentColor" /></span>
    </button>
    <div className="poster-meta"><button className="poster-title" onClick={() => onOpen(item)}>{item.title}</button><span>{item.year || '—'} <i>·</i> {item.kind}</span></div>
    <button className={`favorite ${isFavorite ? 'selected' : ''}`} onClick={() => onFavorite(item.id)} aria-label="Избранное"><Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} /></button>
  </article>;
}

function VideoPlayer({ media, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media?.stream) return undefined;
    const stream = media.stream.trim();
    if (!/^https?:\/\//i.test(stream)) { setError('Источник видео имеет некорректный адрес.'); return undefined; }
    if (stream.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, backBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setError('Поток не загрузился. Источник может быть недоступен или запрещать воспроизведение на этом сайте.');
      });
    } else video.src = stream;
    return () => { hlsRef.current?.destroy(); hlsRef.current = null; video.pause(); video.removeAttribute('src'); video.load(); };
  }, [media]);
  return <div className="player-overlay"><header><button onClick={onClose}><ChevronLeft size={18} /> Назад</button><b>{media.title}</b><button onClick={onClose}><X size={19} /></button></header><div className="player-stage">{media.stream ? <><video ref={videoRef} controls autoPlay playsInline preload="metadata" />{error && <p className="player-error">{error}</p>}</> : <div className="no-stream"><Film size={42} /><h2>Источник видео не подключён</h2><p>Каталог предоставляет описания и постеры, но не права на показ фильма. Для просмотра нужен лицензированный поставщик с разрешением на встраивание.</p><button className="button primary" onClick={onClose}>Вернуться к каталогу</button></div>}</div><div className="player-bottom"><ShieldCheck size={15} /> Поддержка MP4 и HLS при наличии разрешённого источника</div></div>;
}

export default function App() {
  const [section, setSection] = useState('Главная');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [kind, setKind] = useState('Все');
  const [year, setYear] = useState('Все');
  const [sort, setSort] = useState('Популярные');
  const [remote, setRemote] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tmdbToken, setTmdbToken] = useState(() => localStorage.getItem('pivchik-tmdb-token') || '');
  const [tokenDraft, setTokenDraft] = useState('');
  const [settings, setSettings] = useState(false);
  const [selected, setSelected] = useState(null);
  const [player, setPlayer] = useState(null);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('pivchik-favorites') || '[]'));
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem('pivchik-history') || '[]'));
  const [mobile, setMobile] = useState(false);
  const timer = useRef(null);

  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => setDebounced(query.trim()), 280); return () => clearTimeout(timer.current); }, [query]);
  useEffect(() => { localStorage.setItem('pivchik-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('pivchik-history', JSON.stringify(history)); }, [history]);

  const loadCatalog = useCallback(async () => {
    setLoading(true); setError('');
    const tasks = [];
    if (section === 'Главная' || section === 'Аниме' || kind === 'Аниме') tasks.push(getAniList(debounced));
    if (tmdbToken && (section !== 'Аниме' && kind !== 'Аниме')) tasks.push(getTmdb(debounced, kind === 'Все' ? section : kind, tmdbToken));
    try {
      const results = await Promise.allSettled(tasks);
      const items = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
      const failures = results.filter(result => result.status === 'rejected');
      setRemote(items);
      if (failures.length && !items.length) setError('Не удалось связаться с каталогом. Проверь подключение к интернету и попробуй обновить страницу.');
    } catch { setError('Не удалось загрузить каталог.'); }
    finally { setLoading(false); }
  }, [section, kind, debounced, tmdbToken]);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  const allItems = useMemo(() => {
    const map = new Map();
    [...LOCAL, ...remote].forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
    return [...map.values()];
  }, [remote]);
  const filtered = useMemo(() => {
    let list = [...allItems];
    if (section === 'Фильмы') list = list.filter(x => x.kind === 'Фильм');
    if (section === 'Сериалы') list = list.filter(x => x.kind === 'Сериал');
    if (section === 'Аниме') list = list.filter(x => x.kind === 'Аниме');
    if (section === 'Избранное') list = list.filter(x => favorites.includes(x.id));
    if (section === 'История') list = list.filter(x => history.includes(x.id));
    if (kind !== 'Все') list = list.filter(x => x.kind === kind);
    if (debounced) { const term = normalizeText(debounced); list = list.filter(x => normalizeText(`${x.title} ${x.english || ''} ${x.genre}`).includes(term)); }
    if (year !== 'Все') list = list.filter(x => x.year === Number(year));
    if (sort === 'По рейтингу') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'Сначала новые') list.sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [allItems, section, kind, debounced, year, sort, favorites, history]);

  const openItem = item => {
    setSelected(item);
    setHistory(old => [item.id, ...old.filter(id => id !== item.id)].slice(0, 80));
  };
  const toggleFavorite = id => setFavorites(old => old.includes(id) ? old.filter(x => x !== id) : [...old, id]);
  const nav = [['Главная', House], ['Фильмы', Clapperboard], ['Сериалы', Tv], ['Аниме', Star], ['Избранное', Heart], ['История', Clock3]];
  const years = ['Все', ...Array.from({ length: 77 }, (_, i) => 2026 - i)];

  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
      <button className="brand" onClick={() => setSection('Главная')}><span className="beer-mark">🍺</span><span>Пивчик<small>Смотри. Наслаждайся. Отдыхай.</small></span></button>
      <nav>{nav.map(([label, Icon]) => <button key={label} className={section === label ? 'active' : ''} onClick={() => { setSection(label); setKind('Все'); setMobile(false); }}><Icon size={19} />{label}</button>)}</nav>
      <div className="premium"><span>👑</span><b>Премиум</b><small>Без рекламы и с удобной историей просмотра</small><button onClick={() => setSettings(true)}>Подробнее <ChevronRight size={15} /></button></div>
      <div className="sidebar-foot">🍺 ПИВЧИК · 2026</div>
    </aside>
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Закрыть меню" />}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobile(!mobile)} aria-label="Меню"><Menu /></button><label className="search"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск фильмов, сериалов и аниме..." />{query && <button onClick={() => setQuery('')} aria-label="Очистить"><X size={16} /></button>}</label><button className="top-action" onClick={() => setSection('Избранное')}><Star size={17} /> Избранное</button><button className="top-action" onClick={() => setSection('История')}><Clock3 size={17} /> История</button><button className="icon-button" onClick={() => setSettings(true)} aria-label="Настройки"><Settings size={19} /></button><button className="avatar" onClick={() => setSettings(true)} aria-label="Профиль">П</button></header>
      {section === 'Главная' && <section className="hero"><div className="hero-sky"/><div className="hero-cloud cloud-one"/><div className="hero-cloud cloud-two"/><div className="castle">🏰</div><div className="hero-content"><span className="eyebrow"><Sparkles size={14} /> ВАША ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ</span><h1>Пивчик</h1><h2>Смотри. Наслаждайся. Отдыхай!</h2><p>Фильмы, сериалы и аниме — выбирай историю под настроение.</p><button className="button primary" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}><Play size={17} fill="currentColor" /> Начать просмотр</button></div><div className="mascot" aria-hidden="true">🍺<span>👑</span></div><div className="hero-note">Лучшие фильмы,<br />сериалы и аниме! ✨</div></section>}
      <div className="content" id="catalog">
        <div className="quick-links">{[['Популярное', Bookmark], ['Новинки', Sparkles], ['Фильмы', Clapperboard], ['Сериалы', Tv], ['Аниме', Star]].map(([label, Icon]) => <button key={label} onClick={() => ['Фильмы', 'Сериалы', 'Аниме'].includes(label) ? setSection(label) : label === 'Новинки' ? setSort('Сначала новые') : setSort('Популярные')}><Icon size={17} />{label}</button>)}</div>
        <div className="section-title"><div><small>{section === 'Главная' ? 'ВАША КОЛЛЕКЦИЯ' : 'КАТАЛОГ ПИВЧИКА'}</small><h2>{section === 'Главная' ? 'Популярное' : section}</h2></div><span>{filtered.length} карточек</span></div>
        <div className="filters"><div className="chips">{['Все', 'Фильм', 'Сериал', 'Аниме'].map(value => <button key={value} className={kind === value ? 'chosen' : ''} onClick={() => setKind(value)}>{value === 'Все' ? 'Всё' : value === 'Фильм' ? 'Фильмы' : value === 'Сериал' ? 'Сериалы' : value}</button>)}</div><div className="selects"><label><SlidersHorizontal size={14} /><select value={year} onChange={e => setYear(e.target.value)}>{years.map(x => <option key={x}>{x}</option>)}</select></label><label><SlidersHorizontal size={14} /><select value={sort} onChange={e => setSort(e.target.value)}>{['Популярные', 'По рейтингу', 'Сначала новые'].map(x => <option key={x}>{x}</option>)}</select></label></div></div>
        {!tmdbToken && ['Главная', 'Фильмы', 'Сериалы'].includes(section) && <div className="notice"><Info size={16} /><span>Расширенный каталог фильмов и сериалов загружается из TMDB. Добавьте API Read Access Token в настройках; TMDB предоставляет метаданные, но не видео.</span><button onClick={() => { setTokenDraft(''); setSettings(true); }}>Настроить</button></div>}
        {error && <div className="notice error"><Info size={16} />{error}<button onClick={loadCatalog}>Повторить</button></div>}
        <section className="grid">{filtered.map(item => <Poster key={item.id} item={item} onOpen={openItem} isFavorite={favorites.includes(item.id)} onFavorite={toggleFavorite} />)}{loading && <div className="loading"><span className="spinner" /> Загружаем каталог…</div>}{!filtered.length && !loading && <div className="empty"><Search size={30} /><h3>Ничего не найдено</h3><p>Попробуйте изменить запрос или фильтры.</p><button className="button primary" onClick={() => { setQuery(''); setKind('Все'); setYear('Все'); }}>Сбросить фильтры</button></div>}</section>
        <div className="source-note"><ShieldCheck size={16} /><span>Метаданные и постеры не означают, что видео или русская озвучка доступны. Воспроизведение подключается только через источники с разрешением на показ.</span></div>
      </div>
      <footer><b>🍺 ПИВЧИК</b><span>Каталог для хорошего вечера</span><button onClick={() => setSettings(true)}>Настройки и источники</button></footer>
    </main>

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="detail-modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSelected(null)} aria-label="Закрыть"><X /></button><div className="detail-cover" style={{ backgroundImage: `linear-gradient(0deg,#18145e 0%,transparent 100%),url('${selected.backdrop || selected.poster}')` }} /><div className="detail-body"><small>{selected.kind} · {selected.year || 'год не указан'} · ★ {selected.rating || '—'}</small><h2>{selected.title}</h2>{selected.english && <p className="english-title">{selected.english}</p>}<p>{selected.overview}</p><div className="notice"><ShieldCheck size={16} /><span>Наличие карточки не подтверждает доступность видеопотока или русской озвучки.</span></div><div className="detail-actions"><button className="button primary" onClick={() => { setPlayer({ title: selected.title }); setSelected(null); }}><Play size={16} fill="currentColor" /> Смотреть</button><button className="button secondary" onClick={() => toggleFavorite(selected.id)}><Heart size={16} /> {favorites.includes(selected.id) ? 'Убрать из избранного' : 'В избранное'}</button>{selected.source === 'AniList' && <a className="button secondary" href={`https://anilist.co/anime/${selected.externalId}`} target="_blank" rel="noreferrer">Каталог AniList</a>}</div></div></section></div>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="settings-modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setSettings(false)} aria-label="Закрыть"><X /></button><div className="settings-icon"><Settings /></div><h2>Настройки каталога</h2><p>TMDB расширяет каталог фильмов и сериалов. Токен используетс�� в этом браузере только для запросов метаданных; TMDB не предоставляет видеопотоки.</p><label className="field-label">TMDB API Read Access Token</label><input className="token-input" type="password" value={tokenDraft} onChange={e => setTokenDraft(e.target.value)} placeholder="Вставьте токен TMDB" /><div className="settings-actions"><button className="button primary" onClick={() => { const token = tokenDraft.trim(); setTmdbToken(token); token ? localStorage.setItem('pivchik-tmdb-token', token) : localStorage.removeItem('pivchik-tmdb-token'); setSettings(false); }}>Сохранить</button><a href="https://developer.themoviedb.org/docs/getting-started" target="_blank" rel="noreferrer">Как получить токен <ChevronRight size={15} /></a></div><div className="settings-note"><b>AniList</b> — каталог и метаданные аниме. <b>Видео и озвучка</b> требуют отдельного лицензированного источника. <b>Premium, аккаунты и панель владельца</b> требуют защищённой серверной части и платёжного провайдера; кнопка в интерфейсе не заменяет эти интеграции.</div></section></div>}
    {player && <VideoPlayer media={player} onClose={() => setPlayer(null)} />}
  </div>;
}
