import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & CONFIG
// ═══════════════════════════════════════════════════════════════
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
  2: '#3d3d6b', 4: '#2d2d5e', 8: '#1a2a5e', 16: '#1a3a7a',
  32: '#1e4d9e', 64: '#b45309', 128: '#92400e', 256: '#1f1f3e',
  512: '#5b21b6', 1024: '#4c1d95', 2048: '#6d28d9'
};

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════
const createEmptyGrid = () => Array.from({length: GRID_SIZE}, () => Array(GRID_SIZE).fill(0));

const cloneGrid = (g) => g.map(r => [...r]);

const addRandomTile = (grid) => {
  const empty = [];
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (grid[r][c] === 0) empty.push([r, c]);
  if (!empty.length) return grid;
  const newGrid = cloneGrid(grid);
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const slideRow = (row) => {
  const vals = row.filter(v => v !== 0);
  const result = [];
  let gained = 0;
  let i = 0;
  while (i < vals.length) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      const merged = vals[i] * 2;
      result.push(merged);
      gained += merged;
      i += 2;
    } else {
      result.push(vals[i]);
      i++;
    }
  }
  while (result.length < GRID_SIZE) result.push(0);
  return { row: result, gained };
};

const moveGrid = (grid, direction) => {
  let newGrid = cloneGrid(grid);
  let totalGained = 0;
  let moved = false;

  if (direction === 'left') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const { row, gained } = slideRow(newGrid[r]);
      if (row.join() !== newGrid[r].join()) moved = true;
      newGrid[r] = row;
      totalGained += gained;
    }
  } else if (direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const { row, gained } = slideRow([...newGrid[r]].reverse());
      const reversed = row.reverse();
      if (reversed.join() !== newGrid[r].join()) moved = true;
      newGrid[r] = reversed;
      totalGained += gained;
    }
  } else if (direction === 'up') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = newGrid.map(r => r[c]);
      const { row, gained } = slideRow(col);
      if (row.join() !== col.join()) moved = true;
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = row[r];
      totalGained += gained;
    }
  } else if (direction === 'down') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const col = newGrid.map(r => r[c]);
      const { row, gained } = slideRow([...col].reverse());
      const reversed = row.reverse();
      if (reversed.join() !== col.join()) moved = true;
      for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = reversed[r];
      totalGained += gained;
    }
  }

  return { grid: newGrid, gained: totalGained, moved };
};

const canMove = (grid) => {
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c+1]) return true;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r+1][c]) return true;
    }
  return false;
};

// ═══════════════════════════════════════════════════════════════
// STARFIELD BACKGROUND
// ═══════════════════════════════════════════════════════════════
const StarField = () => {
  const stars = useRef([]);
  if (!stars.current.length) {
    stars.current = Array.from({length: 120}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      dur: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    }));
  }
  return (
    <div style={{position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0}}>
      <svg width="100%" height="100%" style={{position:'absolute',inset:0}}>
        <defs>
          <radialGradient id="nebula1" cx="20%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#4c1d95" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="nebula2" cx="80%" cy="70%" r="35%">
            <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#nebula1)"/>
        <rect width="100%" height="100%" fill="url(#nebula2)"/>
        {stars.current.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.size} fill="white">
            <animate attributeName="opacity" values="0.2;1;0.2" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite"/>
          </circle>
        ))}
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SHARED UI
// ═══════════════════════════════════════════════════════════════
const glass = {
  background: 'rgba(10,8,30,0.7)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(139,92,246,0.2)',
  borderRadius: '16px',
};

const AdPlaceholder = ({ slot, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', letterSpacing: '0.1em',
    textTransform: 'uppercase', ...style
  }}>Advertisement · {slot}</div>
);

const Modal = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    backdropFilter: 'blur(8px)', zIndex: 2000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      ...glass, maxWidth: '600px', width: '100%',
      maxHeight: '85vh', overflow: 'auto', padding: '32px',
      boxShadow: '0 0 60px rgba(139,92,246,0.15)',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <h2 style={{margin:0,color:'#c4b5fd',fontSize:'1.3rem'}}>{title}</h2>
        <button onClick={onClose} style={{background:'rgba(255,255,255,0.1)',border:'none',color:'#aaa',borderRadius:'50%',width:'32px',height:'32px',cursor:'pointer',fontSize:'1rem'}}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const PrimaryBtn = ({children, onClick, style={}}) => (
  <button onClick={onClick} style={{
    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
    border: 'none', padding: '11px 22px', borderRadius: '10px',
    color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem',
    boxShadow: '0 0 20px rgba(124,58,237,0.35)', transition: 'transform 0.1s',
    ...style
  }} onMouseEnter={e=>e.target.style.transform='scale(1.04)'} onMouseLeave={e=>e.target.style.transform='scale(1)'}>{children}</button>
);

const GhostBtn = ({children, onClick, style={}}) => (
  <button onClick={onClick} style={{
    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
    padding: '11px 22px', borderRadius: '10px', color: '#c4b5fd', fontWeight: '600',
    cursor: 'pointer', fontSize: '0.95rem', transition: 'background 0.2s', ...style
  }}>{children}</button>
);

