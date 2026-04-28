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
  2: '#4a5568', 4: '#2d3748', 8: '#1a365d', 16: '#2c5282',
  32: '#2b6cb0', 64: '#fbbf24', 128: '#f59e0b', 256: '#1f2937',
  512: '#6b21a8', 1024: '#4c1d95', 2048: '#7c3aed'
};

// ─── SEO Helmet ──────────────────────────────────────────────────────────────
const SEOHead = () => {
  useEffect(() => {
    document.title = 'Space 2048 — Merge Cosmic Objects';
  }, []);
  return null;
};

// ─── Shared UI Components ───────────────────────────────────────────────────
const AdPlaceholder = ({ slot, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', textTransform: 'uppercase', ...style
  }}>
    Advertisement · {slot}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: 'linear-gradient(160deg, #1a1a3e 0%, #0d0d22 100%)',
      border: '1px solid rgba(140,100,255,0.3)', borderRadius: '16px', maxWidth: '640px', width: '100%',
      maxHeight: '85vh', overflow: 'auto', padding: '32px', boxShadow: '0 25px 80px rgba(0,0,0,0.8)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#c4a8ff' }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#aaa', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Game Board Component (100% ORIGINAL MERGE LOGIC) ──────────────────────
const GameBoard = ({ onScoreUpdate, onGameOver, onWin, resetSignal }) => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Add a new tile
  const addNewTile = useCallback((currentGrid) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = 0; j < GRID_SIZE; j++)
        if (currentGrid[i][j] === 0) emptyCells.push({ row: i, col: j });
    if (emptyCells.length > 0) {
      const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    const newGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    addNewTile(newGrid);
    addNewTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
    onScoreUpdate(0);
  }, [addNewTile, onScoreUpdate]);

  useEffect(() => {
    initializeGame();
    const savedBest = localStorage.getItem('space2048Best');
    if (savedBest) setBestScore(parseInt(savedBest));
  }, [initializeGame]);

  useEffect(() => { if (resetSignal > 0) initializeGame(); }, [resetSignal, initializeGame]);

  const canMove = useCallback((currentGrid) => {
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = 0; j < GRID_SIZE; j++)
        if (currentGrid[i][j] === 0) return true;
    for (let i = 0; i < GRID_SIZE; i++)
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) return true;
        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) return true;
      }
    return false;
  }, []);

  const move = useCallback((direction) => {
    if (gameOver || won) return;

    let newGrid = grid.map(row => [...row]);
    let moved = false;
    let newScore = score;

    const slide = (row) => {
      const arr = row.filter(val => val !== 0);
      const merged = [];
      let i = 0;
      while (i < arr.length) {
        if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
          const mergedValue = arr[i] * 2;
          merged.push(mergedValue);
          newScore += mergedValue;
          if (mergedValue === 2048) { setWon(true); onWin(); }
          i += 2;
        } else {
          merged.push(arr[i]);
          i += 1;
        }
      }
      while (merged.length < GRID_SIZE) { merged.push(0); }
      return merged;
    };

    if (direction === 'left') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const newRow = slide(newGrid[i]);
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
      }
    } else if (direction === 'right') {
      for (let i = 0; i < GRID_SIZE; i++) {
        const reversed = [...newGrid[i]].reverse();
        const newRow = slide(reversed).reverse();
        if (JSON.stringify(newRow) !== JSON.stringify(newGrid[i])) moved = true;
        newGrid[i] = newRow;
      }
    } else if (direction === 'up') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newGrid.map(row => row[j]);
        const newColumn = slide(column);
        if (JSON.stringify(newColumn) !== JSON.stringify(column)) moved = true;
        for (let i = 0; i < GRID_SIZE; i++) { newGrid[i][j] = newColumn[i]; }
      }
    } else if (direction === 'down') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newGrid.map(row => row[j]);
        const reversed = [...column].reverse();
        const newColumn = slide(reversed).reverse();
        if (JSON.stringify(newColumn) !== JSON.stringify(column)) moved = true;
        for (let i = 0; i < GRID_SIZE; i++) { newGrid[i][j] = newColumn[i]; }
      }
    }

    if (moved) {
      addNewTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      onScoreUpdate(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('space2048Best', newScore.toString());
      }
      if (!canMove(newGrid)) { setGameOver(true); onGameOver(); }
    }
  }, [grid, gameOver, won, score, bestScore, addNewTile, canMove, onWin, onGameOver, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', W: 'up', S: 'down', A: 'left', D: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      if (keys[e.key]) { e.preventDefault(); move(keys[e.key]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
    <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '15px', borderRadius: '15px', border: '2px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', width: 'min(400px, 85vw)', aspectRatio: '1/1' }}>
        {grid.length > 0 && grid.map((row, i) => row.map((value, j) => (
          <div key={`${i}-${j}`} style={{ background: value === 0 ? 'rgba(255, 255, 255, 0.05)' : TILE_COLORS[value], borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: value >= 1024 ? '1.8rem' : '2.2rem', fontWeight: 'bold', animation: value !== 0 ? 'pop 0.2s ease' : 'none' }}>
            {value !== 0 && (
              <>
                <div style={{fontSize: '2rem'}}>{SPACE_TILES[value]?.emoji}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{value}</div>
              </>
            )}
          </div>
        )))}
      </div>
      {(gameOver || won) && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', zIndex: 10 }}>
          <div style={{ fontSize: '3rem' }}>{won ? '🎉' : '😢'}</div>
          <h2>{won ? 'You Won!' : 'Game Over'}</h2>
          <p>Score: {score}</p>
          <button onClick={() => initializeGame()} style={{ background: 'linear-gradient(45deg, #667eea, #764ba2)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>Try Again</button>
        </div>
      )}
    </div>
  );
};

