import React, { useState, useEffect } from 'react';
import { historyService } from '../utils/history';

export const WatchHistory = ({ onMovieClick }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(historyService.getHistory());
  }, []);

  if (history.length === 0) return null;

  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>История просмотров</h3>
        <button 
          onClick={() => { historyService.clearHistory(); setHistory([]); }}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '12px', cursor: 'pointer' }}
        >
          Очистить
        </button>
      </div>

      {/* Контейнер с горизонтальным скроллбаром */}
      <div className="horizontal-scroll-container">
        {history.map((movie) => (
          <div
            key={movie.id}
            onClick={() => onMovieClick(movie.id)}
            style={{
              flex: '0 0 110px',
              cursor: 'pointer',
              borderRadius: '8px',
              overflow: 'hidden',
              background: '#1a1a1a',
            }}
          >
            <img
              src={movie.poster_url || '/placeholder.png'}
              alt={movie.title}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
            <div style={{ padding: '6px' }}>
              <div style={{ fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                {movie.title}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa' }}>{movie.year}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