// ═══════════════════════════════════════════════════════════════
// SPACE 2048 GAME — FIXED
// ═══════════════════════════════════════════════════════════════
const Space2048 = ({ onScoreUpdate, globalBest }) => {
  // Use refs for game state to avoid stale closures in keydown handler
  const gridRef = useRef(null);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);

  // Display state (triggers re-renders)
  const [displayGrid, setDisplayGrid] = useState(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayGameOver, setDisplayGameOver] = useState(false);
  const [displayWon, setDisplayWon] = useState(false);
  const [bestScore, setBestScore] = useState(() => parseInt(localStorage.getItem('an2048best') || '0'));
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [leaderboard, setLeaderboard] = useState(() => {
    try { return JSON.parse(localStorage.getItem('an2048lb') || '[]'); } catch { return []; }
  });

  const syncDisplay = useCallback(() => {
    setDisplayGrid(cloneGrid(gridRef.current));
    setDisplayScore(scoreRef.current);
    setDisplayGameOver(gameOverRef.current);
    setDisplayWon(wonRef.current);
  }, []);

  const initGame = useCallback(() => {
    let g = createEmptyGrid();
    g = addRandomTile(g);
    g = addRandomTile(g);
    gridRef.current = g;
    scoreRef.current = 0;
    gameOverRef.current = false;
    wonRef.current = false;
    syncDisplay();
    onScoreUpdate(0);
  }, [syncDisplay, onScoreUpdate]);

  useEffect(() => { initGame(); }, [initGame]);

  const handleMove = useCallback((direction) => {
    if (!gridRef.current || gameOverRef.current || wonRef.current) return;

    const { grid: movedGrid, gained, moved } = moveGrid(gridRef.current, direction);
    if (!moved) return;

    const newGrid = addRandomTile(movedGrid);
    const newScore = scoreRef.current + gained;

    gridRef.current = newGrid;
    scoreRef.current = newScore;

    const hasWon = newGrid.some(row => row.some(v => v === 2048));
    if (hasWon) { wonRef.current = true; setDisplayWon(true); }

    const isOver = !canMove(newGrid);
    if (isOver) { gameOverRef.current = true; setDisplayGameOver(true); }

    setDisplayGrid(cloneGrid(newGrid));
    setDisplayScore(newScore);
    onScoreUpdate(newScore);

    if (newScore > bestScore) {
      setBestScore(newScore);
      localStorage.setItem('an2048best', newScore.toString());
    }
  }, [bestScore, onScoreUpdate]);

  // Key handler — no stale closure since it reads refs directly
  useEffect(() => {
    const MAP = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
      a: 'left', d: 'right', w: 'up', s: 'down',
      A: 'left', D: 'right', W: 'up', S: 'down',
    };
    const onKey = (e) => {
      const dir = MAP[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMove]);

  // Touch swipe
  const touchStart = useRef(null);
  const onTouchStart = (e) => { touchStart.current = e.touches[0]; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.clientX;
    const dy = e.changedTouches[0].clientY - touchStart.current.clientY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left');
    else handleMove(dy > 0 ? 'down' : 'up');
    touchStart.current = null;
  };

  const saveScore = (name) => {
    const entry = { name: name || 'Anonymous', score: scoreRef.current, date: new Date().toLocaleDateString() };
    const updated = [...leaderboard, entry].sort((a,b) => b.score - a.score).slice(0, 10);
    setLeaderboard(updated);
    localStorage.setItem('an2048lb', JSON.stringify(updated));
    setShowNamePrompt(false);
  };

  const onGameOverDismiss = () => setShowNamePrompt(true);

  if (!displayGrid) return <div style={{color:'#94a3b8',padding:'40px',textAlign:'center'}}>Loading...</div>;

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'20px'}}>
      {/* Score row */}
      <div style={{display:'flex',gap:'12px'}}>
        {[['SCORE', displayScore], ['BEST', bestScore]].map(([label, val]) => (
          <div key={label} style={{...glass, padding:'12px 28px', textAlign:'center', minWidth:'100px'}}>
            <div style={{fontSize:'0.65rem',color:'#64748b',letterSpacing:'0.1em'}}>{label}</div>
            <div style={{fontSize:'1.8rem',fontWeight:'800',color:'#e2e8f0'}}>{val.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:'flex',gap:'8px'}}>
        <PrimaryBtn onClick={initGame}>New Game</PrimaryBtn>
      </div>

      {/* Board */}
      <div
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        style={{
          ...glass, padding:'12px', position:'relative',
          boxShadow:'0 0 40px rgba(79,70,229,0.2)',
        }}
      >
        <div style={{
          display:'grid', gridTemplateColumns:`repeat(${GRID_SIZE},1fr)`,
          gap:'8px', width:'min(380px,88vw)', aspectRatio:'1/1'
        }}>
          {displayGrid.map((row, r) => row.map((val, c) => (
            <div key={`${r}-${c}`} style={{
              background: val === 0 ? 'rgba(255,255,255,0.04)' : (TILE_COLORS[val] || '#3730a3'),
              borderRadius:'10px', display:'flex', flexDirection:'column',
              alignItems:'center', justifyContent:'center',
              border: val ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)',
              boxShadow: val ? '0 0 12px rgba(139,92,246,0.15)' : 'none',
              transition: 'background 0.1s',
            }}>
              {val !== 0 && (
                <>
                  <div style={{fontSize:'clamp(1.2rem,4vw,1.8rem)'}}>{SPACE_TILES[val]?.emoji || '✨'}</div>
                  <div style={{fontSize:'clamp(0.5rem,2vw,0.65rem)',color:'rgba(255,255,255,0.6)',marginTop:'2px'}}>{val}</div>
                </>
              )}
            </div>
          )))}
        </div>

        {/* Game Over overlay */}
        {displayGameOver && (
          <div style={{
            position:'absolute',inset:0,background:'rgba(5,5,20,0.88)',backdropFilter:'blur(6px)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            borderRadius:'16px',zIndex:10,textAlign:'center',padding:'20px',
          }}>
            <div style={{fontSize:'3.5rem',marginBottom:'8px'}}>💀</div>
            <h2 style={{color:'#f8fafc',margin:'0 0 8px',fontSize:'1.8rem'}}>Mission Failed</h2>
            <p style={{color:'#94a3b8',margin:'0 0 20px'}}>Score: {displayScore.toLocaleString()}</p>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'}}>
              <PrimaryBtn onClick={initGame}>Try Again</PrimaryBtn>
              <GhostBtn onClick={onGameOverDismiss}>Save Score</GhostBtn>
            </div>
          </div>
        )}

        {/* Win overlay */}
        {displayWon && !displayGameOver && (
          <div style={{
            position:'absolute',inset:0,background:'rgba(91,33,182,0.85)',backdropFilter:'blur(6px)',
            display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
            borderRadius:'16px',zIndex:10,textAlign:'center',padding:'20px',
          }}>
            <div style={{fontSize:'3.5rem',marginBottom:'8px'}}>🌠</div>
            <h2 style={{color:'#fef9c3',margin:'0 0 8px',fontSize:'1.8rem'}}>Universe Reached!</h2>
            <p style={{color:'#e9d5ff',margin:'0 0 20px'}}>Score: {displayScore.toLocaleString()}</p>
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'}}>
              <PrimaryBtn onClick={() => { wonRef.current = false; setDisplayWon(false); }}>Keep Playing</PrimaryBtn>
              <GhostBtn onClick={initGame}>New Game</GhostBtn>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <p style={{color:'rgba(255,255,255,0.3)',fontSize:'0.8rem',margin:0,textAlign:'center'}}>
        Arrow keys / WASD / Swipe to move
      </p>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div style={{...glass,padding:'20px',width:'100%',maxWidth:'400px'}}>
          <h3 style={{color:'#c4b5fd',margin:'0 0 14px',fontSize:'0.95rem',letterSpacing:'0.05em'}}>🏆 TOP SCORES</h3>
          {leaderboard.slice(0,5).map((e,i) => (
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
              <span style={{color:'#94a3b8'}}>{i+1}. {e.name}</span>
              <span style={{color:'#a78bfa',fontWeight:'700'}}>{e.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <AdPlaceholder slot="2048_Footer" style={{width:'100%',maxWidth:'400px',height:'80px'}}/>

      {showNamePrompt && (
        <Modal title="🏆 Save Your Legacy" onClose={() => setShowNamePrompt(false)}>
          <p style={{color:'#94a3b8'}}>You scored {displayScore.toLocaleString()} points!</p>
          <input id="pilotName" placeholder="Enter Pilot Name" maxLength="15"
            style={{width:'100%',padding:'12px',background:'rgba(0,0,0,0.4)',color:'#fff',border:'1px solid rgba(139,92,246,0.4)',borderRadius:'8px',marginBottom:'16px',outline:'none',boxSizing:'border-box'}}/>
          <PrimaryBtn onClick={() => saveScore(document.getElementById('pilotName').value)}>Submit</PrimaryBtn>
        </Modal>
      )}

      <style>{`@keyframes tilePop { 0%{transform:scale(0.7)} 60%{transform:scale(1.06)} 100%{transform:scale(1)} }`}</style>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROCKET ARENA GAME
// ═══════════════════════════════════════════════════════════════
const RocketArena = ({ onScoreUpdate }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const animRef = useRef(null);
  const [uiScore, setUiScore] = useState(0);
  const [uiHealth, setUiHealth] = useState(100);
  const [uiLevel, setUiLevel] = useState(1);
  const [uiGameOver, setUiGameOver] = useState(false);
  const [uiWave, setUiWave] = useState(1);
  const [uiPowerup, setUiPowerup] = useState('');
  const [uiKills, setUiKills] = useState(0);
  const [uiXP, setUiXP] = useState({current:0, next:100});
  const [gameStarted, setGameStarted] = useState(false);
  const keysRef = useRef({});
  const mouseRef = useRef({x:0,y:0,down:false});
  const autoFireRef = useRef(false);
  const leaderboard = JSON.parse(localStorage.getItem('anArenalb') || '[]');

  const initState = () => ({
    player: {
      x: 400, y: 400, vx: 0, vy: 0,
      health: 100, maxHealth: 100,
      speed: 3.5, size: 14,
      fireRate: 12, fireCooldown: 0,
      level: 1, xp: 0, xpNext: 100,
      kills: 0, score: 0,
    },
    bullets: [],
    enemyBullets: [],
    enemies: [],
    particles: [],
    powerups: [],
    floatTexts: [],
    wave: 1,
    waveTimer: 0,
    waveCooldown: 0,
    spawnTimer: 0,
    spawnRate: 120,
    currentPowerup: null,
    powerupTimer: 0,
    time: 0,
    gameOver: false,
  });

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    stateRef.current = initState();
    stateRef.current.player.x = canvas.width / 2;
    stateRef.current.player.y = canvas.height / 2;
    setUiGameOver(false);
    setUiScore(0);
    setUiHealth(100);
    setUiLevel(1);
    setUiWave(1);
    setUiPowerup('');
    setUiKills(0);
    setUiXP({current:0,next:100});
    setGameStarted(true);
  }, []);

  useEffect(() => {
    if (!gameStarted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const onKey = (e) => {
      keysRef.current[e.code] = e.type === 'keydown';
      if (e.code === 'Space') { e.preventDefault(); autoFireRef.current = e.type === 'keydown'; }
      if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    };
    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      if (e.type === 'mousedown') mouseRef.current.down = true;
      if (e.type === 'mouseup') mouseRef.current.down = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mousedown', onMouse);
    canvas.addEventListener('mouseup', onMouse);

    const spawnEnemy = (s) => {
      const canvas = canvasRef.current;
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) { x = Math.random()*canvas.width; y = -20; }
      else if (side === 1) { x = canvas.width+20; y = Math.random()*canvas.height; }
      else if (side === 2) { x = Math.random()*canvas.width; y = canvas.height+20; }
      else { x = -20; y = Math.random()*canvas.height; }

      const waveBonus = (s.wave - 1) * 0.15;
      const types = s.wave < 2 ? [0,0,0,1] : s.wave < 3 ? [0,0,1,1,2] : [0,1,1,2,2,3,4];
      const type = types[Math.floor(Math.random() * types.length)];

      const configs = [
        { name:'Drone', color:'#ef4444', size:12, health:1+waveBonus*3, speed:1.2+waveBonus*0.5, score:10, fireRate:0 },
        { name:'Kamikazee', color:'#f97316', size:10, health:0.5, speed:2.8+waveBonus, score:15, fireRate:0, kamikaze:true },
        { name:'Shooter', color:'#a855f7', size:14, health:2+waveBonus*2, speed:0.8, score:25, fireRate:90-s.wave*5 },
        { name:'Tank', color:'#6b7280', size:20, health:8+waveBonus*5, speed:0.5, score:50, fireRate:0 },
        { name:'Swarm', color:'#eab308', size:8, health:0.4, speed:1.8+waveBonus, score:8, fireRate:0 },
      ];
      const cfg = configs[type];
      s.enemies.push({ x, y, vx:0, vy:0, health:cfg.health, maxHealth:cfg.health, ...cfg, fireCooldown:Math.random()*120, type });
    };

    const fireBullet = (s, canvas) => {
      const p = s.player;
      const dx = mouseRef.current.x - p.x;
      const dy = mouseRef.current.y - p.y;
      const len = Math.sqrt(dx*dx+dy*dy) || 1;
      const nx = dx/len, ny = dy/len;
      const power = s.currentPowerup;
      if (power === 'triple') {
        [-0.25,0,0.25].forEach(offset => {
          const angle = Math.atan2(ny,nx) + offset;
          s.bullets.push({x:p.x,y:p.y,vx:Math.cos(angle)*9,vy:Math.sin(angle)*9,dmg:1,size:4,color:'#38bdf8',life:60});
        });
      } else if (power === 'laser') {
        s.bullets.push({x:p.x,y:p.y,vx:nx*14,vy:ny*14,dmg:2,size:3,color:'#fb7185',life:45,laser:true});
      } else if (power === 'cannon') {
        s.bullets.push({x:p.x,y:p.y,vx:nx*7,vy:ny*7,dmg:5,size:8,color:'#fbbf24',life:60});
      } else {
        s.bullets.push({x:p.x,y:p.y,vx:nx*10,vy:ny*10,dmg:1,size:4,color:'#a5f3fc',life:55});
      }
    };

    const addParticles = (x, y, color, count=8) => {
      for (let i=0;i<count;i++) {
        const angle = Math.random()*Math.PI*2;
        const spd = Math.random()*3+1;
        stateRef.current.particles.push({x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,color,life:30+Math.random()*20,maxLife:50,size:Math.random()*3+1});
      }
    };

    const addFloatText = (x, y, text, color='#fbbf24') => {
      stateRef.current.floatTexts.push({x,y,text,color,life:60,vy:-1.2});
    };

    const grantXP = (s, amount) => {
      s.player.xp += amount;
      if (s.player.xp >= s.player.xpNext) {
        s.player.xp -= s.player.xpNext;
        s.player.level++;
        s.player.xpNext = Math.floor(s.player.xpNext * 1.4);
        s.player.maxHealth += 20;
        s.player.health = Math.min(s.player.health + 30, s.player.maxHealth);
        s.player.speed += 0.15;
        addFloatText(s.player.x, s.player.y - 30, `LEVEL UP!`, '#a78bfa');
      }
    };

    const POWERUP_TYPES = ['triple','laser','cannon','rapidfire','shield','health'];
    const POWERUP_COLORS = {triple:'#38bdf8',laser:'#fb7185',cannon:'#fbbf24',rapidfire:'#34d399',shield:'#818cf8',health:'#f9a8d4'};
    const POWERUP_EMOJIS = {triple:'🔱',laser:'🔴',cannon:'💣',rapidfire:'⚡',shield:'🛡️',health:'💊'};

    const gameLoop = () => {
      const s = stateRef.current;
      if (!s || s.gameOver) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const W = canvas.width, H = canvas.height;

      // Background
      ctx.fillStyle = '#050510';
      ctx.fillRect(0,0,W,H);
      // Subtle grid
      ctx.strokeStyle = 'rgba(139,92,246,0.04)';
      ctx.lineWidth = 1;
      for (let x=0;x<W;x+=60) { ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
      for (let y=0;y<H;y+=60) { ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke(); }

      s.time++;
      const p = s.player;

      // Player movement
      let mvx=0, mvy=0;
      if (keysRef.current['KeyA']||keysRef.current['ArrowLeft']) mvx=-1;
      if (keysRef.current['KeyD']||keysRef.current['ArrowRight']) mvx=1;
      if (keysRef.current['KeyW']||keysRef.current['ArrowUp']) mvy=-1;
      if (keysRef.current['KeyS']||keysRef.current['ArrowDown']) mvy=1;
      if (mvx!==0&&mvy!==0) { mvx*=0.707; mvy*=0.707; }
      let spd = p.speed;
      if (s.currentPowerup==='rapidfire') spd*=1.2;
      p.x = Math.max(p.size, Math.min(W-p.size, p.x+mvx*spd));
      p.y = Math.max(p.size, Math.min(H-p.size, p.y+mvy*spd));

      // Firing
      let fr = p.fireRate;
      if (s.currentPowerup==='rapidfire') fr = Math.floor(fr*0.4);
      if (p.fireCooldown>0) p.fireCooldown--;
      if ((mouseRef.current.down||autoFireRef.current) && p.fireCooldown<=0) {
        fireBullet(s, canvas);
        p.fireCooldown = fr;
      }

      // Powerup timer
      if (s.powerupTimer>0) { s.powerupTimer--; if(s.powerupTimer===0){s.currentPowerup=null;setUiPowerup('');} }

      // Spawning
      s.spawnTimer++;
      if (s.spawnTimer >= s.spawnRate) {
        spawnEnemy(s);
        s.spawnTimer=0;
        s.spawnRate = Math.max(40, 120 - s.wave*12);
      }
      // Wave timer
      s.waveTimer++;
      if (s.waveTimer >= 1800) { s.wave++; s.waveTimer=0; setUiWave(s.wave); }

      // Random powerup drop
      if (Math.random() < 0.0008) {
        const type = POWERUP_TYPES[Math.floor(Math.random()*POWERUP_TYPES.length)];
        s.powerups.push({x:Math.random()*(W-80)+40,y:Math.random()*(H-80)+40,type,life:400,maxLife:400});
      }

      // Update bullets
      s.bullets = s.bullets.filter(b=>{
        b.x+=b.vx; b.y+=b.vy; b.life--;
        if(b.x<0||b.x>W||b.y<0||b.y>H||b.life<=0) return false;
        // Draw
        ctx.beginPath();
        if(b.laser){ ctx.strokeStyle=b.color;ctx.lineWidth=b.size;ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*3,b.y-b.vy*3);ctx.stroke(); }
        else { ctx.fillStyle=b.color;ctx.arc(b.x,b.y,b.size,0,Math.PI*2);ctx.fill(); }
        return true;
      });

      // Update enemies
      s.enemies = s.enemies.filter(e=>{
        const dx=p.x-e.x, dy=p.y-e.y;
        const dist=Math.sqrt(dx*dx+dy*dy)||1;
        const nx=dx/dist, ny=dy/dist;
        if(e.kamikaze){ e.vx+=nx*0.15; e.vy+=ny*0.15; }
        else { e.vx=nx*e.speed; e.vy=ny*e.speed; }
        e.x+=e.vx; e.y+=e.vy;

        // Enemy shooting
        if(e.fireRate && e.type===2){
          e.fireCooldown--;
          if(e.fireCooldown<=0){
            s.enemyBullets.push({x:e.x,y:e.y,vx:nx*3.5,vy:ny*3.5,size:5,life:80,color:'#f97316'});
            e.fireCooldown=Math.max(40,e.fireRate);
          }
        }

        // Hit player
        if(dist<e.size+p.size){
          if(s.currentPowerup!=='shield'){
            const dmg = e.type===3?8:3;
            p.health -= dmg;
            addParticles(p.x,p.y,'#ef4444',5);
            setUiHealth(Math.max(0,p.health));
            if(p.health<=0){ s.gameOver=true; setUiGameOver(true); return false; }
          }
          return false;
        }

        // Bullet collision
        let hit=false;
        s.bullets.forEach(b=>{
          const bx=b.x-e.x,by=b.y-e.y;
          if(Math.sqrt(bx*bx+by*by)<e.size+b.size){
            e.health-=b.dmg;
            if(!b.laser){b.life=0;}
            addParticles(e.x,e.y,e.color,4);
            if(e.health<=0){
              hit=true;
              p.score+=e.score; p.kills++;
              grantXP(s, Math.ceil(e.score/5));
              addParticles(e.x,e.y,e.color,12);
              addFloatText(e.x,e.y-10,`+${e.score}`);
              setUiScore(p.score); setUiKills(p.kills);
              setUiHealth(Math.round(p.health));
              setUiLevel(p.level);
              setUiXP({current:p.xp,next:p.xpNext});
              onScoreUpdate(p.score);
            }
          }
        });
        if(hit) return false;

        // Draw enemy
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(Math.atan2(dy,dx)+Math.PI);
        ctx.fillStyle=e.color;
        ctx.shadowColor=e.color; ctx.shadowBlur=8;
        if(e.type===3){
          ctx.fillRect(-e.size,-e.size,e.size*2,e.size*2);
        } else if(e.type===4){
          ctx.beginPath();ctx.arc(0,0,e.size,0,Math.PI*2);ctx.fill();
        } else {
          ctx.beginPath();ctx.moveTo(e.size,0);ctx.lineTo(-e.size,e.size*0.6);ctx.lineTo(-e.size,-e.size*0.6);ctx.closePath();ctx.fill();
        }
        ctx.restore();
        // Health bar
        if(e.maxHealth>1){
          ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(e.x-e.size,e.y-e.size-8,e.size*2,4);
          ctx.fillStyle=e.health>e.maxHealth*0.5?'#22c55e':'#ef4444';
          ctx.fillRect(e.x-e.size,e.y-e.size-8,e.size*2*(e.health/e.maxHealth),4);
        }
        return true;
      });

      // Enemy bullets
      s.enemyBullets = s.enemyBullets.filter(b=>{
        b.x+=b.vx;b.y+=b.vy;b.life--;
        if(b.x<0||b.x>W||b.y<0||b.y>H||b.life<=0) return false;
        const dx=b.x-p.x,dy=b.y-p.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.size+b.size&&s.currentPowerup!=='shield'){
          p.health-=2;setUiHealth(Math.max(0,Math.round(p.health)));
          if(p.health<=0){s.gameOver=true;setUiGameOver(true);}
          return false;
        }
        ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,b.size,0,Math.PI*2);ctx.fill();
        return true;
      });

      // Powerups
      s.powerups = s.powerups.filter(pu=>{
        pu.life--;
        if(pu.life<=0) return false;
        const dx=p.x-pu.x,dy=p.y-pu.y;
        if(Math.sqrt(dx*dx+dy*dy)<p.size+15){
          if(pu.type==='health'){ p.health=Math.min(p.maxHealth,p.health+40);setUiHealth(Math.round(p.health)); addFloatText(pu.x,pu.y,'💊 +40 HP','#f9a8d4'); }
          else { s.currentPowerup=pu.type; s.powerupTimer=600; setUiPowerup(pu.type); addFloatText(pu.x,pu.y,`${POWERUP_EMOJIS[pu.type]} ${pu.type.toUpperCase()}!`,'#a78bfa'); }
          return false;
        }
        const alpha = Math.min(1,(pu.life/pu.maxLife)*2);
        ctx.globalAlpha=alpha;
        ctx.font='20px sans-serif';ctx.textAlign='center';
        ctx.fillText(POWERUP_EMOJIS[pu.type],pu.x,pu.y);
        ctx.strokeStyle=POWERUP_COLORS[pu.type];ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(pu.x,pu.y,16,0,Math.PI*2);ctx.stroke();
        ctx.globalAlpha=1;
        return true;
      });

      // Particles
      s.particles = s.particles.filter(pt=>{
        pt.x+=pt.vx;pt.y+=pt.vy;pt.life--;pt.vx*=0.94;pt.vy*=0.94;
        ctx.globalAlpha=pt.life/pt.maxLife;
        ctx.fillStyle=pt.color;ctx.beginPath();ctx.arc(pt.x,pt.y,pt.size,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
        return pt.life>0;
      });

      // Float texts
      s.floatTexts = s.floatTexts.filter(ft=>{
        ft.y+=ft.vy;ft.life--;
        ctx.globalAlpha=ft.life/60;
        ctx.fillStyle=ft.color;ctx.font='bold 13px sans-serif';ctx.textAlign='center';
        ctx.fillText(ft.text,ft.x,ft.y);
        ctx.globalAlpha=1;
        return ft.life>0;
      });

      // Draw player
      ctx.save();
      ctx.translate(p.x,p.y);
      const angle=Math.atan2(mouseRef.current.y-p.y,mouseRef.current.x-p.x);
      ctx.rotate(angle);
      if(s.currentPowerup==='shield'){
        ctx.strokeStyle='rgba(129,140,248,0.5)';ctx.lineWidth=3;
        ctx.beginPath();ctx.arc(0,0,p.size+8,0,Math.PI*2);ctx.stroke();
      }
      ctx.shadowColor='#a78bfa';ctx.shadowBlur=12;
      ctx.fillStyle='#a78bfa';
      ctx.beginPath();ctx.moveTo(p.size,0);ctx.lineTo(-p.size+4,p.size*0.7);ctx.lineTo(-p.size+4,-p.size*0.7);ctx.closePath();ctx.fill();
      ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(-p.size+2,0,4,0,Math.PI*2);ctx.fill();
      ctx.restore();

      // Engine trail
      addParticles(p.x-Math.cos(angle)*p.size,p.y-Math.sin(angle)*p.size,'#7c3aed',1);

      // HUD
      // Health bar
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(10,H-30,180,14);
      const hpRatio=p.health/p.maxHealth;
      ctx.fillStyle=hpRatio>0.5?'#22c55e':hpRatio>0.25?'#eab308':'#ef4444';
      ctx.fillRect(10,H-30,180*hpRatio,14);
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;ctx.strokeRect(10,H-30,180,14);
      ctx.fillStyle='white';ctx.font='10px sans-serif';ctx.textAlign='left';
      ctx.fillText(`HP ${Math.ceil(p.health)}/${p.maxHealth}`,14,H-19);

      // XP bar
      ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(10,H-48,180,8);
      ctx.fillStyle='#818cf8';ctx.fillRect(10,H-48,180*(p.xp/p.xpNext),8);

      animRef.current = requestAnimationFrame(gameLoop);
    };

    animRef.current = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKey);
      canvas.removeEventListener('mousemove', onMouse);
      canvas.removeEventListener('mousedown', onMouse);
      canvas.removeEventListener('mouseup', onMouse);
    };
  }, [gameStarted, onScoreUpdate]);

  const saveArenaScore = (name) => {
    const s = stateRef.current;
    if (!s) return;
    const updated = [...leaderboard, {name:name||'Anonymous',score:s.player.score,kills:s.player.kills,date:new Date().toLocaleDateString()}]
      .sort((a,b)=>b.score-a.score).slice(0,10);
    localStorage.setItem('anArenalb', JSON.stringify(updated));
    startGame();
  };

  const POWERUP_ICONS = {triple:'🔱',laser:'🔴',cannon:'💣',rapidfire:'⚡',shield:'🛡️',health:'💊'};

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
      {/* HUD */}
      {gameStarted && (
        <div style={{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center'}}>
          {[['⚡','Score',uiScore.toLocaleString()],['💜','Level',uiLevel],['☠️','Kills',uiKills],['🌊','Wave',uiWave]].map(([icon,label,val])=>(
            <div key={label} style={{...glass,padding:'8px 18px',textAlign:'center',minWidth:'80px'}}>
              <div style={{fontSize:'0.6rem',color:'#64748b',letterSpacing:'0.1em'}}>{icon} {label}</div>
              <div style={{fontSize:'1.3rem',fontWeight:'800',color:'#e2e8f0'}}>{val}</div>
            </div>
          ))}
          {uiPowerup && (
            <div style={{...glass,padding:'8px 18px',textAlign:'center',background:'rgba(139,92,246,0.2)'}}>
              <div style={{fontSize:'0.6rem',color:'#64748b'}}>POWERUP</div>
              <div style={{fontSize:'1.3rem'}}>{POWERUP_ICONS[uiPowerup]} {uiPowerup.toUpperCase()}</div>
            </div>
          )}
        </div>
      )}

      {/* Canvas */}
      <div style={{position:'relative',width:'min(780px,96vw)',aspectRatio:'780/520'}}>
        <canvas ref={canvasRef} style={{width:'100%',height:'100%',borderRadius:'12px',border:'1px solid rgba(139,92,246,0.3)',display:'block'}}/>

        {!gameStarted && (
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(5,5,20,0.92)',borderRadius:'12px',textAlign:'center',padding:'30px'}}>
            <div style={{fontSize:'4rem',marginBottom:'10px'}}>🚀</div>
            <h2 style={{color:'#c4b5fd',margin:'0 0 8px',fontSize:'2rem'}}>Rocket Arena</h2>
            <p style={{color:'#64748b',margin:'0 0 6px',fontSize:'0.9rem'}}>WASD to move · Mouse to aim · Click or Space to fire</p>
            <p style={{color:'#64748b',margin:'0 0 24px',fontSize:'0.85rem'}}>Collect powerups · Survive waves · Level up</p>
            <PrimaryBtn onClick={startGame} style={{fontSize:'1.1rem',padding:'14px 36px'}}>Launch Mission 🚀</PrimaryBtn>
            {leaderboard.length>0 && (
              <div style={{marginTop:'24px',width:'100%',maxWidth:'340px'}}>
                <div style={{color:'#94a3b8',fontSize:'0.8rem',marginBottom:'8px'}}>TOP PILOTS</div>
                {leaderboard.slice(0,3).map((e,i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',color:'#64748b',fontSize:'0.85rem',padding:'4px 0'}}>
                    <span>{i+1}. {e.name}</span><span style={{color:'#a78bfa'}}>{e.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {uiGameOver && (
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(5,5,20,0.92)',borderRadius:'12px',textAlign:'center',padding:'30px'}}>
            <div style={{fontSize:'3rem',marginBottom:'8px'}}>💀</div>
            <h2 style={{color:'#f8fafc',margin:'0 0 4px',fontSize:'1.8rem'}}>Mission Over</h2>
            <p style={{color:'#94a3b8',margin:'0 0 4px'}}>Score: <strong style={{color:'#a78bfa'}}>{uiScore.toLocaleString()}</strong></p>
            <p style={{color:'#94a3b8',margin:'0 0 20px'}}>Kills: {uiKills} · Wave: {uiWave}</p>
            <input id="pilotNameArena" placeholder="Enter Pilot Name" maxLength="15"
              style={{padding:'10px',background:'rgba(0,0,0,0.5)',color:'#fff',border:'1px solid rgba(139,92,246,0.4)',borderRadius:'8px',marginBottom:'14px',outline:'none',width:'200px',textAlign:'center'}}/>
            <div style={{display:'flex',gap:'10px'}}>
              <PrimaryBtn onClick={() => saveArenaScore(document.getElementById('pilotNameArena').value)}>Save & Retry</PrimaryBtn>
              <GhostBtn onClick={startGame}>Retry</GhostBtn>
            </div>
          </div>
        )}
      </div>

      <p style={{color:'rgba(255,255,255,0.3)',fontSize:'0.8rem',margin:0}}>
        WASD move · Mouse aim · Click / Space fire · Collect powerups to survive
      </p>
      <AdPlaceholder slot="Arena_Footer" style={{width:'100%',maxWidth:'780px',height:'80px'}}/>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════════════════
const HomePage = ({ onNavigate }) => {
  const proseStyle = {lineHeight:'1.8',color:'#94a3b8'};
  const h3Style = {color:'#c4b5fd',borderBottom:'1px solid rgba(196,181,253,0.15)',paddingBottom:'8px',marginBottom:'14px'};

  const faqs = [
    ['What is AsterNova?','AsterNova is a free browser-based space gaming portal featuring Space 2048 and Rocket Arena, playable directly in your browser with no downloads required.'],
    ['Does AsterNova save my progress?','All scores and leaderboard entries are saved locally in your browser using localStorage. No account required.'],
    ['Are the games free?','Completely free. No purchases, subscriptions, or hidden paywalls.'],
    ['What devices are supported?','AsterNova works on desktop (recommended) and mobile. Rocket Arena is optimized for mouse+keyboard.'],
    ['How do I report a bug?','Use the Contact page to submit bug reports. We read every message.'],
  ];

  return (
    <div style={{maxWidth:'1000px',margin:'0 auto'}}>
      {/* Hero */}
      <div style={{textAlign:'center',padding:'60px 20px 40px',position:'relative'}}>
        <div style={{fontSize:'4rem',marginBottom:'10px'}}>🌠</div>
        <h1 style={{fontSize:'clamp(2.5rem,6vw,4rem)',fontWeight:'900',margin:'0 0 14px',
          background:'linear-gradient(135deg,#c4b5fd,#818cf8,#38bdf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          AsterNova
        </h1>
        <p style={{color:'#94a3b8',fontSize:'1.1rem',maxWidth:'500px',margin:'0 auto 32px',lineHeight:'1.7'}}>
          Your browser-based space gaming portal. Free cosmic games, local leaderboards, no downloads.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
          <PrimaryBtn onClick={() => onNavigate('Space2048')} style={{fontSize:'1rem',padding:'14px 30px'}}>🪐 Play Space 2048</PrimaryBtn>
          <PrimaryBtn onClick={() => onNavigate('RocketArena')} style={{fontSize:'1rem',padding:'14px 30px',background:'linear-gradient(135deg,#0ea5e9,#0284c7)'}}>🚀 Play Rocket Arena</PrimaryBtn>
        </div>
      </div>

      {/* Game Cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'20px',marginBottom:'50px'}}>
        {[
          { title:'Space 2048', emoji:'🌠', desc:'Merge cosmic objects from tiny Asteroids to the entire Universe. A strategic puzzle that gets harder the closer you get to infinity.', color:'#7c3aed', page:'Space2048', tag:'Puzzle' },
          { title:'Rocket Arena', emoji:'🚀', desc:'Top-down space shooter with waves of alien enemies, powerups, level progression, and escalating difficulty. How long can you survive?', color:'#0ea5e9', page:'RocketArena', tag:'Action' },
        ].map(g => (
          <div key={g.title} style={{...glass,padding:'28px',cursor:'pointer',transition:'transform 0.2s,box-shadow 0.2s',boxShadow:'0 0 30px rgba(0,0,0,0.3)'}}
            onClick={() => onNavigate(g.page)}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.boxShadow=`0 12px 40px ${g.color}22`;}}
            onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 0 30px rgba(0,0,0,0.3)';}}>
            <div style={{fontSize:'3rem',marginBottom:'12px'}}>{g.emoji}</div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
              <h2 style={{color:'#e2e8f0',margin:0,fontSize:'1.3rem'}}>{g.title}</h2>
              <span style={{background:`${g.color}33`,color:g.color,fontSize:'0.7rem',padding:'3px 8px',borderRadius:'99px',border:`1px solid ${g.color}55`}}>{g.tag}</span>
            </div>
            <p style={{...proseStyle,margin:'0 0 16px',fontSize:'0.9rem'}}>{g.desc}</p>
            <span style={{color:g.color,fontSize:'0.9rem',fontWeight:'600'}}>Play Now →</span>
          </div>
        ))}
      </div>

      {/* About / Controls */}
      <div style={{...glass,padding:'32px',marginBottom:'30px'}}>
        <h2 style={h3Style}>About the Games</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'30px'}}>
          <div>
            <h3 style={{color:'#a78bfa',margin:'0 0 10px'}}>🌠 Space 2048</h3>
            <p style={proseStyle}>A cosmic spin on the classic 2048 puzzle. Slide tiles to merge identical objects — two Asteroids become a Moon, two Moons become a Planet, all the way to the Universe.</p>
            <div style={{marginTop:'12px'}}>
              <div style={{color:'#64748b',fontSize:'0.8rem',marginBottom:'6px'}}>CONTROLS</div>
              {[['Arrow Keys / WASD','Move all tiles'],['Touch / Swipe','Mobile movement']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:'0.85rem'}}>
                  <span style={{color:'#c4b5fd',fontFamily:'monospace'}}>{k}</span><span style={{color:'#64748b'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{color:'#38bdf8',margin:'0 0 10px'}}>🚀 Rocket Arena</h3>
            <p style={proseStyle}>Top-down space shooter with infinite waves. Upgrade your ship through XP, collect powerups, and outlast increasingly dangerous enemy fleets.</p>
            <div style={{marginTop:'12px'}}>
              <div style={{color:'#64748b',fontSize:'0.8rem',marginBottom:'6px'}}>CONTROLS</div>
              {[['WASD','Move ship'],['Mouse','Aim'],['Click','Shoot'],['Space (hold)','Autofire']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:'0.85rem'}}>
                  <span style={{color:'#38bdf8',fontFamily:'monospace'}}>{k}</span><span style={{color:'#64748b'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Preview */}
      <div style={{...glass,padding:'32px',marginBottom:'30px'}}>
        <h2 style={h3Style}>🏆 Leaderboard Previews</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:'20px'}}>
          {[{key:'an2048lb',title:'Space 2048'},{key:'anArenalb',title:'Rocket Arena'}].map(({key,title})=>{
            const lb = (() => { try { return JSON.parse(localStorage.getItem(key)||'[]'); } catch{return[];} })();
            return (
              <div key={key}>
                <div style={{color:'#94a3b8',fontSize:'0.85rem',marginBottom:'10px'}}>{title}</div>
                {lb.length===0 ? <p style={{color:'#374151',fontSize:'0.85rem'}}>No scores yet — be first!</p> :
                  lb.slice(0,3).map((e,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:'0.85rem'}}>
                      <span style={{color:'#94a3b8'}}>{i+1}. {e.name}</span>
                      <span style={{color:'#a78bfa',fontWeight:'700'}}>{e.score.toLocaleString()}</span>
                    </div>
                  ))
                }
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div style={{...glass,padding:'32px',marginBottom:'30px'}}>
        <h2 style={h3Style}>❓ FAQ</h2>
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {faqs.map(([q,a],i) => (
            <div key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.06)',paddingBottom:'16px'}}>
              <div style={{color:'#c4b5fd',fontWeight:'600',marginBottom:'6px'}}>{q}</div>
              <div style={{...proseStyle,fontSize:'0.9rem'}}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Patch Notes */}
      <div style={{...glass,padding:'32px',marginBottom:'30px'}}>
        <h2 style={h3Style}>📋 Latest Updates</h2>
        {[
          { ver:'v2.0.0', date:'2025', notes:['Added Rocket Arena top-down shooter','New AsterNova branding and homepage','Fixed Space 2048 stale-closure move bug','Powerup system: Triple Shot, Laser, Cannon, Shield, Rapid Fire','Enemy variety: Drone, Kamikaze, Shooter, Tank, Swarm','Player XP + level up system'] },
          { ver:'v1.0.0', date:'2024', notes:['Space 2048 launched','Local leaderboards','Tips page','Privacy Policy & Terms of Service'] },
        ].map(update => (
          <div key={update.ver} style={{marginBottom:'24px'}}>
            <div style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'10px'}}>
              <span style={{background:'rgba(124,58,237,0.2)',color:'#a78bfa',padding:'3px 10px',borderRadius:'6px',fontSize:'0.85rem',fontWeight:'700'}}>{update.ver}</span>
              <span style={{color:'#64748b',fontSize:'0.85rem'}}>{update.date}</span>
            </div>
            <ul style={{margin:'0 0 0 20px',padding:0}}>
              {update.notes.map((n,i) => <li key={i} style={{color:'#94a3b8',marginBottom:'5px',fontSize:'0.9rem'}}>{n}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <AdPlaceholder slot="Homepage_Bottom" style={{width:'100%',height:'90px',marginBottom:'30px'}}/>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STATIC PAGES
// ═══════════════════════════════════════════════════════════════
const proseStyle = {lineHeight:'1.8',color:'#94a3b8'};
const sH = {color:'#c4b5fd',borderBottom:'1px solid rgba(196,181,253,0.15)',paddingBottom:'8px',marginBottom:'16px',marginTop:'24px'};

const AboutPage = () => (
  <div style={{maxWidth:'800px',margin:'0 auto',...glass,padding:'36px'}}>
    <h1 style={{color:'#c4b5fd',marginTop:0}}>About AsterNova</h1>
    <p style={proseStyle}>AsterNova is a browser-based space gaming portal offering free, high-quality casual games. Our mission is to deliver polished, entertaining experiences without requiring any downloads, sign-ups, or payments.</p>
    <h2 style={sH}>Our Games</h2>
    <h3 style={{color:'#a78bfa'}}>🌠 Space 2048</h3>
    <p style={proseStyle}>A cosmic reimagining of the beloved 2048 puzzle game. Merge objects across the celestial hierarchy — from humble Asteroids to entire Universes — through strategic tile sliding.</p>
    <h3 style={{color:'#38bdf8'}}>🚀 Rocket Arena</h3>
    <p style={proseStyle}>A top-down space shooter featuring infinite survival gameplay, diverse enemy types, powerful weapon upgrades, and escalating wave difficulty. Built entirely in HTML5 Canvas.</p>
    <h2 style={sH}>Technology</h2>
    <p style={proseStyle}>AsterNova is built with React and vanilla JavaScript with HTML5 Canvas for game rendering. All data is stored locally in your browser. No backend, no tracking, no data collection.</p>
    <h2 style={sH}>Meet the Cosmic Objects</h2>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:'10px',marginTop:'16px'}}>
      {Object.entries(SPACE_TILES).map(([val,{emoji,name}]) => (
        <div key={val} style={{textAlign:'center',padding:'14px',background:'rgba(255,255,255,0.04)',borderRadius:'10px',border:'1px solid rgba(255,255,255,0.06)'}}>
          <div style={{fontSize:'1.4rem'}}>{emoji}</div>
          <div style={{fontSize:'0.75rem',fontWeight:'700',color:'#c4b5fd',marginTop:'4px'}}>{name}</div>
          <div style={{fontSize:'0.65rem',color:'#64748b'}}>{Number(val).toLocaleString()}</div>
        </div>
      ))}
    </div>
  </div>
);

const ContactPage = () => {
  const [sent, setSent] = useState(false);
  return (
    <div style={{maxWidth:'600px',margin:'0 auto',...glass,padding:'36px'}}>
      <h1 style={{color:'#c4b5fd',marginTop:0}}>Contact Us</h1>
      <p style={proseStyle}>Have a bug report, suggestion, or just want to say hello? Fill out the form below.</p>
      {sent ? (
        <div style={{background:'rgba(34,197,94,0.1)',border:'1px solid rgba(34,197,94,0.3)',borderRadius:'10px',padding:'20px',textAlign:'center',color:'#4ade80'}}>
          ✅ Message sent! We'll get back to you soon.
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[['Name','text','Your name'],['Email','email','your@email.com'],['Subject','text','Bug report / Suggestion']].map(([label,type,ph]) => (
            <div key={label}>
              <label style={{color:'#94a3b8',fontSize:'0.85rem',display:'block',marginBottom:'6px'}}>{label}</label>
              <input type={type} placeholder={ph} style={{width:'100%',padding:'11px',background:'rgba(0,0,0,0.4)',color:'#fff',border:'1px solid rgba(139,92,246,0.3)',borderRadius:'8px',outline:'none',boxSizing:'border-box'}}/>
            </div>
          ))}
          <div>
            <label style={{color:'#94a3b8',fontSize:'0.85rem',display:'block',marginBottom:'6px'}}>Message</label>
            <textarea placeholder="Describe your issue or suggestion..." rows="5" style={{width:'100%',padding:'11px',background:'rgba(0,0,0,0.4)',color:'#fff',border:'1px solid rgba(139,92,246,0.3)',borderRadius:'8px',outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
          </div>
          <PrimaryBtn onClick={() => setSent(true)}>Send Message</PrimaryBtn>
          <p style={{color:'#374151',fontSize:'0.75rem',margin:0}}>Note: This is a demo form. In production, connect to a backend or Formspree.</p>
        </div>
      )}
    </div>
  );
};

const PrivacyPage = () => (
  <div style={{maxWidth:'800px',margin:'0 auto',...glass,padding:'36px'}}>
    <h1 style={{color:'#c4b5fd',marginTop:0}}>Privacy Policy</h1>
    <p style={{...proseStyle,color:'#64748b',fontSize:'0.85rem'}}>Last updated: 2025</p>
    <h2 style={sH}>1. Data We Collect</h2>
    <p style={proseStyle}>AsterNova is a client-side application. We do not collect, transmit, or store any personal data on external servers. All game data (scores, leaderboard entries, preferences) is stored exclusively in your browser's <code style={{color:'#a78bfa',background:'rgba(167,139,250,0.1)',padding:'1px 5px',borderRadius:'4px'}}>localStorage</code>.</p>
    <h2 style={sH}>2. Cookies</h2>
    <p style={proseStyle}>AsterNova does not use tracking cookies, analytics cookies, or advertising cookies. Only technical browser storage (localStorage) is used for game persistence.</p>
    <h2 style={sH}>3. Third-Party Advertisements</h2>
    <p style={proseStyle}>The site may display third-party advertisements (e.g. Google AdSense). These providers may use their own cookies and tracking technologies per their respective privacy policies. You may opt out through your browser settings or industry opt-out tools.</p>
    <h2 style={sH}>4. Children's Privacy</h2>
    <p style={proseStyle}>AsterNova does not knowingly collect information from children under 13. Our games do not require account creation or any personal data.</p>
    <h2 style={sH}>5. Changes to This Policy</h2>
    <p style={proseStyle}>We may update this policy periodically. Continued use of the site after changes constitutes acceptance of the updated policy.</p>
    <h2 style={sH}>6. Contact</h2>
    <p style={proseStyle}>For privacy questions, please use our Contact page.</p>
  </div>
);

const TOSPage = () => (
  <div style={{maxWidth:'800px',margin:'0 auto',...glass,padding:'36px'}}>
    <h1 style={{color:'#c4b5fd',marginTop:0}}>Terms of Service</h1>
    <p style={{...proseStyle,color:'#64748b',fontSize:'0.85rem'}}>Last updated: 2025</p>
    <h2 style={sH}>1. Acceptance</h2>
    <p style={proseStyle}>By accessing AsterNova, you agree to these Terms. If you do not agree, please discontinue use.</p>
    <h2 style={sH}>2. Use of Service</h2>
    <p style={proseStyle}>AsterNova is provided for personal, non-commercial entertainment. You agree not to exploit game mechanics, automate play artificially, or interfere with other users' experience.</p>
    <h2 style={sH}>3. Intellectual Property</h2>
    <p style={proseStyle}>All AsterNova game content, branding, and code are the property of the site owner. The core 2048 mechanic is inspired by the original 2048 by Gabriele Cirulli (MIT License).</p>
    <h2 style={sH}>4. Disclaimer of Warranties</h2>
    <p style={proseStyle}>AsterNova is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service.</p>
    <h2 style={sH}>5. Limitation of Liability</h2>
    <p style={proseStyle}>The site owner shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of the site.</p>
    <h2 style={sH}>6. Governing Law</h2>
    <p style={proseStyle}>These Terms are governed by applicable law. Disputes shall be resolved through good-faith negotiation before any legal action.</p>
  </div>
);

const CookiePage = () => (
  <div style={{maxWidth:'800px',margin:'0 auto',...glass,padding:'36px'}}>
    <h1 style={{color:'#c4b5fd',marginTop:0}}>Cookie Policy</h1>
    <p style={proseStyle}>AsterNova uses <code style={{color:'#a78bfa',background:'rgba(167,139,250,0.1)',padding:'1px 5px',borderRadius:'4px'}}>localStorage</code> (not traditional cookies) to save your game scores and preferences. This data never leaves your device.</p>
    <h2 style={sH}>Third-Party Cookies</h2>
    <p style={proseStyle}>If advertisements are displayed, third-party providers like Google AdSense may set their own cookies. You can manage these through your browser settings or visit <a href="https://optout.aboutads.info" style={{color:'#a78bfa'}}>aboutads.info</a> to opt out.</p>
    <h2 style={sH}>Clearing Your Data</h2>
    <p style={proseStyle}>To clear your AsterNova game data, clear your browser's localStorage for this site (Settings → Privacy → Clear Browsing Data → Cached/Site Data).</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function AsterNova() {
  const [page, setPage] = useState('Home');
  const [score, setScore] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const titles = {
      Home: 'AsterNova — Free Space Browser Games',
      Space2048: 'Space 2048 — Merge Cosmic Objects | AsterNova',
      RocketArena: 'Rocket Arena — Top-Down Space Shooter | AsterNova',
      About: 'About | AsterNova',
      Contact: 'Contact | AsterNova',
      Privacy: 'Privacy Policy | AsterNova',
      TOS: 'Terms of Service | AsterNova',
      Cookies: 'Cookie Policy | AsterNova',
    };
    document.title = titles[page] || 'AsterNova';
    window.scrollTo(0, 0);
  }, [page]);

  const navigate = (p) => { setPage(p); setMenuOpen(false); };

  const NAV_LINKS = [
    ['Home','Home'],['Space 2048','Space2048'],['Rocket Arena','RocketArena'],
    ['About','About'],['Contact','Contact'],
  ];

  const navItemStyle = (p) => ({
    background: page === p ? 'rgba(124,58,237,0.25)' : 'transparent',
    color: page === p ? '#c4b5fd' : '#94a3b8',
    border: 'none', padding: '8px 14px', borderRadius: '8px',
    cursor: 'pointer', fontWeight: page === p ? '700' : '400', fontSize: '0.9rem',
    transition: 'background 0.2s',
  });

  return (
    <div style={{minHeight:'100vh',background:'#050510',color:'#e2e8f0',fontFamily:'"Segoe UI",system-ui,sans-serif',position:'relative'}}>
      <StarField />

      {/* SEO meta via useEffect in parent */}
      <meta name="description" content="AsterNova — free browser-based space gaming portal featuring Space 2048 and Rocket Arena. No downloads required."/>

      {/* Header Ad */}
      <AdPlaceholder slot="Header_Banner" style={{height:'60px',margin:'0',borderRadius:'0'}}/>

      {/* Navigation */}
      <header style={{background:'rgba(5,5,20,0.92)',backdropFilter:'blur(12px)',borderBottom:'1px solid rgba(139,92,246,0.15)',padding:'0 20px',position:'sticky',top:0,zIndex:100}}>
        <div style={{maxWidth:'1100px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',height:'60px'}}>
          <button onClick={() => navigate('Home')} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px'}}>
            <span style={{fontSize:'1.4rem'}}>🌠</span>
            <span style={{fontWeight:'900',fontSize:'1.25rem',background:'linear-gradient(135deg,#c4b5fd,#38bdf8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>AsterNova</span>
          </button>
          <nav style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
            {NAV_LINKS.map(([label, p]) => (
              <button key={p} onClick={() => navigate(p)} style={navItemStyle(p)}>{label}</button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main style={{maxWidth:'1100px',margin:'0 auto',padding:'40px 20px',position:'relative',zIndex:1}}>
        {page === 'Home' && <HomePage onNavigate={navigate}/>}
        {page === 'Space2048' && (
          <div>
            <h1 style={{textAlign:'center',color:'#c4b5fd',marginBottom:'8px'}}>🌠 Space 2048</h1>
            <p style={{textAlign:'center',color:'#64748b',marginBottom:'30px'}}>Merge cosmic objects until you reach the Universe</p>
            <Space2048 onScoreUpdate={setScore} globalBest={0}/>
            <div style={{maxWidth:'800px',margin:'40px auto 0',padding:'24px',...glass}}>
              <h3 style={{color:'#c4b5fd',margin:'0 0 16px'}}>Strategy Tips</h3>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px'}}>
                {[['📐 Corner Strategy','Lock your highest tile in a corner. Build descending values outward from it.'],['🐍 Snake Method','Arrange tiles in a descending snake pattern for chain merges.'],['🚫 Three Directions','Avoid the direction that moves your anchor tile. Use only 3 keys.']]
                  .map(([t,d]) => <div key={t} style={{background:'rgba(255,255,255,0.04)',padding:'16px',borderRadius:'10px'}}><div style={{color:'#fbbf24',fontWeight:'700',marginBottom:'8px'}}>{t}</div><div style={{color:'#94a3b8',fontSize:'0.88rem',lineHeight:'1.6'}}>{d}</div></div>)}
              </div>
            </div>
          </div>
        )}
        {page === 'RocketArena' && (
          <div>
            <h1 style={{textAlign:'center',color:'#38bdf8',marginBottom:'8px'}}>🚀 Rocket Arena</h1>
            <p style={{textAlign:'center',color:'#64748b',marginBottom:'30px'}}>Top-down space shooter — survive the alien onslaught</p>
            <RocketArena onScoreUpdate={setScore}/>
          </div>
        )}
        {page === 'About' && <AboutPage/>}
        {page === 'Contact' && <ContactPage/>}
        {page === 'Privacy' && <PrivacyPage/>}
        {page === 'TOS' && <TOSPage/>}
        {page === 'Cookies' && <CookiePage/>}
      </main>

      {/* Footer */}
      <footer style={{borderTop:'1px solid rgba(139,92,246,0.12)',padding:'40px 20px',marginTop:'60px',position:'relative',zIndex:1}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <AdPlaceholder slot="Footer_Banner" style={{height:'80px',marginBottom:'30px'}}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'30px',marginBottom:'30px'}}>
            <div>
              <div style={{fontWeight:'900',color:'#c4b5fd',marginBottom:'12px'}}>🌠 AsterNova</div>
              <p style={{color:'#374151',fontSize:'0.85rem',lineHeight:'1.6'}}>Free browser-based space games. No downloads, no sign-ups.</p>
            </div>
            <div>
              <div style={{color:'#64748b',fontSize:'0.75rem',letterSpacing:'0.1em',marginBottom:'10px'}}>GAMES</div>
              {[['Space 2048','Space2048'],['Rocket Arena','RocketArena']].map(([l,p]) => (
                <button key={p} onClick={() => navigate(p)} style={{display:'block',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',padding:'4px 0',fontSize:'0.9rem'}}>{l}</button>
              ))}
            </div>
            <div>
              <div style={{color:'#64748b',fontSize:'0.75rem',letterSpacing:'0.1em',marginBottom:'10px'}}>INFO</div>
              {[['About','About'],['Contact','Contact'],['FAQ','Home']].map(([l,p]) => (
                <button key={l} onClick={() => navigate(p)} style={{display:'block',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',padding:'4px 0',fontSize:'0.9rem'}}>{l}</button>
              ))}
            </div>
            <div>
              <div style={{color:'#64748b',fontSize:'0.75rem',letterSpacing:'0.1em',marginBottom:'10px'}}>LEGAL</div>
              {[['Privacy Policy','Privacy'],['Terms of Service','TOS'],['Cookie Policy','Cookies']].map(([l,p]) => (
                <button key={l} onClick={() => navigate(p)} style={{display:'block',background:'none',border:'none',color:'#94a3b8',cursor:'pointer',padding:'4px 0',fontSize:'0.9rem'}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:'20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'10px'}}>
            <p style={{color:'#374151',fontSize:'0.8rem',margin:0}}>© {new Date().getFullYear()} AsterNova. All rights reserved.</p>
            <p style={{color:'#374151',fontSize:'0.8rem',margin:0}}>2048 mechanic inspired by Gabriele Cirulli (MIT)</p>
          </div>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #050510; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.4); border-radius: 3px; }
        input, textarea, select { font-family: inherit; }
        button { font-family: inherit; }
        code { font-family: 'Courier New', monospace; }
      `}</style>
    </div>
  );
}
