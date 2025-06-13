import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-green-50 text-gray-800 p-8">
      <h1 className="text-4xl font-bold mb-4 text-center">🌾 Welcome to SolFarm</h1>
      <p className="text-lg text-center mb-10 max-w-2xl mx-auto">
        Empowering farmers with decentralized finance on Solana. Track earnings, deposit funds, access farming tools, and manage savings securely.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {[
          { name: 'Free', features: ['Basic wallet access', 'View balance'] },
          { name: 'Advanced', features: ['Deposit/Withdraw', 'Transaction history'] },
          { name: 'Prime', features: ['Monthly analytics', 'Budgeting tool', 'Grant application assistance'] }
        ].map((tier) => (
          <div key={tier.name} className="bg-white rounded shadow p-6 text-center">
            <h2 className="text-2xl font-bold">{tier.name} Tier</h2>
            <ul className="mt-4 text-left list-disc list-inside">
              {tier.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          onClick={() => navigate('/app')}
        >
          Login to Start Farming 🚜
        </button>
      </div>
    </div>
  );
}
