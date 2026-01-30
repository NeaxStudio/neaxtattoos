import { useState, useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import DashboardPage from './pages/DashboardPage';
import { Toaster } from './components/ui/sonner';
import PageTransition from './components/PageTransition';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const apiClient = axios.create({
  baseURL: API,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem('token');
        });
    }
  }, []);

  const AnimatedRoutes = () => {
    const location = useLocation();

    return (
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageTransition>
                <LandingPage setAuth={setIsAuthenticated} setUser={setUser} />
              </PageTransition>
            }
          />
          <Route
            path="/book"
            element={
              isAuthenticated ? (
                <PageTransition>
                  <BookingPage user={user} />
                </PageTransition>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <PageTransition>
                  <DashboardPage user={user} setAuth={setIsAuthenticated} />
                </PageTransition>
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </AnimatePresence>
    );
  };

  return (
    <div className="App">
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

export default App;