// src/components/ProfilePage.tsx
import axios from 'axios';
import { useEffect, useState } from 'react';

const BACKEND = 'http://localhost:4000';

interface LoginLog {
  timestamp: number;
  ip: string;
}

export default function ProfilePage({ pubkey }: { pubkey: string }) {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState<'Free' | 'Advanced' | 'Prime'>('Free');
  const [verified, setVerified] = useState(false);
  const [loginHistory, setLoginHistory] = useState<LoginLog[]>([]);

  const loadProfile = async () => {
    const res = await axios.get(`${BACKEND}/user/profile/${pubkey}`);
    const { email, verified, tier, loginHistory } = res.data;
    setEmail(email);
    setTier(tier);
    setVerified(verified);
    setLoginHistory(loginHistory || []);
  };

  const updateTier = async () => {
    await axios.post(`${BACKEND}/tier`, {
      pubkey,
      tier,
    });
    alert('Tier updated!');
  };

  useEffect(() => {
    if (pubkey) loadProfile();
  }, [pubkey]);

  return (
    <div className="mt-6 bg-gray-800 p-4 rounded">
      <h3 className="text-xl font-semibold mb-2">👤 Profile</h3>
      <p>📧 Email: {verified ? `${email} (verified)` : email}</p>
      <p>✨ Tier: {tier}</p>

      <div className="mt-3">
        <select
          value={tier}
          onChange={e => setTier(e.target.value as any)}
          className="w-full p-2 rounded text-black"
        >
          <option>Free</option>
          <option>Advanced</option>
          <option>Prime</option>
        </select>
        <button onClick={updateTier} className="w-full mt-2 py-2 bg-yellow-600 rounded">
          Set Tier
        </button>
      </div>

      <div className="mt-4">
        <h4 className="font-semibold mb-1">🕓 Login History</h4>
        <ul className="text-sm max-h-40 overflow-y-auto space-y-1">
          {loginHistory.map((log, idx) => (
            <li key={idx}>
              {new Date(log.timestamp).toLocaleString()} — IP: {log.ip || 'Unknown'}
            </li>
          ))}
          {loginHistory.length === 0 && <li>No logins yet.</li>}
        </ul>
      </div>
    </div>
  );
}
