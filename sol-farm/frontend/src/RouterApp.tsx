// src/routes.tsx
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import App from './App'; // Main features page
import Landing from './components/Landing';
import Budget from './pages/Budget';
import Login from './pages/Login';

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<App />} />
        <Route path="/budget" element={<Budget />} />
      </Routes>
    </Router>
  );
}
