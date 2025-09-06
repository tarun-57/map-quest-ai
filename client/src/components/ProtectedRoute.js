// ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useStateContext } from "../state/StateContext";

const ProtectedRoute = ({ children }) => {
  const { state } = useStateContext();

  if (!state?.userName || String(state.userName).trim().length === 0) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
