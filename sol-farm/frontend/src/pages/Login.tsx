import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { auth } from '../firebase';

export default function Login() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;

      if (!currentUser?.email) {
        setError('Email not available from Google.');
        return;
      }

      console.log('✅ Google Login:', currentUser.email);
      navigate('/app'); 
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Login failed. Try again.');
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
    </div>
  );
}
