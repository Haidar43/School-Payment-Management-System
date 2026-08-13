import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import router from './routes';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#17202A',
            border: '1px solid #E4E7EC',
          },
          success: {
            iconTheme: {
              primary: '#15803D',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#B42318',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </AuthProvider>
  );
}

export default App;