import React, { useState, useEffect, useCallback, useRef } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_SIZE = 4;

const SPACE_TILES = {
  2:    { emoji: '🪨', name: 'Asteroid' },
  4:    { emoji: '🌑', name: 'Moon' },
  8:    { emoji: '🌍', name: 'Planet' },
  16:   { emoji: '🪐', name: 'Ringed Planet' },
  32:   { emoji: '⭐', name: 'Star' },
  64:   { emoji: '☀️', name: 'Sun' },
  128:  { emoji: '💥', name: 'Supernova' },
  256:  { emoji: '🕳️', name: 'Black Hole' },
  512:  { emoji: '🌫️', name: 'Nebula' },
  1024: { emoji: '🌌', name: 'Galaxy' },
  2048: { emoji: '🌠', name: 'Universe' },
};

const TILE_COLORS = {
  2:    '#3d4f6e',
  4:    '#2d3a5c',
  8:    '#1a3a6e',
  16:   '#1e4d8c',
  32:   '#1a5ca8',
  64:   '#b8860b',
  128:  '#c47a00',
  256:  '#1a1f35',
  512:  '#5a1a8c',
  1024: '#3d1472',
  2048: '#6a28d4',
};

const TIPS = [
  { title: 'Corner Strategy', icon: '📐', text: 'Keep your highest-value tile in a corner at all times. Build a "snake" pattern outward from that corner — this prevents trapping your big tile.' },
  { title: 'Never Move Up', icon: '⬆️', text: 'Pick three directions and stick to them. Many pros avoid the "up" swipe entirely, anchoring tiles to the bottom row for better control.' },
  { title: 'Build Chains', icon: '🔗', text: 'Arrange tiles in descending order: 512 → 256 → 128 → 64… When you slide, they merge in sequence like a chain reaction, maximizing score.' },
  { title: 'Don\'t Rush Merges', icon: '⏳', text: 'Patience wins. Wait until you have two high-value tiles adjacent before merging. Premature merges scatter your board and break your chain.' },
  { title: 'Watch the Edges', icon: '🎯', text: 'Fill edges before the center. Edge tiles only have neighbors on three sides, making them easier to protect and harder to accidentally merge.' },
  { title: 'Plan Two Moves Ahead', icon: '🧠', text: 'Before every swipe, mentally trace where every tile will land. A single bad swipe can collapse a carefully built board in seconds.' },
];

const NAV_LINKS = ['Game', 'How to Play', 'Tips', 'Leaderboard', 'About'];
const FOOTER_LINKS = ['Privacy Policy', 'Terms of Service', 'Contact'];

// ─── SEO Helmet (injected into <head>) ───────────────────────────────────────
const SEOHead = () => {
  useEffect(() => {
    document.title = 'Space 2048 — Merge Cosmic Objects & Reach the Universe';
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', 'Play Space 2048 — the space-themed puzzle game where you merge asteroids, planets, stars and galaxies to reach the Universe tile. Free, browser-based, no download required.');
    setMeta('keywords', 'space 2048, 2048 game, space puzzle, merge tiles, browser game, free online game, galaxy game');
    setMeta('robots', 'index, follow');
    setMeta('og:title', 'Space 2048 — Merge Cosmic Objects & Reach the Universe', true);
    setMeta('og:description', 'Merge asteroids, moons, planets, stars and galaxies in this addictive space-themed 2048 puzzle game. Play free in your browser!', true);
    setMeta('og:type', 'website', true);
    setMeta('og:image', 'https://via.placeholder.com/1200x630/0f0c29/ffffff?text=Space+2048', true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', 'Space 2048 — Free Online Puzzle Game');
    setMeta('twitter:description', 'Merge cosmic objects and reach the Universe! Addictive 2048 space puzzle game, free to play in your browser.');
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.href.split('?')[0];
  }, []);
  return null;
};

// ─── Ad Placeholder ───────────────────────────────────────────────────────────
const AdPlaceholder = ({ slot, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.25)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontFamily: 'monospace',
    ...style
  }}>
    Advertisement · {slot}
  </div>
);

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: 'linear-gradient(160deg, #1a1a3e 0%, #0d0d22 100%)',
      border: '1px solid rgba(140,100,255,0.3)',
      borderRadius: '16px', maxWidth: '640px', width: '100%',
      maxHeight: '85vh', overflow: 'auto', padding: '32px',
      boxShadow: '0 25px 80px rgba(0,0,0,0.8), 0 0 40px rgba(120,80,255,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#c4a8ff', fontFamily: '"Trebuchet MS", sans-serif', fontSize: '1.5rem' }}>{title}</h2>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#aaa',
          borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer',
          fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Game Component (core logic unchanged) ────────────────────────────────────
