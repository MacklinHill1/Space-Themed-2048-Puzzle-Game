import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 4;

const SPACE_TILES = {
  2: { emoji: '🪨', name: 'Asteroid' },
  4: { emoji: '🌑', name: 'Moon' },
  8: { emoji: '🌍', name: 'Planet' },
  16: { emoji: '🪐', name: 'Ringed Planet' },
  32: { emoji: '⭐', name: 'Star' },
  64: { emoji: '☀️', name: 'Sun' },
  128: { emoji: '💥', name: 'Supernova' },
  256: { emoji: '🕳️', name: 'Black Hole' },
  512: { emoji: '🌫️', name: 'Nebula' },
  1024: { emoji: '🌌', name: 'Galaxy' },
  2048: { emoji: '🌠', name: 'Universe' }
};

const Space2048 = () => {
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  // Add a new tile (90% chance of 2, 10% chance of 4)
  const addNewTile = useCallback((currentGrid) => {
    const emptyCells = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }
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
  }, [addNewTile]);

  useEffect(() => {
    initializeGame();
    const savedBest = localStorage.getItem('space2048Best');
    if (savedBest) setBestScore(parseInt(savedBest));
  }, [initializeGame]);

  // Check if any moves are possible
  const canMove = useCallback((currentGrid) => {
    // Check for empty cells
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (currentGrid[i][j] === 0) return true;
      }
    }
    // Check for possible merges
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const current = currentGrid[i][j];
        if (j < GRID_SIZE - 1 && current === currentGrid[i][j + 1]) return true;
        if (i < GRID_SIZE - 1 && current === currentGrid[i + 1][j]) return true;
      }
    }
    return false;
  }, []);

  // Move and merge logic
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
          if (mergedValue === 2048) setWon(true);
          i += 2;
        } else {
          merged.push(arr[i]);
          i += 1;
        }
      }
      while (merged.length < GRID_SIZE) {
        merged.push(0);
      }
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
        for (let i = 0; i < GRID_SIZE; i++) {
          newGrid[i][j] = newColumn[i];
        }
      }
    } else if (direction === 'down') {
      for (let j = 0; j < GRID_SIZE; j++) {
        const column = newGrid.map(row => row[j]);
        const reversed = [...column].reverse();
        const newColumn = slide(reversed).reverse();
        if (JSON.stringify(newColumn) !== JSON.stringify(column)) moved = true;
        for (let i = 0; i < GRID_SIZE; i++) {
          newGrid[i][j] = newColumn[i];
        }
      }
    }

    if (moved) {
      addNewTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('space2048Best', newScore.toString());
      }
      
      if (!canMove(newGrid)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, won, score, bestScore, addNewTile, canMove]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      
      switch (e.key) {
        case 'ArrowLeft':
          move('left');
          break;
        case 'ArrowRight':
          move('right');
          break;
        case 'ArrowUp':
          move('up');
          break;
        case 'ArrowDown':
          move('down');
          break;
          // Move with WASD
        case 'A':
          move('left');
          break;
        case 'D':
          move('right');
          break;
        case 'W':
          move('up');
          break;
        case 'S':
          move('down');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [move]);

  // Touch controls
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) move('left');
      if (isRightSwipe) move('right');
    } else {
      if (isUpSwipe) move('up');
      if (isDownSwipe) move('down');
    }
  };

  const getTileColor = (value) => {
    const colors = {
      2: '#4a5568',
      4: '#2d3748',
      8: '#1a365d',
      16: '#2c5282',
      32: '#2b6cb0',
      64: '#fbbf24',
      128: '#f59e0b',
      256: '#1f2937',
      512: '#6b21a8',
      1024: '#4c1d95',
      2048: '#7c3aed'
    };
    return colors[value] || '#1a202c';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: 'white'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '3.5rem',
          margin: '0 0 10px 0',
          background: 'linear-gradient(45deg, #667eea, #764ba2, #f093fb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          textShadow: '0 0 30px rgba(102, 126, 234, 0.5)'
        }}>
          Space 2048
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '1.1rem', margin: 0 }}>
          Merge cosmic objects to reach the Universe! 🌠
        </p>
      </div>

      {/* Score Board */}
      <div style={{
        display: 'flex',
        gap: '15px',
        marginBottom: '25px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '15px 25px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#a0aec0', marginBottom: '5px' }}>SCORE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{score}</div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          padding: '15px 25px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '0.9rem', color: '#a0aec0', marginBottom: '5px' }}>BEST</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{bestScore}</div>
        </div>
        <button
          onClick={initializeGame}
          style={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            border: 'none',
            padding: '15px 25px',
            borderRadius: '12px',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
          New Game
        </button>
      </div>

      {/* Game Grid */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)',
          padding: '15px',
          borderRadius: '15px',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          position: 'relative'
        }}
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          width: 'min(400px, 90vw)',
          aspectRatio: '1/1'
        }}>
          {grid.map((row, i) => 
            row.map((value, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  background: value === 0 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : getTileColor(value),
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: value === 0 ? '1rem' : value >= 1024 ? '2.5rem' : '3rem',
                  fontWeight: 'bold',
                  transition: 'all 0.15s ease',
                  transform: value === 0 ? 'scale(1)' : 'scale(1)',
                  animation: value !== 0 ? 'pop 0.2s ease' : 'none',
                  boxShadow: value !== 0 ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none'
                }}
              >
                {value !== 0 && (
                  <>
                    <div>{SPACE_TILES[value]?.emoji || '❓'}</div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginTop: '5px',
                      textAlign: 'center',
                      lineHeight: '1'
                    }}>
                      {value}
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Game Over Overlay */}
        {(gameOver || won) && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '15px',
            zIndex: 10
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '20px'
            }}>
              {won ? '🎉' : '😢'}
            </div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              {won ? 'You Won!' : 'Game Over'}
            </div>
            <div style={{
              fontSize: '1.2rem',
              color: '#a0aec0',
              marginBottom: '20px'
            }}>
              {won ? 'You reached the Universe!' : 'No more moves available'}
            </div>
            <button
              onClick={initializeGame}
              style={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '12px',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1.1rem'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: '#a0aec0',
        maxWidth: '400px'
      }}>
        <p style={{ margin: '5px 0' }}>
          <strong>Desktop:</strong> Use arrow keys or WASD to move tiles
        </p>
        <p style={{ margin: '5px 0' }}>
          <strong>Mobile:</strong> Swipe in any direction
        </p>
        <p style={{ margin: '10px 0', fontSize: '0.9rem' }}>
          Merge matching tiles to create bigger cosmic objects!
        </p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Space2048;
