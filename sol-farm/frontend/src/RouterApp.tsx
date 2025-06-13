import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import App from './App'; // your main SolFarm app
import Landing from './components/Landing';
import Budget from './pages/Budget';

export default function RouterApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<App />} />
        <Route path="/budget" element={<Budget />} />
      </Routes>
    </Router>
  );
}
