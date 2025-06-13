import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

const DepositForm = () => {
  const { publicKey } = useWallet();
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!publicKey || !amount) {
      setStatus('Missing wallet or amount');
      return;
    }

    try {
      const res = await fetch('http://localhost:4000/farm/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubkey: publicKey.toBase58(),
          amount: parseFloat(amount),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus(`✅ Success! Estimated yield: ${data.estimatedYield} SOL`);
      } else {
        setStatus(`❌ Deposit failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setStatus('❌ Network error');
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow-md w-full max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">💰 Deposit to Farm</h2>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount in SOL"
        className="w-full px-4 py-2 border rounded mb-4"
      />
      <button
        onClick={handleDeposit}
        className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Deposit
      </button>
      {status && <p className="mt-4 text-sm text-gray-700">{status}</p>}
    </div>
  );
};

export default DepositForm;
