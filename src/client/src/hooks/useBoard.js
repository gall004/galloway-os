import { useContext } from 'react';
import { BoardContext } from '../contexts/BoardContext';

export function useBoard() {
  return useContext(BoardContext);
}
