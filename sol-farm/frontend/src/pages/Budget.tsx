import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export default function Budget() {
  const { publicKey } = useWallet();
  const [savings, setSavings] = useState<number>(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');

  const fetchBudget = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`http://localhost:4000/budget/${publicKey.toBase58()}`);
      const data = await res.json();
      setSavings(data.savings);
      setGoals(data.goals);
    } catch (e) {
      console.log('No existing budget');
    }
  };

  const saveBudget = async () => {
    if (!publicKey) return;
    await fetch('http://localhost:4000/budget/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pubkey: publicKey.toBase58(),
        savings,
        goals,
      }),
    });
    alert('Budget saved');
  };

  useEffect(() => {
    fetchBudget();
  }, [publicKey]);

  return (
    <div className="p-6 text-gray-800">
      <h2 className="text-2xl font-bold mb-4">💰 Savings Tracker</h2>
      <div className="mb-4">
        <label className="block mb-2">Your Saved Amount (SOL)</label>
        <input
          type="number"
          value={savings}
          onChange={(e) => setSavings(Number(e.target.value))}
          className="border p-2 rounded w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">Add a Goal</label>
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button
          className="bg-green-600 text-white mt-2 px-4 py-1 rounded"
          onClick={() => {
            if (goalInput) {
              setGoals([...goals, goalInput]);
              setGoalInput('');
            }
          }}
        >
          ➕ Add Goal
        </button>
      </div>

      <div className="mb-4">
        <h4 className="font-bold mb-2">Your Goals:</h4>
        <ul className="list-disc list-inside">
          {goals.map((g, i) => (
            <li key={i}>{g}</li>
          ))}
        </ul>
      </div>

      <button onClick={saveBudget} className="bg-blue-600 text-white px-6 py-2 rounded">
        Save Budget
      </button>
    </div>
  );
}
