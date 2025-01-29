// StateContext.js
import React, { createContext, useContext, useState } from "react";

// Create Context
const StateContext = createContext();

// Custom Provider
export const StateProvider = ({ children }) => {
  const [state, setState] = useState({
    userName: "",
    totalRounds: 1,
    currentRound: 0,
    coords: {},
    maxScore: 5000,
    hintsUnlocked: 0,
    hints: {
      hint1: "",
      hint2: "",
      hint3: "",
    },
    madeAGuess: false,
    resultData: {},
  });

  const updateState = (key, value) => {
    console.log("updating state", key, value);
    // console.log("state before update");
    // console.log(state[key]);
    setState((prev) => ({ ...prev, [key]: value }));
    // console.log("state after update");
    // console.log((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <StateContext.Provider value={{ state, updateState }}>
      {children}
    </StateContext.Provider>
  );
};

// Custom Hook for Convenience
export const useStateContext = () => useContext(StateContext);
