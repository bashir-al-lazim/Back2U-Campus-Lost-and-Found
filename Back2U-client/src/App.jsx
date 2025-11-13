// ========================
// MAIN APP COMPONENT
// ========================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Views
import ItemFeed from './views/ItemFeed/ItemFeed';
import ItemDetail from './views/ItemDetail/ItemDetail';
import Login from './views/Auth/Login';
import Register from './views/Auth/Register';
import Home from './views/Home/Home';

// Components
import Navbar from './components/Navbar/Navbar';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';

// Context
import { AuthProvider } from './context/AuthContext';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Routes - No Login Required */}
              <Route path="/" element={<Navigate to="/items" replace />} />
              <Route path="/items" element={<ItemFeed />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/items" replace />} />
            </Routes>
          </main>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