const GameBoard = ({ onScoreUpdate, onGameOver, onWin, resetSignal }) => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);

  const addNewTile = useCallback((g) => {
    const empty = [];
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = 0; j < GRID_SIZE; j++)
        if (g[i][j] === 0) empty.push({ row: i, col: j });
    if (empty.length > 0) {
      const { row, col } = empty[Math.floor(Math.random() * empty.length)];
      g[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }, []);

  const initializeGame = useCallback(() => {
    const g = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addNewTile(g); addNewTile(g);
    setGrid(g); setScore(0);
    onScoreUpdate(0);
  }, [addNewTile, onScoreUpdate]);

  useEffect(() => { initializeGame(); }, [initializeGame, resetSignal]);

  const canMove = useCallback((g) => {
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = 0; j < GRID_SIZE; j++) {
        if (g[i][j] === 0) return true;
        if (j < GRID_SIZE - 1 && g[i][j] === g[i][j + 1]) return true;
        if (i < GRID_SIZE - 1 && g[i][j] === g[i + 1][j]) return true;
      }
    return false;
  }, []);

  const move = useCallback((direction) => {
    setGrid(prevGrid => {
      let newGrid = prevGrid.map(row => [...row]);
      let moved = false;
      let added = 0;

      const slide = (row) => {
        const arr = row.filter(v => v !== 0);
        const merged = []; let i = 0;
        while (i < arr.length) {
          if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
            const mv = arr[i] * 2; merged.push(mv); added += mv;
            if (mv === 2048) onWin();
            i += 2;
          } else { merged.push(arr[i]); i++; }
        }
        while (merged.length < GRID_SIZE) merged.push(0);
        return merged;
      };

      if (direction === 'left') {
        for (let i = 0; i < GRID_SIZE; i++) {
          const nr = slide(newGrid[i]);
          if (JSON.stringify(nr) !== JSON.stringify(newGrid[i])) moved = true;
          newGrid[i] = nr;
        }
      } else if (direction === 'right') {
        for (let i = 0; i < GRID_SIZE; i++) {
          const nr = slide([...newGrid[i]].reverse()).reverse();
          if (JSON.stringify(nr) !== JSON.stringify(newGrid[i])) moved = true;
          newGrid[i] = nr;
        }
      } else if (direction === 'up') {
        for (let j = 0; j < GRID_SIZE; j++) {
          const col = newGrid.map(r => r[j]);
          const nc = slide(col);
          if (JSON.stringify(nc) !== JSON.stringify(col)) moved = true;
          for (let i = 0; i < GRID_SIZE; i++) newGrid[i][j] = nc[i];
        }
      } else if (direction === 'down') {
        for (let j = 0; j < GRID_SIZE; j++) {
          const col = newGrid.map(r => r[j]);
          const nc = slide([...col].reverse()).reverse();
          if (JSON.stringify(nc) !== JSON.stringify(col)) moved = true;
          for (let i = 0; i < GRID_SIZE; i++) newGrid[i][j] = nc[i];
        }
      }

      if (moved) {
        addNewTile(newGrid);
        setScore(prev => {
          const ns = prev + added;
          onScoreUpdate(ns);
          return ns;
        });
        if (!canMove(newGrid)) onGameOver();
        return newGrid;
      }
      return prevGrid;
    });
  }, [addNewTile, canMove, onScoreUpdate, onGameOver, onWin]);

  useEffect(() => {
    const handleKey = (e) => {
      const map = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down', a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [move]);

  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = touchStart.current.x - e.changedTouches[0].clientX;
    const dy = touchStart.current.y - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy)) { if (Math.abs(dx) > 40) move(dx > 0 ? 'left' : 'right'); }
    else { if (Math.abs(dy) > 40) move(dy > 0 ? 'up' : 'down'); }
    touchStart.current = null;
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(140,100,255,0.2)', boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 60px rgba(80,40,180,0.1)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', width: 'min(380px, 88vw)', aspectRatio: '1/1' }}>
        {grid.map((row, i) => row.map((value, j) => (
          <div key={`${i}-${j}`} style={{
            background: value === 0 ? 'rgba(255,255,255,0.04)' : TILE_COLORS[value] || '#1a202c',
            borderRadius: '10px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            fontSize: value === 0 ? '1rem' : value >= 1024 ? '2.2rem' : '2.6rem',
            fontWeight: 'bold', transition: 'all 0.12s ease',
            boxShadow: value !== 0 ? '0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
            animation: value !== 0 ? 'tilePop 0.18s ease' : 'none',
          }}>
            {value !== 0 && (<>
              <div style={{ lineHeight: 1 }}>{SPACE_TILES[value]?.emoji || '✨'}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{value}</div>
            </>)}
          </div>
        )))}
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function Space2048App() {
  const [activePage, setActivePage] = useState('Game');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('s2048best') || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    try { return JSON.parse(localStorage.getItem('s2048lb') || '[]'); } catch { return []; }
  });
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [pendingScore, setPendingScore] = useState(0);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('s2048name') || '');
  const [copied, setCopied] = useState(false);

  const handleScoreUpdate = useCallback((s) => {
    setScore(s);
    if (s > bestScore) {
      setBestScore(s);
      localStorage.setItem('s2048best', s.toString());
    }
  }, [bestScore]);

  const handleGameOver = useCallback(() => {
    setGameOver(true);
    if (score > 0) { setPendingScore(score); setShowNamePrompt(true); }
  }, [score]);

  const handleWin = useCallback(() => setWon(true), []);

  const saveToLeaderboard = (name) => {
    const entry = { name: name || 'Anonymous', score: pendingScore, date: new Date().toLocaleDateString() };
    const updated = [...leaderboard, entry].sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('s2048lb', JSON.stringify(updated));
    localStorage.setItem('s2048name', name);
    setPlayerName(name);
    setShowNamePrompt(false);
  };

  const newGame = () => {
    setGameOver(false); setWon(false); setScore(0);
    setResetSignal(s => s + 1);
  };

  const handleShare = async () => {
    const text = `I scored ${score} points in Space 2048! 🌠 Can you beat me? Play free at ${window.location.href}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); }
    catch { setShowShare(true); }
  };

  const navStyle = (page) => ({
    background: activePage === page ? 'rgba(120,80,255,0.3)' : 'transparent',
    border: activePage === page ? '1px solid rgba(140,100,255,0.5)' : '1px solid transparent',
    color: activePage === page ? '#c4a8ff' : '#94a3b8',
    padding: '7px 14px', borderRadius: '8px', cursor: 'pointer',
    fontFamily: '"Trebuchet MS", sans-serif', fontSize: '0.88rem',
    fontWeight: activePage === page ? '600' : '400',
    transition: 'all 0.2s', letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
  });

  const btn = (label, onClick, variant = 'primary') => (
    <button onClick={onClick} style={{
      background: variant === 'primary' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.08)',
      border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.2)',
      padding: '10px 22px', borderRadius: '10px', color: 'white',
      fontWeight: '600', cursor: 'pointer', fontSize: '0.92rem',
      fontFamily: '"Trebuchet MS", sans-serif',
      boxShadow: variant === 'primary' ? '0 4px 20px rgba(124,58,237,0.4)' : 'none',
      transition: 'all 0.2s',
    }}>{label}</button>
  );

  const sectionTitle = (text, sub) => (
    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', margin: '0 0 10px', fontFamily: '"Trebuchet MS", sans-serif', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{text}</h2>
      {sub && <p style={{ color: '#64748b', margin: 0, fontSize: '1rem' }}>{sub}</p>}
    </div>
  );

  const card = (children, extraStyle = {}) => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '24px', ...extraStyle }}>
      {children}
    </div>
  );

  const prose = { color: '#94a3b8', lineHeight: '1.8', fontSize: '0.97rem' };

  // ── Pages ──────────────────────────────────────────────────────────────────

  const GamePage = () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'center', alignItems: 'flex-start' }}>
      {/* Left Ad */}
      <AdPlaceholder slot="Sidebar Left" style={{ width: '160px', minHeight: '600px', display: 'none', '@media(min-width:1100px)': { display: 'flex' } }} />

      {/* Game Column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Score Row */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[['SCORE', score], ['BEST', bestScore]].map(([lbl, val]) => (
            <div key={lbl} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center', minWidth: '90px' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b', letterSpacing: '0.12em', marginBottom: '4px' }}>{lbl}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#e2e8f0', fontFamily: 'monospace' }}>{val.toLocaleString()}</div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {btn('New Game', newGame)}
            {btn('Share 🚀', handleShare, 'secondary')}
          </div>
        </div>

        {/* Board */}
        <div style={{ position: 'relative' }}>
          <GameBoard onScoreUpdate={handleScoreUpdate} onGameOver={handleGameOver} onWin={handleWin} resetSignal={resetSignal} />
          {(gameOver || won) && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', gap: '12px' }}>
              <div style={{ fontSize: '3rem' }}>{won ? '🎉' : '😢'}</div>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#e2e8f0', fontFamily: '"Trebuchet MS", sans-serif' }}>{won ? 'You reached the Universe!' : 'Game Over'}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '1rem' }}>Final score: <strong style={{ color: '#a78bfa' }}>{score.toLocaleString()}</strong></p>
              {btn('Play Again', newGame)}
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div style={{ textAlign: 'center', color: '#475569', fontSize: '0.82rem', lineHeight: '1.7' }}>
          <span>⌨️ Arrow keys / WASD&nbsp;&nbsp;•&nbsp;&nbsp;📱 Swipe to move</span><br />
          <button onClick={() => setShowHowToPlay(true)} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '0.82rem', padding: 0, textDecoration: 'underline' }}>How to play →</button>
        </div>

        {/* Inline Ad below game */}
        <AdPlaceholder slot="Below Game 728×90" style={{ width: 'min(728px, 90vw)', height: '90px' }} />
      </div>

      {/* Right Ad */}
      <AdPlaceholder slot="Sidebar Right" style={{ width: '160px', minHeight: '600px', display: 'none' }} />
    </div>
  );

  const HowToPlayPage = () => (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {sectionTitle('How to Play Space 2048', 'Master the cosmos in minutes')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {[
          { n: '01', title: 'The Goal', body: 'Merge matching cosmic tiles to create bigger objects — from a tiny Asteroid all the way up to the Universe tile (2048). Reach the Universe to win!' },
          { n: '02', title: 'Moving Tiles', body: 'Use arrow keys (↑↓←→) or WASD on desktop. On mobile, swipe in any direction. Every tile on the board slides as far as it can in that direction.' },
          { n: '03', title: 'Merging', body: 'When two tiles with the same value collide, they merge into one tile with double the value. Two Asteroids (2+2) become a Moon (4), two Moons become a Planet (8), and so on.' },
          { n: '04', title: 'Scoring', body: 'Every merge earns you points equal to the new tile\'s value. Merging two 512 Nebulas earns 1024 points. Aim to chain merges together for massive scores!' },
          { n: '05', title: 'New Tiles', body: 'After every valid move, a new tile (value 2 or 4) appears in a random empty cell. The board fills up over time, so plan ahead!' },
          { n: '06', title: 'Game Over', body: 'The game ends when no valid moves remain — the board is full and no adjacent tiles share the same value. Keep the board as open as possible to survive longer.' },
        ].map(({ n, title, body }) => (
          <div key={n} style={{ display: 'flex', gap: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '20px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'rgba(124,58,237,0.4)', fontFamily: 'monospace', minWidth: '40px', lineHeight: 1.1 }}>{n}</div>
            <div>
              <h3 style={{ margin: '0 0 8px', color: '#c4b5fd', fontSize: '1.05rem', fontFamily: '"Trebuchet MS", sans-serif' }}>{title}</h3>
              <p style={{ ...prose, margin: 0 }}>{body}</p>
            </div>
          </div>
        ))}
      </div>
      <AdPlaceholder slot="How To Play Bottom 728×90" style={{ width: '100%', height: '90px', marginTop: '32px' }} />
    </div>
  );

  const TipsPage = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {sectionTitle('Tips & Strategy', 'Expert techniques to maximize your score')}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {TIPS.map(({ title, icon, text }) => (
          <div key={title} style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '22px' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{icon}</div>
            <h3 style={{ margin: '0 0 10px', color: '#c4b5fd', fontSize: '1rem', fontFamily: '"Trebuchet MS", sans-serif' }}>{title}</h3>
            <p style={{ ...prose, margin: 0, fontSize: '0.92rem' }}>{text}</p>
          </div>
        ))}
      </div>
      {card(<>
        <h3 style={{ margin: '0 0 16px', color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif' }}>🏆 The Ultimate Strategy</h3>
        <p style={{ ...prose, marginTop: 0 }}>The most reliable strategy in 2048 is the <strong style={{ color: '#a78bfa' }}>monotonic grid approach</strong>. Keep your highest tile in the bottom-left corner. Fill the bottom row in descending order: 2048 → 1024 → 512 → 256. Above that, 128 → 64 → 32 → 16. This creates a "snake" that lets you chain merges without disrupting your structure.</p>
        <p style={{ ...prose, marginBottom: 0 }}>Once you've mastered the corner strategy, focus on keeping the bottom two rows always full before touching the upper rows. This drastically reduces the chance of a random tile appearing in the wrong spot and breaking your chain.</p>
      </>)}
      <AdPlaceholder slot="Tips Page Bottom" style={{ width: '100%', height: '90px', marginTop: '24px' }} />
    </div>
  );

  const LeaderboardPage = () => {
    const [confirmClear, setConfirmClear] = useState(false);
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {sectionTitle('Leaderboard', 'Top 10 local high scores')}
        {leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🌌</div>
            <p>No scores yet. Play a game and get on the board!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: i < 3 ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${i === 0 ? 'rgba(250,204,21,0.3)' : i === 1 ? 'rgba(226,232,240,0.2)' : i === 2 ? 'rgba(251,146,60,0.2)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '12px', padding: '14px 20px',
              }}>
                <div style={{ fontSize: '1.3rem', minWidth: '32px', textAlign: 'center' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: '600', fontFamily: '"Trebuchet MS", sans-serif' }}>{entry.name}</div>
                  <div style={{ color: '#475569', fontSize: '0.8rem' }}>{entry.date}</div>
                </div>
                <div style={{ color: '#a78bfa', fontWeight: '700', fontFamily: 'monospace', fontSize: '1.2rem' }}>{entry.score.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
        {leaderboard.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            {!confirmClear ? (
              <button onClick={() => setConfirmClear(true)} style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', color: 'rgba(239,68,68,0.6)', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem' }}>
                Clear Leaderboard
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '10px', padding: '12px 16px' }}>
                <span style={{ color: '#f87171', fontSize: '0.88rem', flex: 1 }}>Are you sure? This cannot be undone.</span>
                <button onClick={() => { setLeaderboard([]); localStorage.removeItem('s2048lb'); setConfirmClear(false); }} style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
                  Yes, clear
                </button>
                <button onClick={() => setConfirmClear(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', padding: '6px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem' }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        <AdPlaceholder slot="Leaderboard Bottom" style={{ width: '100%', height: '90px', marginTop: '32px' }} />
      </div>
    );
  };

  const AboutPage = () => (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {sectionTitle('About Space 2048', 'The cosmic puzzle game')}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {card(<>
          <h3 style={{ margin: '0 0 12px', color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif' }}>What is Space 2048?</h3>
          <p style={prose}>Space 2048 is a free browser-based puzzle game inspired by the classic 2048 by Gabriele Cirulli, reimagined with a cosmic theme. Instead of plain numbers, you merge space objects — starting from humble asteroids and building toward moons, planets, stars, galaxies, and ultimately the Universe itself.</p>
          <p style={{ ...prose, marginBottom: 0 }}>The game is completely free to play, requires no download or installation, and runs smoothly on any modern browser on desktop or mobile devices. Your best score is saved locally in your browser so you can always try to beat it.</p>
        </>)}
        {card(<>
          <h3 style={{ margin: '0 0 12px', color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif' }}>The Cosmic Journey</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '8px' }}>
            {Object.entries(SPACE_TILES).map(([val, { emoji, name }]) => (
              <div key={val} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: '600', margin: '4px 0 2px' }}>{name}</div>
                <div style={{ color: '#475569', fontSize: '0.78rem', fontFamily: 'monospace' }}>{Number(val).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </>)}
        {card(<>
          <h3 style={{ margin: '0 0 12px', color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif' }}>Why Play Space 2048?</h3>
          <ul style={{ ...prose, paddingLeft: '1.2em', margin: 0 }}>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#a78bfa' }}>Brain training:</strong> 2048-style puzzle games improve spatial reasoning, forward planning, and decision-making under pressure.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#a78bfa' }}>Quick sessions:</strong> Games typically last 5–20 minutes, making it perfect for a mental break.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#a78bfa' }}>No ads interrupting gameplay:</strong> We only show ads in non-intrusive placements around the game.</li>
            <li style={{ marginBottom: '8px' }}><strong style={{ color: '#a78bfa' }}>Privacy-first:</strong> We don't track you, collect personal data, or require accounts.</li>
            <li><strong style={{ color: '#a78bfa' }}>Mobile & desktop:</strong> Full swipe and keyboard support on every device.</li>
          </ul>
        </>)}
      </div>
    </div>
  );

  const PrivacyPage = () => (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {sectionTitle('Privacy Policy', 'Last updated: January 2025')}
      {[
        ['Information We Collect', 'Space 2048 does not collect personal information. Your high scores and leaderboard entries are stored exclusively in your own browser\'s localStorage and are never transmitted to any server. We do not use cookies beyond what our advertising partners may set (see Advertising below).'],
        ['Advertising', 'This website may display advertisements served by Google AdSense. Google may use cookies to serve ads based on your prior visits to this and other websites. You can opt out of personalized advertising by visiting Google\'s Ads Settings at https://adssettings.google.com.'],
        ['Analytics', 'We may use anonymous analytics tools to understand how visitors interact with our website in aggregate. No personally identifiable information is collected or stored by us.'],
        ['Third-Party Links', 'Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those sites.'],
        ['Children\'s Privacy', 'Space 2048 is suitable for all ages. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information, please contact us.'],
        ['Changes to This Policy', 'We may update this Privacy Policy from time to time. Changes are effective when posted to this page. Continued use of the site after changes constitutes acceptance.'],
        ['Contact', 'If you have questions about this Privacy Policy, please use the Contact page to reach us.'],
      ].map(([title, body]) => (
        <div key={title} style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif', margin: '0 0 8px' }}>{title}</h3>
          <p style={{ ...prose, margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );

  const TermsPage = () => (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      {sectionTitle('Terms of Service', 'Last updated: January 2025')}
      {[
        ['Acceptance of Terms', 'By accessing or using Space 2048 ("the Game"), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the Game.'],
        ['Use of the Game', 'Space 2048 is provided for personal, non-commercial entertainment purposes. You may not copy, modify, distribute, sell, or lease any part of the Game or its underlying code without express written permission.'],
        ['Intellectual Property', 'The Space 2048 name, design, graphics, and unique game elements are the property of the Game\'s creators. The 2048 game mechanic is based on the open-source game by Gabriele Cirulli, used under the MIT License.'],
        ['Disclaimer of Warranties', 'The Game is provided "as is" without warranty of any kind. We do not guarantee uninterrupted access, error-free operation, or that the Game will meet your expectations.'],
        ['Limitation of Liability', 'To the fullest extent permitted by law, the creators of Space 2048 shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Game.'],
        ['Advertising', 'The Game displays third-party advertisements to support free access. We are not responsible for the content of advertisements or the practices of advertisers.'],
        ['Modifications', 'We reserve the right to modify, suspend, or discontinue the Game at any time without notice. We may also update these Terms at any time; continued use constitutes acceptance.'],
        ['Governing Law', 'These Terms shall be governed by and construed in accordance with applicable local laws. Any disputes shall be resolved in the appropriate courts of the applicable jurisdiction.'],
      ].map(([title, body]) => (
        <div key={title} style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif', margin: '0 0 8px' }}>{title}</h3>
          <p style={{ ...prose, margin: 0 }}>{body}</p>
        </div>
      ))}
    </div>
  );

  const ContactPage = () => (
    <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
      {sectionTitle('Contact Us', 'Get in touch with the Space 2048 team')}
      {card(<>
        <p style={{ ...prose, textAlign: 'left', marginTop: 0 }}>Have a question, found a bug, or want to share feedback about Space 2048? We'd love to hear from you. Fill out the form below or email us directly.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {[['Your Name', 'text', 'Enter your name'], ['Email Address', 'email', 'your@email.com'], ['Subject', 'text', 'e.g. Bug report, Feedback']].map(([lbl, type, ph]) => (
            <div key={lbl}>
              <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>{lbl}</label>
              <input type={type} placeholder={ph} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
            </div>
          ))}
          <div>
            <label style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'block', marginBottom: '6px' }}>Message</label>
            <textarea rows={5} placeholder="Tell us what's on your mind..." style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '10px 14px', color: '#e2e8f0', fontSize: '0.92rem', boxSizing: 'border-box', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {btn('Send Message', () => alert('Thank you! (Connect to a backend to enable real sending.)'))}
        </div>
        <p style={{ ...prose, textAlign: 'center', marginBottom: 0, marginTop: '20px', fontSize: '0.88rem' }}>Or email us at: <a href="mailto:hello@space2048game.com" style={{ color: '#a78bfa' }}>hello@space2048game.com</a></p>
      </>)}
    </div>
  );

  const PAGES = {
    'Game': <GamePage />,
    'How to Play': <HowToPlayPage />,
    'Tips': <TipsPage />,
    'Leaderboard': <LeaderboardPage />,
    'About': <AboutPage />,
    'Privacy Policy': <PrivacyPage />,
    'Terms of Service': <TermsPage />,
    'Contact': <ContactPage />,
  };

  return (
    <>
      <SEOHead />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #070714 0%, #0f0826 50%, #080c1f 100%)', color: '#e2e8f0', fontFamily: '"Trebuchet MS", "Lucida Grande", sans-serif' }}>

        {/* Stars bg */}
        <div style={{ position: 'fixed', inset: 0, backgroundImage: 'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 80% 15%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 45% 70%, rgba(255,255,255,0.35) 0%, transparent 100%), radial-gradient(1px 1px at 90% 80%, rgba(255,255,255,0.25) 0%, transparent 100%), radial-gradient(1px 1px at 30% 90%, rgba(255,255,255,0.3) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* ── Header ── */}
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,7,20,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(124,58,237,0.2)', boxShadow: '0 4px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            <button onClick={() => setActivePage('Game')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>🌠</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Space 2048</span>
            </button>

            {/* Desktop Nav */}
            <nav style={{ display: 'flex', gap: '4px', alignItems: 'center' }} aria-label="Main navigation">
              {NAV_LINKS.map(p => (
                <button key={p} onClick={() => { setActivePage(p); setMobileMenuOpen(false); }} style={navStyle(p)}>{p}</button>
              ))}
            </nav>

            {/* Mobile hamburger */}
            <button onClick={() => setMobileMenuOpen(o => !o)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', color: '#94a3b8', padding: '6px 10px', cursor: 'pointer', display: 'none', fontSize: '1.1rem' }} aria-label="Toggle menu">
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div style={{ background: 'rgba(7,7,20,0.98)', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {NAV_LINKS.map(p => (
                <button key={p} onClick={() => { setActivePage(p); setMobileMenuOpen(false); }} style={{ ...navStyle(p), textAlign: 'left', padding: '10px 14px', width: '100%' }}>{p}</button>
              ))}
            </div>
          )}

          {/* Top ad banner */}
          <AdPlaceholder slot="Leaderboard 728×90" style={{ width: 'min(728px, 100%)', height: '50px', margin: '0 auto', borderRadius: 0, borderTop: '1px solid rgba(255,255,255,0.04)' }} />
        </header>

        {/* ── Main Content ── */}
        <main style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 60px' }}>
          {/* Page title area */}
          {activePage === 'Game' && (
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', margin: '0 0 10px', fontWeight: '800', background: 'linear-gradient(90deg, #a78bfa 0%, #7c3aed 50%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Space 2048
              </h1>
              <p style={{ color: '#64748b', fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', margin: 0 }}>
                Merge cosmic objects — from Asteroids to the Universe 🌠
              </p>
            </div>
          )}

          {PAGES[activePage] || <GamePage />}
        </main>

        {/* ── Footer ── */}
        <footer style={{ position: 'relative', zIndex: 1, background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(124,58,237,0.15)', padding: '40px 20px 30px' }}>
          {/* Footer ad */}
          <AdPlaceholder slot="Footer 970×90" style={{ width: 'min(970px, 100%)', height: '90px', margin: '0 auto 32px' }} />

          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'space-between', marginBottom: '32px' }}>
              <div style={{ maxWidth: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🌠</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: '#c4b5fd' }}>Space 2048</span>
                </div>
                <p style={{ ...prose, fontSize: '0.88rem', margin: 0 }}>A free, browser-based cosmic puzzle game. Merge tiles, reach the Universe, beat your high score. No download required.</p>
              </div>
              <div>
                <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Play</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {NAV_LINKS.map(p => (
                    <button key={p} onClick={() => { setActivePage(p); window.scrollTo(0, 0); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textAlign: 'left', padding: '2px 0', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#a78bfa'} onMouseLeave={e => e.target.style.color = '#64748b'}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ color: '#94a3b8', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 12px' }}>Legal</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {FOOTER_LINKS.map(p => (
                    <button key={p} onClick={() => { setActivePage(p); window.scrollTo(0, 0); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', textAlign: 'left', padding: '2px 0', fontSize: '0.9rem', fontFamily: 'inherit', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#a78bfa'} onMouseLeave={e => e.target.style.color = '#64748b'}>{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.82rem' }}>© {new Date().getFullYear()} Space 2048. All rights reserved. Built with ❤️ for puzzle lovers.</p>
              <p style={{ margin: 0, color: '#334155', fontSize: '0.8rem' }}>Inspired by 2048 by Gabriele Cirulli (MIT License)</p>
            </div>
          </div>
        </footer>

        {/* ── Modals ── */}
        {showHowToPlay && (
          <Modal title="How to Play Space 2048 🚀" onClose={() => setShowHowToPlay(false)}>
            {[
              ['🎯 Goal', 'Merge matching tiles to reach the 🌠 Universe tile (2048)!'],
              ['⬅️ Move', 'Use Arrow keys or WASD on desktop. Swipe on mobile.'],
              ['✨ Merge', 'Two identical tiles collide → they combine into one with double the value.'],
              ['➕ New tile', 'A new tile (2 or 4) appears after every valid move.'],
              ['💀 Game over', 'Board full with no valid merges = game over. Stay open!'],
              ['🏆 Scoring', 'Each merge adds points equal to the new tile\'s value.'],
            ].map(([title, body]) => (
              <div key={title} style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.3rem', minWidth: '28px' }}>{title.split(' ')[0]}</span>
                <div>
                  <strong style={{ color: '#c4b5fd', fontFamily: '"Trebuchet MS", sans-serif' }}>{title.slice(3)}</strong>
                  <p style={{ ...prose, margin: '4px 0 0', fontSize: '0.9rem' }}>{body}</p>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button onClick={() => { setShowHowToPlay(false); setActivePage('Tips'); }} style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', textDecoration: 'underline' }}>View full strategy guide →</button>
            </div>
          </Modal>
        )}

        {showNamePrompt && (
          <Modal title="🏆 Save Your Score!" onClose={() => setShowNamePrompt(false)}>
            <p style={prose}>You scored <strong style={{ color: '#a78bfa', fontSize: '1.3rem' }}>{pendingScore.toLocaleString()}</strong> points! Enter your name to save it to the leaderboard.</p>
            <input defaultValue={playerName} id="nameInput" type="text" maxLength={20} placeholder="Your name (max 20 chars)" style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '12px 16px', color: '#e2e8f0', fontSize: '1rem', marginBottom: '16px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              {btn('Save to Leaderboard', () => saveToLeaderboard(document.getElementById('nameInput')?.value || 'Anonymous'))}
              {btn('Skip', () => setShowNamePrompt(false), 'secondary')}
            </div>
          </Modal>
        )}

        {showShare && (
          <Modal title="Share Your Score 🚀" onClose={() => setShowShare(false)}>
            <p style={prose}>Copy this message and share it with your friends!</p>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '16px', color: '#c4b5fd', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '16px', userSelect: 'all' }}>
              I scored {score.toLocaleString()} points in Space 2048! 🌠 Can you beat me? Play free at {window.location.href}
            </div>
            {btn(copied ? '✅ Copied!' : 'Copy to Clipboard', async () => {
              await navigator.clipboard.writeText(`I scored ${score.toLocaleString()} points in Space 2048! 🌠 Play free at ${window.location.href}`);
              setCopied(true); setTimeout(() => setCopied(false), 2500);
            })}
          </Modal>
        )}

        {copied && !showShare && (
          <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', padding: '12px 28px', borderRadius: '50px', color: 'white', fontWeight: '600', zIndex: 500, boxShadow: '0 8px 32px rgba(124,58,237,0.5)', animation: 'slideUp 0.3s ease' }}>
            ✅ Score link copied to clipboard!
          </div>
        )}

        <style>{`
          @keyframes tilePop { 0% { transform: scale(0.7); opacity: 0.7; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
          * { box-sizing: border-box; }
          input:focus, textarea:focus { border-color: rgba(124,58,237,0.5) !important; }
          @media (max-width: 700px) {
            nav { display: none !important; }
            button[aria-label="Toggle menu"] { display: flex !important; }
          }
        `}</style>
      </div>
    </>
  );
}
