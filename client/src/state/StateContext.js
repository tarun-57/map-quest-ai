import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const StateContext = createContext(null);

const initialState = {
  userName: '',
  totalRounds: 1,
  currentRound: 0,
  coords: {},
  maxScore: 5000,
  hintsUnlocked: 0,
  hints: {
    hint1: '',
    hint2: '',
    hint3: '',
  },
  madeAGuess: false,
  resultData: {},
  totalScore: 0,
  rounds: [],
  region: { scope: 'world', value: '' },
};

export function StateProvider({ children }) {
  const [state, setState] = useState(initialState);

  const updateState = useCallback((key, value) => {
    setState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const value = useMemo(() => ({ state, updateState }), [state, updateState]);

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
}

export function useStateContext() {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error('useStateContext must be used within StateProvider');
  }
  return ctx;
}
