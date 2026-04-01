import React, { useState, useEffect } from 'react';
import { fetchConfig } from '../lib/api';
import { BoardContext } from './BoardContext';

export function BoardProvider({ children }) {
  const [activeBoardId, setActiveBoardId] = useState(1);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBoards = async () => {
    try {
      const data = await fetchConfig('boards');
      setBoards(data || []);
      // If activeBoardId was deleted or doesn't exist, fallback to ID 1 or the first available
      if (!data.find((b) => b.id === activeBoardId) && data.length > 0) {
        setActiveBoardId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to parse boards inside context', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BoardContext.Provider value={{ activeBoardId, setActiveBoardId, boards, refreshBoards: loadBoards, loading }}>
      {children}
    </BoardContext.Provider>
  );
}
