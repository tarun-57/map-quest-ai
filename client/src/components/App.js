import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React from 'react';
import StreetView from './StreetView';
import GameView from './GameView';
import ProtectedRoute from './ProtectedRoute';
import ResultView from './ResultView';
import SummaryView from './SummaryView';

const router = createBrowserRouter([
  {
    path: '/',
    element: <GameView />,
  },
  {
    path: '/play',
    element: (
      <ProtectedRoute>
        <StreetView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/result',
    element: (
      <ProtectedRoute>
        <ResultView />
      </ProtectedRoute>
    ),
  },
  {
    path: '/summary',
    element: (
      <ProtectedRoute>
        <SummaryView />
      </ProtectedRoute>
    ),
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
