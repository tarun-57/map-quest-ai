import { createBrowserRouter, RouterProvider } from "react-router-dom";
import React, { useState } from 'react';
import io from 'socket.io-client';
import StreetView from './StreetView';
import GameView from './GameView';
import MapView from './MapView';
import ProtectedRoute from "./ProtectedRoute";
import ResultView from "./ResultView";

const App = () => {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('');
  const [roomID, setRoomID] = useState('');
  const [socket, setSocket] = useState(null);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <GameView />,
    },
    {
      path: "/play",
      element: (
        // <ProtectedRoute>
          <StreetView />
        // </ProtectedRoute>
      ),
    },
    {
      path: "/result",
      element: (
        // <ProtectedRoute>
          <ResultView />
        // </ProtectedRoute>
      ),
    },
    // {
    //   path: "/quiz",
    //   element: (
    //     <CheckUserExist>
    //       <Quiz />
    //     </CheckUserExist>
    //   ),
    // },
    // {
    //   path: "/result",
    //   element: (
    //     <CheckUserExist>
    //       <Result />
    //     </CheckUserExist>
    //   ),
    // },
  ]);

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
