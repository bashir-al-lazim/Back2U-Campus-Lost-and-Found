import './app/styles/index.css'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './app/providers/createProvider';
import AuthProvider from './app/providers/AuthProvider';
import router from './app/routes/Router';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>

        <RouterProvider router={router} />

      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)