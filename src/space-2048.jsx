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
    document.title = 'Space 2048 — Merge Cosmic Objects & Reach the Universe';
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

// ─── Game Board Component ──────────────────────
const GameBoard = ({ onScoreUpdate, onGameOver, onWin, resetSignal }) => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

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

    // Logic for left, right, up, down remains the same...
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
      if (!canMove(newGrid)) { 
        setGameOver(true); 
        onGameOver(); 
      }
    }
  }, [grid, gameOver, won, score, addNewTile, canMove, onWin, onGameOver, onScoreUpdate]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' };
      if (keys[e.key.toLowerCase()]) { e.preventDefault(); move(keys[e.key.toLowerCase()]); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  return (
    <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '15px', borderRadius: '15px', border: '2px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
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

      {/* NEW: GAME OVER POPUP OVERLAY */}
      {gameOver && (
        <div style={{ 
          position: 'absolute', 
          inset: 0, 
          background: 'rgba(7, 7, 20, 0.85)', 
          backdropFilter: 'blur(4px)',
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: '15px', 
          zIndex: 10,
          textAlign: 'center',
          animation: 'pop 0.3s ease-out'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '10px' }}>💀</div>
          <h2 style={{ color: '#fff', fontSize: '2rem', margin: '0 0 10px' }}>Mission Failed</h2>
          <p style={{ color: '#94a3b8', margin: '0 0 20px' }}>The board is full. Your score was {score.toLocaleString()}.</p>
          <div style={{ display: 'flex', gap: '10px' }}>
             <button 
                onClick={initializeGame} 
                style={{ 
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '10px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer' 
                }}
             >
                Try Again
             </button>
          </div>
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

  const sectionHeading = { color: '#c4b5fd', borderBottom: '1px solid rgba(196, 181, 253, 0.2)', paddingBottom: '8px', marginBottom: '16px' };
  const proseStyle = { lineHeight: '1.8', color: '#94a3b8' };

  return (
    <div style={{ minHeight: '100vh', background: '#070714', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      <SEOHead />
      <header style={{ background: 'rgba(7,7,20,0.95)', borderBottom: '1px solid #2d2d4a', padding: '15px 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 onClick={() => setActivePage('Game')} style={{ cursor: 'pointer', margin: 0, color: '#a78bfa', fontSize: '1.4rem' }}>🌠 Space 2048</h2>
          <nav style={{ display: 'flex', gap: '5px' }}>
            {['Game', 'Tips', 'Leaderboard', 'About'].map(p => (
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
              
              <AdPlaceholder slot="Game_Footer" style={{ width: '100%', height: '90px', marginTop: '20px' }} />

              <div style={{ width: '100%', maxWidth: '800px', marginTop: '40px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                <h3 style={sectionHeading}>Cosmic Info</h3>
                <p style={proseStyle}>
                  Space 2048 is a educational and entertaining journey through the celestial hierarchy. Starting with small <strong>Asteroids</strong>, users leverage strategic sliding to merge objects until they encompass a whole <strong>Universe</strong>. This game is built entirely in React and operates locally on your machine for maximum performance.
                </p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  <button onClick={() => setActivePage('Privacy')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</button>
                  <button onClick={() => setActivePage('TOS')} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</button>
                </div>
              </div>
           </div>
        ) : activePage === 'Tips' ? (
           <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h2 style={{ textAlign: 'center', color: '#c4b5fd', marginBottom: '32px' }}>Strategy Guide</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fbbf24' }}>📐 The Corner Strategy</h3>
                  <p style={proseStyle}>Pick a corner (usually bottom-left or bottom-right) and keep your highest value tile locked there. Never press the direction that moves it out of that corner unless absolutely necessary.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fbbf24' }}>🐍 The Snake Method</h3>
                  <p style={proseStyle}>Build your tiles in a descending order like a snake. For example: [1024][512][256][128]. This allows for chain merges that clear the board quickly.</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px' }}>
                  <h3 style={{ color: '#fbbf24' }}>🚫 Pick Three Directions</h3>
                  <p style={proseStyle}>Try to only use three movement keys. If you are anchoring tiles at the bottom, only use Left, Right, and Down. Using "Up" might trap small tiles behind large ones.</p>
                </div>
              </div>
              <AdPlaceholder slot="Tips_Bottom" style={{ width: '100%', height: '60px', marginTop: '30px' }} />
           </div>
        ) : activePage === 'Leaderboard' ? (
           <div style={{ maxWidth: '600px', margin: '0 auto' }}>
             <h2 style={{ textAlign: 'center', color: '#c4b5fd' }}>Galactic High Scores</h2>
             {leaderboard.length === 0 ? <p style={{textAlign: 'center', color: '#64748b'}}>No missions logged yet. Be the first!</p> :
              leaderboard.map((e, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '15px', marginBottom: '8px', borderRadius: '10px' }}>
                  <span>{i + 1}. {e.name}</span>
                  <span style={{ fontWeight: 'bold', color: '#a78bfa' }}>{e.score.toLocaleString()}</span>
                </div>
              ))
             }
             <AdPlaceholder slot="Leaderboard_Bottom" style={{ width: '100%', height: '60px', marginTop: '30px' }} />
           </div>
        ) : activePage === 'About' ? (
           <div style={{ maxWidth: '800px', margin: '0 auto' }}>
             <h2 style={{color: '#c4b5fd', textAlign: 'center', marginBottom: '24px'}}>About Space 2048</h2>
             <div style={{background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '16px'}}>
               <h3 style={sectionHeading}>The Mission</h3>
               <p style={proseStyle}>Space 2048 was designed to merge the addictive logic of numerical puzzles with the awe-inspiring scale of our universe. Every tile represents a leap in mass and complexity—from rocky debris to the fundamental building blocks of existence.</p>
               
               <h3 style={sectionHeading}>Meet the Cosmic Objects</h3>
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px', marginTop: '20px' }}>
                 {Object.entries(SPACE_TILES).map(([val, {emoji, name}]) => (
                   <div key={val} style={{ textAlign: 'center', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                     <div style={{fontSize: '1.5rem'}}>{emoji}</div>
                     <div style={{fontSize: '0.8rem', fontWeight: 'bold', marginTop: '5px'}}>{name}</div>
                     <div style={{fontSize: '0.7rem', color: '#64748b'}}>{val}</div>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        ) : activePage === 'Privacy' ? (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={sectionHeading}>Privacy Policy</h2>
            <p style={proseStyle}>
              Your privacy is paramount. Space 2048 is a client-side application.
              <br/><br/>
              • <strong>Data Storage:</strong> All game data, high scores, and leaderboard entries are stored locally on your device using <code>localStorage</code>. We do not transmit this data to any external servers.
              <br/>• <strong>Cookies:</strong> This site does not use tracking cookies.
              <br/>• <strong>Third-Party Ads:</strong> If ads are present, they may collect anonymous data as per the provider's policy.
            </p>
            {btn('Back to Game', () => setActivePage('Game'), 'secondary')}
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={sectionHeading}>Terms of Service</h2>
            <p style={proseStyle}>
              By playing Space 2048, you agree to the following:
              <br/><br/>
              1. <strong>Usage:</strong> This game is provided "as is" for entertainment purposes.
              <br/>2. <strong>Intellectual Property:</strong> All cosmic assets and code are property of the game creator. The core gameplay mechanic is inspired by the open-source 2048 by Gabriele Cirulli.
              <br/>3. <strong>Fair Play:</strong> Users are encouraged to achieve scores through legitimate gameplay.
            </p>
            {btn('Back to Game', () => setActivePage('Game'), 'secondary')}
          </div>
        )}
      </main>

      {showHowToPlay && (
        <Modal title="How to Play 🚀" onClose={() => setShowHowToPlay(false)}>
          <div style={{color: '#94a3b8', lineHeight: '1.8'}}>
            <p><strong>Step 1:</strong> Use your <strong>Arrow Keys</strong>, <strong>WASD</strong>, or <strong>Swipe</strong> to move all cosmic objects in a direction.</p>
            <p><strong>Step 2:</strong> When two identical objects collide, they merge! 🪨 + 🪨 = 🌑.</p>
            <p><strong>Step 3:</strong> Keep merging until you reach the 🌠 <strong>Universe (2048)</strong>.</p>
            <p><strong>Step 4:</strong> If the board fills up and you can't move, the mission ends.</p>
            <div style={{marginTop: '20px', padding: '15px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '10px'}}>
              <strong>Tip:</strong> Try to keep your most massive object in one of the corners!
            </div>
          </div>
        </Modal>
      )}

      {showNamePrompt && (
        <Modal title="🏆 Save Your Legacy" onClose={() => setShowNamePrompt(false)}>
          <p style={{color: '#94a3b8'}}>You scored {score.toLocaleString()} points! Enter your name to be remembered in the stars.</p>
          <input id="nameIn" placeholder="Enter Pilot Name" maxLength="15" style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #444', borderRadius: '8px', marginBottom: '16px', outline: 'none' }} />
          {btn('Submit Score', () => saveToLeaderboard(document.getElementById('nameIn').value))}
        </Modal>
      )}

      <footer style={{ textAlign: 'center', padding: '40px', borderTop: '1px solid #2d2d4a', opacity: 0.6, fontSize: '0.8rem' }}>
        <p>© {new Date().getFullYear()} Space 2048 • Built for Cosmic Explorers</p>
      </footer>

      <style>{`
        @keyframes pop { 0% { transform: scale(0.8); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        input:focus { border-color: #a78bfa !important; }
      `}</style>
    </div>
  );
}