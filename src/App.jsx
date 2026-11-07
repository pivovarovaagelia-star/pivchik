import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Bell, Check, ChevronLeft, ChevronRight, Clapperboard, Clock3, Film, Heart, House, Info, Menu, Play, Search, Settings, ShieldCheck, Sparkles, Star, Tv, X } from 'lucide-react';

const ANILIST = 'https://graphql.anilist.co';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const FEATURED = [
  { id: 'naruto', title: 'Наруто', english: 'Naruto', type: 'anime', year: 2002, rating: '8.4', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20-8Q3Jp6v7XnEq.jpg' },
  { id: 'attack-titan', title: 'Атака титанов', english: 'Attack on Titan', type: 'anime', year: 2013, rating: '9.1', genre: 'Экшен', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx16498-Q7QslHCS4nXy.jpg' },
  { id: 'joker', title: 'Джокер', english: 'Joker', type: 'movie', year: 2019, rating: '8.8', genre: 'Драма', poster: `${TMDB_IMG}/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg` },
  { id: 'one-piece', title: 'Ван-Пис', english: 'One Piece', type: 'anime', year: 1999, rating: '9.2', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-C6L0l3D4oVmA.jpg' },
  { id: 'demon-slayer', title: 'Клинок, рассекающий демонов', english: 'Demon Slayer', type: 'anime', year: 2019, rating: '9.3', genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101922-3uD1xX9OD06l.jpg' },
  { id: 'top-gun', title: 'Топ Ган: Мэверик', english: 'Top Gun: Maverick', type: 'movie', year: 2022, rating: '8.4', genre: 'Экшен', poster: `${TMDB_IMG}/62HCnUTziyWcpDaBO2i1DX17ljH.jpg` },
  { id: 'interstellar', title: 'Интерстеллар', english: 'Interstellar', type: 'movie', year: 2014, rating: '8.6', genre: 'Фантастика', poster: `${TMDB_IMG}/gEU2QniE6E77NI6lCU6Mxs0POf3.jpg` },
  { id: 'fight-club', title: 'Бойцовский клуб', english: 'Fight Club', type: 'movie', year: 1999, rating: '8.4', genre: 'Драма', poster: `${TMDB_IMG}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg` },
  { id: 'black-clover', title: 'Чёрный клевер', english: 'Black Clover', aliases: ['Черный клевер'], type: 'anime', year: 2017, rating: '8.1', genre: 'Фэнтези', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx97940-xJzQyr0LoETP.jpg', description: 'Аста мечтает стать Королём магов в мире, где почти каждый владеет магией.' },
  { id: 'dune', title: 'Дюна: Часть вторая', english: 'Dune: Part Two', type: 'movie', year: 2024, rating: '8.5', genre: 'Фантастика', poster: `${TMDB_IMG}/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg` },
  { id: 'arcane', title: 'Аркейн', english: 'Arcane', type: 'series', year: 2021, rating: '9.0', genre: 'Фэнтези', poster: `${TMDB_IMG}/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg` },
  { id: 'stranger-things', title: 'Очень странные дела', english: 'Stranger Things', type: 'series', year: 2016, rating: '8.6', genre: 'Фантастика', poster: `${TMDB_IMG}/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg` },
  { id: 'inception', title: 'Начало', english: 'Inception', type: 'movie', year: 2010, rating: '8.8', genre: 'Фантастика', poster: `${TMDB_IMG}/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg` },
  { id: 'your-name', title: 'Твоё имя', english: 'Your Name', type: 'anime', year: 2016, rating: '8.4', genre: 'Мелодрама', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21519-ksVHCkKAMUQy.jpg' },
  { id: 'breaking-bad', title: 'Во все тяжкие', english: 'Breaking Bad', type: 'series', year: 2008, rating: '9.5', genre: 'Драма', poster: `${TMDB_IMG}/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg` },
  { id: 'spirited-away', title: 'Унесённые призраками', english: 'Spirited Away', type: 'anime', year: 2001, rating: '8.6', genre: 'Приключения', poster: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx199-6e9DVd4s0xwq.jpg' },
];
const TITLES = { all: 'Всё', movie: 'Фильмы', series: 'Сериалы', anime: 'Аниме', favorites: 'Избранное', history: 'История' };
const LINKS = [['Главная', House, 'all'], ['Фильмы', Clapperboard, 'movie'], ['Сериалы', Tv, 'series'], ['Аниме', Star, 'anime'], ['Избранное', Heart, 'favorites'], ['История', Clock3, 'history']];
const safeList = key => { try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
const normalize = text => String(text || '').toLocaleLowerCase('ru').replaceAll('ё', 'е').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
function Poster({ item, favorite, onOpen, onFavorite }) {
  const [broken, setBroken] = useState(false);
  return <article className="tile"><button className="cover" onClick={() => onOpen(item)} aria-label={`Подробнее: ${item.title}`}>{item.poster && !broken ? <img src={item.poster} alt={`Постер ${item.title}`} loading="lazy" decoding="async" onError={() => setBroken(true)} /> : <span className="cover-fallback"><Film size={28}/>{item.title}</span>}<span className="cover-vignette"/><span className="score"><Star size={12} fill="currentColor"/>{item.rating || '—'}</span><span className="cover-play"><Play size={19} fill="currentColor"/></span></button><button className="tile-title" onClick={() => onOpen(item)}>{item.title}</button><div className="tile-subtitle">{item.year || '—'} <i>·</i> {item.type === 'movie' ? 'Фильм' : item.type === 'series' ? 'Сериал' : 'Аниме'}</div><button className={`heart ${favorite ? 'on' : ''}`} onClick={() => onFavorite(item.id)} aria-label="В избранное"><Heart size={16} fill={favorite ? 'currentColor' : 'none'}/></button></article>;
}
function ItemDialog({ item, favorite, onClose, onFavorite }) {
  const justWatchUrl = `https://www.justwatch.com/ru/search?q=${encodeURIComponent(item.title)}`;
  return <div className="overlay" onClick={onClose}><section className="dialog" onClick={event => event.stopPropagation()}><button className="dialog-close" onClick={onClose} aria-label="Закрыть"><X/></button><div className="dialog-art" style={{ backgroundImage: `linear-gradient(0deg,#17143f 0%,transparent 100%),url('${item.poster || ''}')` }}/><div className="dialog-info"><div className="kicker">{item.type === 'movie' ? 'ФИЛЬМ' : item.type === 'series' ? 'СЕРИАЛ' : 'АНИМЕ'} · {item.year || '—'} · ★ {item.rating || '—'}</div><h2>{item.title}</h2>{item.english && <div className="english">{item.english}</div>}<p>{item.description || `${item.genre || 'Каталог'} · Сведения и постер — справочная информация.`}</p><div className="play-honest"><ShieldCheck size={18}/><span><b>Видеопоток не подключён</b><small>Каталог не предоставляет права на показ фильма. Найди официальный сервис ниже.</small></span></div><div className="dialog-actions"><a className="btn btn-main" href={justWatchUrl} target="_blank" rel="noreferrer"><Search size={16}/>Где смотреть легально ↗</a><button className="btn btn-soft" onClick={() => onFavorite(item.id)}><Heart size={16} fill={favorite ? 'currentColor' : 'none'}/>{favorite ? 'В избранном' : 'В избранное'}</button></div><div className="caption">Откроется поиск легальных площадок в JustWatch. Это переход на внешний сайт, не воспроизведение внутри Пивчика.</div></div></section></div>;
}
async function fetchAnime(query, page, signal) {
  const body = { query: 'query ($search: String, $page: Int) { Page(page: $page, perPage: 24) { media(search: $search, type: ANIME, sort: POPULARITY_DESC) { id title { romaji english native } coverImage { large medium } startDate { year } averageScore genres description } } }', variables: { search: query || undefined, page } };
  const response = await fetch(ANILIST, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body), signal });
  if (!response.ok) throw new Error(`AniList HTTP ${response.status}`);
  const json = await response.json();
  return (json.data?.Page?.media || []).map(row => ({ id: `ani-${row.id}`, title: row.title?.native || row.title?.english || row.title?.romaji || 'Аниме', english: row.title?.english || row.title?.romaji || '', type: 'anime', year: row.startDate?.year || null, rating: row.averageScore ? (row.averageScore / 10).toFixed(1) : '', genre: (row.genres || []).slice(0, 2).join(' · '), poster: row.coverImage?.large || row.coverImage?.medium || '', description: (row.description || '').replace(/<[^>]*>/g, ' ') }));
}
export default function App() {
  const [section, setSection] = useState('all');
  const [search, setSearch] = useState('');
  const [settledSearch, setSettledSearch] = useState('');
  const [favorites, setFavorites] = useState(() => safeList('pivchik-v2-favorites'));
  const [history, setHistory] = useState(() => safeList('pivchik-v2-history'));
  const [remoteAnime, setRemoteAnime] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [mobile, setMobile] = useState(false);
  const searchTimer = useRef();
  const request = useRef();

  useEffect(() => { clearTimeout(searchTimer.current); searchTimer.current = setTimeout(() => setSettledSearch(search.trim()), 250); return () => clearTimeout(searchTimer.current); }, [search]);
  useEffect(() => { localStorage.setItem('pivchik-v2-favorites', JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem('pivchik-v2-history', JSON.stringify(history)); }, [history]);
  useEffect(() => { setPage(1); }, [section, settledSearch]);
  useEffect(() => {
    if (!['anime', 'all'].includes(section)) { setRemoteAnime([]); setLoading(false); return undefined; }
    const controller = new AbortController(); request.current?.abort(); request.current = controller;
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      try { const results = await fetchAnime(settledSearch, page, controller.signal); if (!controller.signal.aborted) setRemoteAnime(results); }
      catch (err) { if (!controller.signal.aborted && err.name !== 'AbortError') { setError('Не удалось получить онлайн-каталог аниме. Проверь подключение/VPN; локальные карточки остаются доступны.'); if (page > 1) setPage(1); } }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }, 140);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [section, settledSearch, page]);
  useEffect(() => { const onKey = event => { if (event.key === 'Escape') { setSelected(null); setMobile(false); } }; window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);

  const allItems = useMemo(() => { const map = new Map(); [...FEATURED, ...remoteAnime].forEach(item => { if (!map.has(item.id)) map.set(item.id, item); }); return [...map.values()]; }, [remoteAnime]);
  const visible = useMemo(() => {
    let rows = [...allItems];
    if (section === 'movie' || section === 'series' || section === 'anime') rows = rows.filter(item => item.type === section);
    if (section === 'favorites') rows = rows.filter(item => favorites.includes(item.id));
    if (section === 'history') rows = rows.filter(item => history.includes(item.id));
    if (settledSearch) { const term = normalize(settledSearch); rows = rows.filter(item => normalize([item.title, item.english, ...(item.aliases || []), item.genre].join(' ')).includes(term)); }
    return rows;
  }, [allItems, section, favorites, history, settledSearch]);
  const toggleFavorite = id => setFavorites(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const openItem = item => { setSelected(item); setHistory(current => [item.id, ...current.filter(value => value !== item.id)].slice(0, 100)); };
  const homepageRows = section === 'all' && !settledSearch ? [
    { name: 'Популярное', icon: '🔥', items: [...visible].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)) },
    { name: 'Новинки', icon: '⭐', items: [...visible].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)) },
  ] : [{ name: TITLES[section] || 'Результаты поиска', icon: section === 'anime' ? '⭐' : '🎬', items: visible }];

  return <div className="site-shell">
    {mobile && <button className="scrim" onClick={() => setMobile(false)} aria-label="Закрыть меню"/>}
    <aside className={`sidebar ${mobile ? 'sidebar-open' : ''}`}><button className="brand" onClick={() => { setSection('all'); setMobile(false); }}><span className="mug">🍺</span><span className="brand-type">Пивчик<small>Смотри. Наслаждайся. Отдыхай!</small></span></button><nav>{LINKS.map(([label, Icon, key]) => <button key={key} className={section === key ? 'active' : ''} onClick={() => { setSection(key); setMobile(false); }}><Icon size={20}/>{label}</button>)}</nav><div className="premium"><span>👑</span><b>Премиум</b><small>Концепт подписки без рекламы</small><button onClick={() => alert('Платные подписки не подключены. Для них нужны сервер, платёжный провайдер и юридические условия.')}>Подробнее <ArrowRight size={15}/></button></div><small className="side-foot">КАТАЛОГ · 2026</small></aside>
    <main className="main"><header className="topbar"><button className="mobile-toggle" onClick={() => setMobile(value => !value)} aria-label="Меню"><Menu/></button><label className="searchbox"><Search size={19}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск фильмов, сериалов и аниме..."/>{search && <button onClick={() => setSearch('')} aria-label="Очистить"><X size={15}/></button>}</label><button className="head-link" onClick={() => setSection('favorites')}><Star size={19}/>Избранное</button><button className="head-link" onClick={() => setSection('history')}><Clock3 size={19}/>История</button><button className="bell" aria-label="Уведомления"><Bell size={20}/></button><button className="profile" aria-label="Профиль">П</button></header>
      {section === 'all' && !settledSearch && <section className="hero"><div className="sky"/><div className="castle" aria-hidden="true">🏰</div><div className="hero-copy"><span className="hero-eyebrow"><Sparkles size={14}/> МИР ИСТОРИЙ И ПРИКЛЮЧЕНИЙ</span><h1>Пивчик</h1><h2>Смотри. Наслаждайся. Отдыхай!</h2><p>Фильмы, сериалы и аниме — найди историю по настроению.</p><button className="watch-cta" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>В каталог <Play size={16} fill="currentColor"/></button></div><div className="mug-mascot" aria-hidden="true">🍺<span>👑</span></div><div className="hero-note">Лучшие фильмы,<br/>сериалы и аниме!<br/>♡</div></section>}
      <div className="catalog" id="catalog"><div className="category-shortcuts">{[['Популярное', Clapperboard, 'all'], ['Новинки', Sparkles, 'all'], ['Фильмы', Film, 'movie'], ['Сериалы', Tv, 'series'], ['Аниме', Star, 'anime']].map(([label, Icon, key]) => <button key={label} onClick={() => { setSection(key); if (label === 'Новинки') document.getElementById('new-row')?.scrollIntoView({ behavior: 'smooth' }); }}><Icon size={18}/>{label}</button>)}</div><div className="catalog-heading"><div><span>ПОДБОРКА ДЛЯ ТЕБЯ</span><h2>{TITLES[section] || 'Каталог'}</h2></div><div className="count">{visible.length} карточек</div></div>
        {error && <div className="status"><Info size={17}/>{error}</div>}
        {loading && <div className="loading"><span className="spinner"/>Обновляем каталог аниме…</div>}
        {homepageRows.map((row, index) => <section className="shelf" id={index === 1 ? 'new-row' : undefined} key={row.name}><div className="shelf-head"><h3><span>{row.icon}</span>{row.name}</h3>{section === 'all' && <button onClick={() => setSection('movie')}>Смотреть всё <ArrowRight size={15}/></button>}</div><div className="poster-row">{row.items.slice(0, section === 'all' ? 12 : undefined).map(item => <Poster key={item.id} item={item} favorite={favorites.includes(item.id)} onOpen={openItem} onFavorite={toggleFavorite}/>)}</div></section>)}
        {!visible.length && !loading && <div className="empty"><Search size={29}/><b>Ничего не найдено</b><span>Очисти запрос или выбери другой раздел.</span><button onClick={() => { setSearch(''); setSection('all'); }}>Сбросить</button></div>}
        {['all', 'anime'].includes(section) && <div className="more"><button disabled={loading} onClick={() => setPage(current => current + 1)}>{loading ? 'Загрузка…' : 'Загрузить ещё аниме'} <ChevronRight size={16}/></button></div>}
        <div className="disclaimer"><ShieldCheck size={18}/><span><b>Важно о просмотре.</b> В этом проекте каталог и постеры не включают лицензионное видео. Кнопка в карточке ведёт к поиску официального сервиса; для встроенного плеера необходим договор с правообладателем.</span></div>
      </div><footer><b>🍺 ПИВЧИК</b><span>Каталог фильмов, сериалов и аниме</span><button onClick={() => alert('Это макет интерфейса. Админ-панель, аккаунты, биллинг и премиум-подписка требуют backend и не подключены.')}>О проекте</button></footer></main>
    {selected && <ItemDialog item={selected} favorite={favorites.includes(selected.id)} onFavorite={toggleFavorite} onClose={() => setSelected(null)}/ >}
  </div>;
}
