// src/pages/EmailLogin.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, signInWithGoogle } from '../firebase';

const BACKEND = 'http://localhost:4000';

export default function EmailLogin() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'verify' | 'done'>('email');

  const navigate = useNavigate();

  const sendCode = async () => {
    const user = auth.currentUser;
    if (!user) return alert("Please sign in first");
    const pubkey = localStorage.getItem('pubkey');
    const res = await fetch(`${BACKEND}/user/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey, email: user.email }),
    });
    if (res.ok) {
      setStep('verify');
      alert('Verification code sent (check console)');
    }
  };

  const verifyCode = async () => {
    const pubkey = localStorage.getItem('pubkey');
    const res = await fetch(`${BACKEND}/user/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey, code }),
    });
    if (res.ok) {
      alert('✅ Email verified!');
      navigate('/app');
    } else {
      alert('❌ Invalid code');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-6">
      <h1 className="text-3xl font-bold mb-4">🔐 Email / Gmail Login</h1>
      {step === 'email' && (
        <>
          <button
            onClick={async () => {
              const result = await signInWithGoogle();
              setEmail(result.user.email || '');
              sendCode();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded mb-4"
          >
            Sign in with Gmail
          </button>
        </>
      )}
      {step === 'verify' && (
        <>
          <p>Gmail: {email}</p>
          <input
            type="text"
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="p-2 border rounded mb-2 w-64"
          />
          <button
            onClick={verifyCode}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            Verify Code
          </button>
        </>
      )}
    </div>
  );
}