// ─── Main App Component ──────────────────────────────────────────────────────
export default function Space2048App() {
  const [activePage, setActivePage] = useState('Game');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('space2048Best') || '0'));
  const [resetSignal, setResetSignal] = useState(0);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => JSON.parse(localStorage.getItem('s2048lb') || '[]'));

  const handleScoreUpdate = useCallback((s) => {
    setScore(s);
    if (s > bestScore) {
      setBestScore(s);
      localStorage.setItem('space2048Best', s.toString());
    }
  }, [bestScore]);

  const saveToLeaderboard = (name) => {
    const updated = [...leaderboard, { name: name || 'Anonymous', score, date: new Date().toLocaleDateString() }]
      .sort((a, b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('s2048lb', JSON.stringify(updated));
    setShowNamePrompt(false);
  };

  const navStyle = (page) => ({
    background: activePage === page ? 'rgba(120,80,255,0.3)' : 'transparent',
    color: activePage === page ? '#c4a8ff' : '#94a3b8',
    padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: activePage === page ? '600' : '400'
  });

  const btn = (label, onClick, variant = 'primary') => (
    <button onClick={onClick} style={{
      background: variant === 'primary' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.08)',
      border: 'none', padding: '10px 20px', borderRadius: '10px', color: 'white', fontWeight: '600', cursor: 'pointer'
    }}>{label}</button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#070714', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <SEOHead />
      <header style={{ background: 'rgba(7,7,20,0.95)', borderBottom: '1px solid #2d2d4a', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 onClick={() => setActivePage('Game')} style={{ cursor: 'pointer', margin: 0, color: '#a78bfa', fontSize: '1.4rem' }}>🌠 Space 2048</h2>
          <nav style={{ display: 'flex', gap: '5px' }}>
            {['Game', 'Leaderboard', 'About'].map(p => (
              <button key={p} onClick={() => { setActivePage(p); window.scrollTo(0,0); }} style={navStyle(p)}>{p}</button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        {activePage === 'Game' ? (
           <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.07)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>SCORE</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{score.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.07)', padding: '12px 24px', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>BEST</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700' }}>{bestScore.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {btn('New Game', () => setResetSignal(s => s + 1))}
                {btn('How to Play', () => setShowHowToPlay(true), 'secondary')}
              </div>
              <GameBoard onScoreUpdate={handleScoreUpdate} onGameOver={() => setShowNamePrompt(true)} onWin={() => {}} resetSignal={resetSignal} />
              <AdPlaceholder slot="Below Game" style={{ width: '100%', height: '90px', marginTop: '20px' }} />
           </div>
        ) : activePage === 'Leaderboard' ? (
           <div style={{ maxWidth: '600px', margin: '0 auto' }}>
             <h2 style={{ textAlign: 'center', color: '#c4b5fd' }}>Leaderboard</h2>
             {leaderboard.map((e, i) => (
               <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '15px', marginBottom: '8px', borderRadius: '10px' }}>
                 <span>{i + 1}. {e.name}</span>
                 <span style={{ fontWeight: 'bold', color: '#a78bfa' }}>{e.score.toLocaleString()}</span>
               </div>
             ))}
           </div>
        ) : (
           <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
             <h2 style={{color: '#c4b5fd'}}>About Space 2048</h2>
             <p style={{lineHeight: '1.6', color: '#94a3b8'}}>Merge objects from Asteroids to galaxies until you encompass the entire Universe.</p>
           </div>
        )}
      </main>

      {showHowToPlay && (
        <Modal title="How to Play" onClose={() => setShowHowToPlay(false)}>
          <div style={{color: '#94a3b8', lineHeight: '1.8'}}>
            <p>🎯 Merge tiles to reach the Universe (2048)!</p>
            <p>⬅️ Use Arrow keys / WASD or Swipe.</p>
            <p>✨ Matching tiles combine into one with double value.</p>
          </div>
        </Modal>
      )}

      {showNamePrompt && (
        <Modal title="🏆 New High Score!" onClose={() => setShowNamePrompt(false)}>
          <p style={{color: '#94a3b8'}}>You scored {score.toLocaleString()} points!</p>
          <input id="nameIn" placeholder="Enter your name" style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '8px', marginBottom: '16px' }} />
          {btn('Save Score', () => saveToLeaderboard(document.getElementById('nameIn').value))}
        </Modal>
      )}

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid #2d2d4a', opacity: 0.6, fontSize: '0.8rem' }}>
        <p>© {new Date().getFullYear()} Space 2048.</p>
      </footer>

      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}