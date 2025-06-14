// App.tsx
import { useWallet as useAdapterWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { useEffect, useState } from 'react';
import ProfilePage from './pages/ProfilePage';

const BACKEND = 'http://localhost:4000';
const FARM_WALLET = new PublicKey('HHMXYJEkz1JLu6sk3wbew7vaqDV8Xi3pDaWJpxGMyAHx');

export default function App() {
  const { publicKey, sendTransaction } = useAdapterWallet();
  const { connection } = useConnection();

  const [balance, setBalance] = useState<number | null>(null);
  const [farmBalance, setFarmBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [amount, setAmount] = useState('');

  const [budget, setBudget] = useState('');
  const [budgetHistory, setBudgetHistory] = useState<{ amount: number; timestamp: number }[]>([]);

  const [tier, setTier] = useState<'Free' | 'Advanced' | 'Prime'>('Free');

  const loadTier = async () => {
    if (!publicKey) return;
    const res = await fetch(`${BACKEND}/tier/${publicKey.toBase58()}`);
    const data = await res.json();
    setTier(data.tier);
  };

  const loadBalances = async () => {
    if (!publicKey) return;
    const [u, f, h] = await Promise.all([
      fetch(`${BACKEND}/balance/${publicKey.toBase58()}`).then(r => r.json()),
      fetch(`${BACKEND}/balance/${FARM_WALLET.toBase58()}`).then(r => r.json()),
      fetch(`${BACKEND}/history/${publicKey.toBase58()}`).then(r => r.json()),
    ]);
    setBalance(u.balance);
    setFarmBalance(f.balance);
    setHistory(h.history);
  };

  const airdrop = async () => {
    if (!publicKey) return;
    await fetch(`${BACKEND}/airdrop/${publicKey.toBase58()}`, { method: 'POST' });
    await loadBalances();
  };

  const deposit = async () => {
    if (tier === 'Free') return alert('Upgrade tier!');
    if (!publicKey || !sendTransaction || !amount) return;
    const lam = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
    const tx = new Transaction().add(
      SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: FARM_WALLET, lamports: lam }),
    );
    const sig = await sendTransaction(tx, connection);
    await fetch(`${BACKEND}/deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey: publicKey.toBase58(), amount: parseFloat(amount) }),
    });
    alert('Deposit tx: ' + sig);
    setAmount('');
    await loadBalances();
  };

  const withdraw = async () => {
    if (tier === 'Free') return alert('Upgrade tier!');
    if (!publicKey || !amount) return;
    const res = await fetch(`${BACKEND}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey: publicKey.toBase58(), amount: parseFloat(amount) }),
    });
    const data = await res.json();
    alert(data.success ? 'Withdraw successful' : 'Withdraw failed');
    setAmount('');
    await loadBalances();
  };

  const addBudget = async () => {
    if (!publicKey || !budget) return;
    await fetch(`${BACKEND}/budget/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pubkey: publicKey.toBase58(), amount: parseFloat(budget) }),
    });
    setBudget('');
    loadBudget();
  };

  const loadBudget = async () => {
    if (!publicKey) return;
    const res = await fetch(`${BACKEND}/budget/${publicKey.toBase58()}`);
    const data = await res.json();
    setBudgetHistory(data.budget);
  };

  useEffect(() => {
    if (publicKey) {
      loadBalances();
      loadTier();
      loadBudget();
    }
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-4">🌾 SolFarm</h1>
      <div className="flex justify-center mb-6"><WalletMultiButton /></div>

      {publicKey ? (
        <>
          <p>🆔 {publicKey.toBase58()}</p>

          {/* Profile Component */}
          <ProfilePage pubkey={publicKey.toBase58()} />

          {/* Wallet Section */}
          <div className="mt-6 bg-gray-800 p-4 rounded">
            <p>Balance: {balance?.toFixed(4)} SOL</p>
            <p>Farm Balance: {farmBalance?.toFixed(4)} SOL</p>

            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount to deposit/withdraw"
              className="w-full p-2 rounded text-black my-2"
            />
            <button onClick={airdrop} className="w-full py-2 bg-blue-500 rounded mb-2">Airdrop</button>
            <button onClick={deposit} className="w-full py-2 bg-green-500 rounded mb-2">
              {tier === 'Free' ? 'Upgrade Tier to Deposit' : 'Deposit'}
            </button>
            <button onClick={withdraw} className="w-full py-2 bg-red-500 rounded">
              {tier === 'Free' ? 'Upgrade Tier to Withdraw' : 'Withdraw'}
            </button>
          </div>

          {/* Budget Tracker */}
          <div className="mt-6 bg-gray-800 p-4 rounded">
            <h3 className="text-lg font-bold mb-2">💼 Crop Budget Tracker</h3>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="Add budget amount"
              className="w-full p-2 rounded text-black mb-2"
            />
            <button onClick={addBudget} className="w-full p-2 bg-indigo-600 rounded mb-2">Add Budget</button>
            <ul className="text-sm space-y-1">
              {budgetHistory.map((b, i) => (
                <li key={i}>₹{b.amount} — {new Date(b.timestamp).toLocaleDateString()}</li>
              ))}
              {budgetHistory.length === 0 && <li>No budgets added yet.</li>}
            </ul>
          </div>

          {/* Transaction History */}
          <h2 className="mt-6 text-xl">Transaction History</h2>
          <div className="mt-2 bg-gray-800 p-4 rounded max-h-64 overflow-y-auto text-sm">
            {history.map((tx, i) => (
              <div key={i}>
                [{new Date(tx.timestamp).toLocaleString()}] {tx.type}: {tx.amount} SOL
                {tx.txSig ? ` (sig: ${tx.txSig})` : ''}
              </div>
            ))}
            {history.length === 0 && <p>No history yet.</p>}
          </div>
        </>
      ) : (
        <p className="text-center">Connect wallet to continue</p>
      )}
    </div>
  );
}
