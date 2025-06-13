import { useWallet } from '@solana/wallet-adapter-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';

export default function Login() {
  const { publicKey } = useWallet();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!publicKey) {
      setError('Please connect your Solana wallet first.');
      return;
    }

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google Login:', user.email);

      // Send to backend to store in MongoDB
      await fetch('http://localhost:4000/user/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubkey: publicKey.toBase58(),
          email: user.email,
        }),
      });

      navigate('/app'); // go to main dashboard
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked. Please allow popups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Please wait — popup already in progress.');
      } else {
        setError('Login failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-3xl font-bold text-center">Sign in with Gmail to Continue</h1>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className={`px-6 py-3 rounded font-semibold ${
          loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? 'Signing in...' : 'Sign in with Gmail'}
      </button>

      <p className="text-sm text-gray-400 mt-2">Make sure your wallet is connected first!</p>
    </div>
  );
}
