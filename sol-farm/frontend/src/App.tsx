import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect, useState } from 'react';

function App() {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    if (!publicKey) return;
    try {
      const res = await fetch(`http://localhost:4000/balance/${publicKey.toBase58()}`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error('Error fetching balance:', err);
    }
  };

  const handleAirdrop = async () => {
    if (!publicKey) return;
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/airdrop/${publicKey.toBase58()}`, {
        method: 'POST',
      });
      const data = await res.json();
      alert(`✅ Airdrop complete! TX: ${data.signature}`);
      await fetchBalance();
    } catch (err) {
      console.error('Airdrop failed:', err);
      alert('❌ Airdrop failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">🚜 SolFarm</h1>

      <WalletMultiButton className="mb-6" />

      {publicKey ? (
        <>
          <p className="mb-2">🔑 Wallet: {publicKey.toBase58()}</p>
          <p className="mb-4">💰 Balance: {balance !== null ? `${balance} SOL` : 'Loading...'}</p>

          <button
            onClick={handleAirdrop}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {loading ? 'Requesting Airdrop...' : '💸 Airdrop 1 SOL'}
          </button>
        </>
      ) : (
        <p className="text-lg">🔌 Please connect your wallet</p>
      )}
    </div>
  );
}

export default App;
