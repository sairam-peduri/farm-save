// src/components/Topbar.tsx
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

interface TopbarProps {
  user: any;
}

export default function Topbar({ user }: TopbarProps) {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  return (
    <div className="bg-gray-900 text-white flex justify-between items-center px-6 py-4 shadow">
      <Link to="/" className="text-2xl font-bold">SolFarm</Link>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-300">{user.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Logout
            </button>
          </>
        )}

        {!user && (
          <Link
            to="/login"
            className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Login
          </Link>
        )}

        {user && (
          <WalletMultiButton className="!bg-green-600 hover:!bg-green-700 text-sm" />
        )}
      </div>
    </div>
  );
}
