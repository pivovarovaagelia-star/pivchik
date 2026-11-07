import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark, ChevronRight, Clapperboard, Clock3, Film, Heart, House, Info,
  Menu, Play, Search, Settings, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tv, X,
} from 'lucide-react';

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';
const ANILIST_API = 'https://graphql.anilist.co';
const NAV = [['Главная', House], ['Фильмы', Clapperboard], ['Сериалы', Tv], ['Аниме', Star], ['Избранное', Heart], ['История', Clock3]];
const FEATURED = [
  { id: 'black-clover', title: 'Чёрный клевер', english: 'Black Clover', aliases: ['Черный клевер'], kind: 'Аниме', year: 2017, rating: '8.1', genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-xJzQyr0LoETP.jpg', overview: 'Аста мечтает стать Королём магов в мире, где почти каждый владеет магией.' },
  { id: 'naruto', title: 'Наруто', english: 'Naruto', kind: 'Аниме', year: 2002, rating: '8.4', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-8Q3Jp6v7XnEq.jpg' },
  { id: 'interstellar', title: 'Интерстеллар', english: 'Interstellar', kind: 'Фильм', year: 2014, rating: '8.7', genre: 'Фантастика', poster: `${TMDB_IMAGE}w500/gEU2QniE6E77NI6lCU6Mxs0POf3.jpg` },
  { id: 'one-piece', title: 'Ван-Пис', english: 'One Piece', kind: 'Аниме', year: 1999, rating: '9.0', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-C6L0l3D4oVmA.jpg' },
  { id: 'dune-two', title: 'Дюна: Часть вторая', english: 'Dune: Part Two', kind: 'Фильм', year: 2024, rating: '8.5', genre: 'Фантастика', poster: `${TMDB_IMAGE}w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg` },
  { id: 'arcane', title: 'Аркейн', english: 'Arcane', kind: 'Сериал', year: 2021, rating: '9.0', genre: 'Фэнтези', poster: `${TMDB_IMAGE}w500/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg` },
  { id: 'demon-slayer', title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', kind: 'Аниме', year: 2019, rating: '8.7', genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-3uD1xX9OD06l.jpg' },
  { id: 'inception', title: 'Начало', english: 'Inception', kind: 'Фильм', year: 2010, rating: '8.8', genre: 'Фантастика', poster: `${TMDB_IMAGE}w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg` },
  { id: 'your-name', title: 'Твоё имя', english: 'Your Name', kind: 'Аниме', year: 2016, rating: '8.4', genre: 'Мелодрама', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-ksVHCkKAMUQy.jpg' },
  { id: 'breaking-bad', title: 'Во все тяжкие', english: 'Breaking Bad', kind: 'Сериал', year: 2008, rating: '9.5', genre: 'Драма', poster: `${TMDB_IMAGE}w500/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg` },
  { id: 'spirited-away', title: 'Унесённые призраками', english: 'Spirited Away', kind: 'Аниме', year: 2001, rating: '8.6', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199-6e9DVd4s0xwq.jpg' },
  { id: 'stranger-things', title: 'Очень странные дела', english: 'Stranger Things', kind: 'Сериал', year: 2016, rating: '8.6', genre: 'Фантастика', poster: `${TMDB_IMAGE}w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg` },
];
const apiCache = new Map();
function norm(value = '') { return String(value).toLocaleLowerCase('ru').replaceAll('ё', 'е').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function loadLocal(key) { try { const x = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } }
function normalizeTmdb(row) {
  const tv = row.media_type === 'tv' || Boolean(row.first_air_date);
  return { id: `tmdb-${tv ? 'tv' : 'movie'}-${row.id}`, externalId: row.id, mediaType: tv ? 'tv' : 'movie', title: row.title || row.name || row.original_title || row.original_name || 'Без названия', english: row.original_title || row.original_name || '', kind: tv ? 'Сериал' : 'Фильм', year: Number((row.release_date || row.first_air_date || '').slice(0, 4)) || null, rating: row.vote_average ? Number(row.vote_average).toFixed(1) : '', genre: 'Каталог TMDB', poster: row.poster_path ? `${TMDB_IMAGE}w500${row.poster_path}` : '', backdrop: row.backdrop_path ? `${TMDB_IMAGE}w1280${row.backdrop_path}` : '', overview: row.overview || 'Описание отсутствует.', source: 'TMDB' };
}
function normalizeAnime(row) {
  return { id: `anilist-${row.id}`, externalId: row.id, title: row.title?.native || row.title?.english || row.title?.romaji || 'Аниме', english: row.title?.english || row.title?.romaji || '', kind: 'Аниме', year: row.startDate?.year || null, rating: row.averageScore ? (row.averageScore / 10).toFixed(1) : '', genre: (row.genres || []).slice(0, 2).join(' · ') || 'Аниме', poster: row.coverImage?.large || row.coverImage?.medium || '', overview: (row.description || 'Описание отсутствует.').replace(/<[^>]*>/g, ' '), source: 'AniList' };
}
async function fetchJson(url, options = {}, signal) { const response = await fetch(url, { ...options, signal }); if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); }
async function searchAniList(query, page, signal) {
  const key = `ani:${query}:${page}`;
  if (apiCache.has(key)) return apiCache.get(key);
  const gql = 'query ($search: String, $page: Int) { Page(page: $page, perPage: 24) { media(search: $search, type: ANIME, sort: POPULARITY_DESC) { id title { romaji english native } coverImage { large medium } startDate { year } averageScore genres description } } }';
  const json = await fetchJson(ANILIST_API, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ query: gql, variables: { search: query || undefined, page } }) }, signal);
  const results = (json.data?.Page?.media || []).map(normalizeAnime);
  apiCache.set(key, results);
  return results;
}
async function searchTmdb(query, kind, token, page, signal) {
  if (!token) return [];
  const key = `tmdb:${query}:${kind}:${page}:${token.slice(-6)}`;
  if (apiCache.has(key)) return apiCache.get(key);
  const path = query ? '/search/multi' : kind === 'Фильм' ? '/movie/popular' : kind === 'Сериал' ? '/tv/popular' : '/trending/all/week';
  const params = new URLSearchParams({ language: 'ru-RU', page: String(page), include_adult: 'false' });
  if (query) params.set('query', query);
  const json = await fetchJson(`${TMDB_API}${path}?${params}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }, signal);
  const results = (json.results || []).filter(item => item.media_type !== 'person').map(normalizeTmdb);
  apiCache.set(key, results);
  return results;
}
function PosterCard({ item, favorite, onOpen, onFavorite }) {
  const [failed, setFailed] = useState(false);
  return <article className="poster-card"><button className="poster" onClick={() => onOpen(item)} aria-label={`Подробнее: ${item.title}`}>{item.poster && !failed ? <img src={item.poster} alt={`Постер ${item.title}`} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span className="poster-fallback"><Film size={28}/><b>{item.title}</b></span>}<span className="poster-shade"/>{item.rating && <span className="rating"><Star size={12} fill="currentColor"/>{item.rating}</span>}<span className="poster-play"><Play size={18} fill="currentColor"/></span></button><div className="poster-meta"><button className="poster-title" onClick={() => onOpen(item)}>{item.title}</button><span>{item.year || '—'} <i>·</i> {item.kind}</span></div><button className={`favorite ${favorite ? 'selected' : ''}`} onClick={() => onFavorite(item.id)} aria-label="Избранное"><Heart size={16} fill={favorite ? 'currentColor' : 'none'}/></button></article>;
}
function Detail({ item, onClose, onFavorite, favorite, onFindAvailability, availability, availabilityLoading, tokenPresent }) {
  return <div className="modal-backdrop" onClick={onClose}><section className="detail-modal" onClick={event => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="Закрыть"><X/></button><div className="detail-cover" style={{ backgroundImage: `linear-gradient(0deg,#18145e 0%,transparent 100%),url('${item.backdrop || item.poster || ''}')` }}/><div className="detail-body"><small>{item.kind} · {item.year || 'год не указан'} · ★ {item.rating || '—'}</small><h2>{item.title}</h2>{item.english && <p className="english-title">{item.english}</p>}<p>{item.overview || 'Описание пока не добавлено.'}</p><div className="notice"><ShieldCheck size={16}/><span>Видеопоток для этого произведения не подключён. Каталожные данные TMDB/AniList не дают права на воспроизведение.</span></div><div className="detail-actions"><button className="button primary" disabled><Play size={16} fill="currentColor"/> Смотреть — источник не подключён</button><button className="button secondary" onClick={() => onFavorite(item.id)}><Heart size={16}/>{favorite ? 'Убрать из избранного' : 'В избранное'}</button>{item.source === 'TMDB' && tokenPresent && <button className="button secondary" onClick={() => onFindAvailability(item)} disabled={availabilityLoading}>{availabilityLoading ? 'Ищем официальные сервисы…' : 'Где смотреть легально'}</button>}</div>{availability && <div className="availability"><b>Легальные варианты просмотра · регион {availability.region}</b>{availability.providers.length ? <ul>{availability.providers.map(provider => <li key={provider.name}>{provider.link ? <a href={provider.link} target="_blank" rel="noreferrer">{provider.name} ↗</a> : provider.name}{provider.note && <small> · {provider.note}</small>}</li>)}</ul> : <p>TMDB не сообщил доступные сервисы для выбранного региона.</p>}<small>Откроется официальный сервис. Это не встроенное воспроизведение.</small></div>}<p className="legal-note">Публичные каталоги доступности показывают, где можно посмотреть произведение, но не предоставляют сами фильмы. Для встроенного просмотра нужен договор с правообладателем.</p></div></section></div>;
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
  const [favorites, setFavorites] = useState(() => loadLocal('pivchik-favorites'));
  const [history, setHistory] = useState(() => loadLocal('pivchik-history'));
  const [mobile, setMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [region, setRegion] = useState('RU');
  const timer = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { clearTimeout(timer.current); timer.current = setTimeout(() => setDebounced(query.trim()), 280); return () => clearTimeout(timer.current); }, [query]);
  useEffect(() => { localStorage.setItem('pivchik-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('pivchik-history', JSON.stringify(history)); }, [history]);
  useEffect(() => { setPage(1); }, [section, kind, debounced]);

  const loadCatalog = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController(); abortRef.current = controller;
    setLoading(true); setError('');
    const tasks = [];
    if (section === 'Главная' || section === 'Аниме' || kind === 'Аниме') tasks.push(searchAniList(debounced, page, controller.signal));
    if (tmdbToken && section !== 'Аниме' && kind !== 'Аниме') {
      const targetKind = kind !== 'Все' ? kind : section === 'Фильмы' ? 'Фильм' : section === 'Сериалы' ? 'Сериал' : 'Все';
      tasks.push(searchTmdb(debounced, targetKind, tmdbToken, page, controller.signal));
    }
    try {
      const settled = await Promise.allSettled(tasks);
      if (controller.signal.aborted) return;
      const data = settled.flatMap(result => result.status === 'fulfilled' ? result.value : []);
      setRemote(data);
      if (settled.some(result => result.status === 'rejected') && !data.length) setError('Каталог временно недоступен. Проверь интернет/VPN и повтори запрос.');
    } catch { if (!controller.signal.aborted) setError('Не удалось загрузить каталог.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }, [section, kind, debounced, tmdbToken, page]);
  useEffect(() => { loadCatalog(); return () => abortRef.current?.abort(); }, [loadCatalog]);

  const allItems = useMemo(() => { const map = new Map(); [...FEATURED, ...remote].forEach(item => { if (!map.has(item.id)) map.set(item.id, item); }); return [...map.values()]; }, [remote]);
  const filtered = useMemo(() => {
    let list = [...allItems];
    if (section === 'Фильмы') list = list.filter(item => item.kind === 'Фильм');
    if (section === 'Сериалы') list = list.filter(item => item.kind === 'Сериал');
    if (section === 'Аниме') list = list.filter(item => item.kind === 'Аниме');
    if (section === 'Избранное') list = list.filter(item => favorites.includes(item.id));
    if (section === 'История') list = list.filter(item => history.includes(item.id));
    if (kind !== 'Все') list = list.filter(item => item.kind === kind);
    if (debounced) { const term = norm(debounced); list = list.filter(item => norm([item.title, item.english, ...(item.aliases || []), item.genre].join(' ')).includes(term)); }
    if (year !== 'Все') list = list.filter(item => item.year === Number(year));
    if (sort === 'По рейтингу') list.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    if (sort === 'Сначала новые') list.sort((a, b) => (b.year || 0) - (a.year || 0));
    return list;
  }, [allItems, section, kind, debounced, year, sort, favorites, history]);

  const openItem = item => { setSelected(item); setAvailability(null); setHistory(old => [item.id, ...old.filter(id => id !== item.id)].slice(0, 80)); };
  const toggleFavorite = id => setFavorites(old => old.includes(id) ? old.filter(value => value !== id) : [...old, id]);
  const findAvailability = async item => {
    if (!tmdbToken || !item.externalId || !item.mediaType) return;
    setAvailability(null); setAvailabilityLoading(true);
    try {
      const json = await fetchJson(`${TMDB_API}/${item.mediaType}/${item.externalId}/watch/providers`, { headers: { Authorization: `Bearer ${tmdbToken}`, Accept: 'application/json' } });
      const regionData = json.results?.[region];
      const providers = [...(regionData?.flatrate || []), ...(regionData?.free || []), ...(regionData?.ads || []), ...(regionData?.rent || []), ...(regionData?.buy || [])];
      const unique = [...new Map(providers.map(p => [p.provider_id, { name: p.provider_name, link: regionData?.link || '', note: (regionData?.rent || []).some(x => x.provider_id === p.provider_id) || (regionData?.buy || []).some(x => x.provider_id === p.provider_id) ? 'аренда/покупка может быть платной' : '' }])).values()];
      setAvailability({ region, providers: unique });
    } catch { setAvailability({ region, providers: [], error: true }); }
    finally { setAvailabilityLoading(false); }
  };

  const years = ['Все', ...Array.from({ length: 77 }, (_, i) => 2026 - i)];
  const catalogRows = section === 'Главная' ? [
    { title: 'Популярное', icon: '🔥', items: [...filtered].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)) },
    { title: 'Новинки', icon: '⭐', items: [...filtered].sort((a, b) => (b.year || 0) - (a.year || 0)) },
  ] : [{ title: section, icon: section === 'Аниме' ? '⭐' : '🔥', items: filtered }];

  return <div className="app-shell">
    <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
      <button className="brand" onClick={() => { setSection('Главная'); setMobile(false); }}><span className="beer-mark">🍺</span><span>Пивчик<small>Смотри. Наслаждайся. Отдыхай.</small></span></button>
      <nav>{NAV.map(([label, Icon]) => <button key={label} className={section === label ? 'active' : ''} onClick={() => { setSection(label); setKind('Все'); setMobile(false); }}><Icon size={19}/>{label}</button>)}</nav>
      <div className="premium"><span>👑</span><b>Премиум</b><small>Больше возможностей для тебя!</small><button onClick={() => setSettings(true)}>Открыть <ChevronRight size={15}/></button></div><div className="sidebar-foot">🍺 ПИВЧИК · 2026</div>
    </aside>
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Закрыть меню"/>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobile(value => !value)} aria-label="Меню"><Menu/></button><label className="search"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Поиск фильмов, сериалов и аниме..."/>{query && <button onClick={() => setQuery('')} aria-label="Очистить"><X size={16}/></button>}</label><button className="top-action" onClick={() => setSection('Избранное')}><Star size={17}/>Избранное</button><button className="top-action" onClick={() => setSection('История')}><Clock3 size={17}/>История</button><button className="icon-button" onClick={() => { setTokenDraft(tmdbToken); setSettings(true); }} aria-label="Настройки"><Settings size={19}/></button><button className="avatar" onClick={() => setSettings(true)} aria-label="Профиль">П</button></header>
      {section === 'Главная' && <section className="hero"><div className="hero-sky"/><div className="hero-cloud cloud-one"/><div className="hero-cloud cloud-two"/><div className="castle">🏰</div><div className="hero-content"><span className="eyebrow"><Sparkles size={14}/> ВАША ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ</span><h1>Пивчик</h1><h2>Смотри. Наслаждайся. Отдыхай!</h2><p>Фильмы, сериалы и аниме — выбирай историю под настроение.</p><button className="button primary" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}><Play size={17} fill="currentColor"/>Начать просмотр</button></div><div className="mascot" aria-hidden="true">🍺<span>👑</span></div><div className="hero-note">Лучшие фильмы,<br/>сериалы и аниме! ✨</div></section>}
      <div className="content" id="catalog"><div className="quick-links">{[['Популярное', Bookmark], ['Новинки', Sparkles], ['Фильмы', Clapperboard], ['Сериалы', Tv], ['Аниме', Star]].map(([label, Icon]) => <button key={label} onClick={() => { if (['Фильмы', 'Сериалы', 'Аниме'].includes(label)) setSection(label); else if (label === 'Новинки') setSort('Сначала новые'); }}><Icon size={17}/>{label}</button>)}</div>
        <div className="filters"><div className="chips">{['Все', 'Фильм', 'Сериал', 'Аниме'].map(value => <button key={value} className={kind === value ? 'chosen' : ''} onClick={() => setKind(value)}>{value === 'Все' ? 'Всё' : value === 'Фильм' ? 'Фильмы' : value === 'Сериал' ? 'Сериалы' : value}</button>)}</div><div className="selects"><label><SlidersHorizontal size={14}/><select value={year} onChange={event => setYear(event.target.value)}>{years.map(value => <option key={value}>{value}</option>)}</select></label><label><SlidersHorizontal size={14}/><select value={sort} onChange={event => setSort(event.target.value)}>{['Популярные', 'По рейтингу', 'Сначала новые'].map(value => <option key={value}>{value}</option>)}</select></label></div></div>
        {!tmdbToken && ['Главная', 'Фильмы', 'Сериалы'].includes(section) && <div className="notice"><Info size={16}/><span>Для расширенного каталога фильмов и сериалов добавь TMDB Read Access Token в настройках. TMDB предоставляет метаданные и постеры, не видео.</span><button onClick={() => { setTokenDraft(''); setSettings(true); }}>Настроить</button></div>}
        {error && <div className="notice error"><Info size={16}/>{error}<button onClick={loadCatalog}>Повторить</button></div>}
        {catalogRows.map(row => <section className="catalog-row" key={row.title}><div className="row-heading"><h2><span>{row.icon}</span>{row.title}</h2><button onClick={() => { if (section === 'Главная') setSection(row.title === 'Новинки' ? 'Фильмы' : 'Фильмы'); }}>{row.title === 'Новинки' && section === 'Главная' ? 'Смотреть все' : ''}<ChevronRight size={16}/></button></div><div className="grid">{row.items.slice(0, section === 'Главная' ? 8 : undefined).map(item => <PosterCard key={item.id} item={item} onOpen={openItem} favorite={favorites.includes(item.id)} onFavorite={toggleFavorite}/>)}</div></section>)}
        {loading && <div className="loading"><span className="spinner"/> Загружаем каталог…</div>}
        {!filtered.length && !loading && <div className="empty"><Search size={30}/><h3>Ничего не найдено</h3><p>Попробуй изменить запрос или фильтры.</p><button className="button primary" onClick={() => { setQuery(''); setKind('Все'); setYear('Все'); }}>Сбросить фильтры</button></div>}
        {section !== 'Избранное' && section !== 'История' && (section === 'Аниме' || section === 'Главная' || (tmdbToken && ['Фильмы', 'Сериалы'].includes(section))) && <div className="load-more"><button disabled={loading} onClick={() => setPage(current => current + 1)}>{loading ? 'Загрузка…' : 'Показать ещё'}<ChevronRight size={15}/></button></div>}
        <div className="source-note"><ShieldCheck size={16}/><span>Каталог и постеры — не видеопоток. Встроенный просмотр появится после договора с провайдером, который разрешает показывать контент на сайте. Пока карточки не притворяются доступными фильмами.</span></div>
      </div>
      <footer><b>🍺 ПИВЧИК</b><span>Каталог для хорошего вечера</span><button onClick={() => { setTokenDraft(tmdbToken); setSettings(true); }}>Настройки и источники</button></footer>
    </main>
    {selected && <Detail item={selected} onClose={() => setSelected(null)} onFavorite={toggleFavorite} favorite={favorites.includes(selected.id)} onFindAvailability={findAvailability} availability={availability} availabilityLoading={availabilityLoading} tokenPresent={Boolean(tmdbToken)}/>}
    {settings && <div className="modal-backdrop" onClick={() => setSettings(false)}><section className="settings-modal" onClick={event => event.stopPropagation()}><button className="close" onClick={() => setSettings(false)} aria-label="Закрыть"><X/></button><div className="settings-icon"><Settings/></div><h2>Настройки каталога</h2><p>TMDB показывает метаданные и варианты легального просмотра, но не выдаёт полные видеопот��ки. Введённый токен хранится только в этом браузере; для публичного сервиса нужен серверный прокси.</p><label className="field-label">TMDB API Read Access Token</label><input className="token-input" type="password" value={tokenDraft} onChange={event => setTokenDraft(event.target.value)} placeholder="Вставь токен TMDB"/><label className="field-label">Регион поиска доступности</label><select className="token-input" value={region} onChange={event => setRegion(event.target.value)}><option value="RU">Россия (RU)</option><option value="US">США (US)</option><option value="GB">Великобритания (GB)</option><option value="KZ">Казахстан (KZ)</option></select><div className="settings-actions"><button className="button primary" onClick={() => { const token = tokenDraft.trim(); setTmdbToken(token); token ? localStorage.setItem('pivchik-tmdb-token', token) : localStorage.removeItem('pivchik-tmdb-token'); setSettings(false); }}>Сохранить</button><a href="https://developer.themoviedb.org/docs/getting-started" target="_blank" rel="noreferrer">Документация TMDB <ChevronRight size={15}/></a></div><div className="settings-note"><b>Источники:</b> TMDB/AniList — метаданные. TMDB Watch Providers — ссылки к легальным сервисам, доступность зависит от региона. Ни один из них не является встроенным видеопоставщиком. Для воспроизведения нужен прямой договор/лицензия. Ранее опубликованный в чате токен следует отозвать.</div></section></div>}
  </div>;
}
