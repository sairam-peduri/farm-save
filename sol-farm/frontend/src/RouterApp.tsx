// src/RouterApp.tsx (was routes.tsx)
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { auth } from './firebase';

import App from './App'; // Main dashboard page
import Landing from './components/Landing';
import Topbar from './components/Topbar';
import Budget from './pages/Budget';
import Login from './pages/Login';
import ProfilePage from './pages/ProfilePage';

export default function AppRoutes() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="text-white p-4">Loading...</div>;

  return (
    <Router>
      <Topbar user={user} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile/:pubkey" element={<ProfilePage pubkey={''} />} />
        <Route path="/app" element={user ? <App /> : <Navigate to="/login" replace />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
