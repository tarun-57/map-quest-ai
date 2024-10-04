// ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from './UserContext';

const ProtectedRoute = ({ children }) => {
  const { username } = useContext(UserContext);

  if (!username) {
    // If no username, redirect to Home
    return <Navigate to="/" replace />;
  }

  // If username is present, render the children (protected route)
  return children;
};

export default ProtectedRoute;
