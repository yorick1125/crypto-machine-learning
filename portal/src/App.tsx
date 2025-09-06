import { useState, useEffect } from 'react';

// Define the shape of the data we expect from the CoinGecko API.
// This helps with type safety and eliminates VS Code's "red squiggly lines" (linter warnings).
interface CryptoPriceData {
  cad: number;
  cad_24h_change: number;
}

interface CryptoData {
  bitcoin?: CryptoPriceData;
  ethereum?: CryptoPriceData;
}

// This is the main component of the application.
export default function App() {
  // State variables for storing the fetched cryptocurrency data, loading status, and any errors.
  // We initialize cryptoData with an empty object of type CryptoData to be type-safe.
  const [cryptoData, setCryptoData] = useState<CryptoData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useEffect hook to handle the API call when the component mounts.
  useEffect(() => {
    // This is the CoinGecko API endpoint to get prices for Bitcoin and Ethereum in Canadian Dollars (CAD).
    // We also include the 24-hour price change to help with our analysis logic.
    const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=cad&include_24hr_change=true';

    // Asynchronous function to fetch the data.
    const fetchCryptoData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch cryptocurrency data');
        }
        const data: CryptoData = await response.json();
        setCryptoData(data);
      } catch (e) {
        // Handle any errors that occur during the fetch process.
        console.error("Error fetching crypto data:", e);
        setError((e as Error).message); 
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, []); 

  const getEthereumSignal = () => {
    const change = cryptoData.ethereum?.cad_24h_change;
    if (change === undefined || change === null) {
      return "N/A";
    }
    return change < 0 ? "BUY" : "SELL";
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return "N/A";
    const formattedValue = value.toFixed(2);
    const colorClass = value < 0 ? 'text-red-400' : 'text-green-400';
    return <span className={colorClass}>{formattedValue}%</span>;
  };

  return (
    <div className="bg-gray-900 min-h-screen p-8 text-gray-100 font-inter">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-extrabold text-white">Crypto Analysis Dashboard</h1>
          <p className="mt-4 text-xl text-gray-400">
            Real-time price analysis for Bitcoin and Ethereum.
          </p>
        </header>

        {/* Conditional rendering for loading, error, and data states */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
            <p className="ml-4 text-lg text-gray-300">Loading data...</p>
          </div>
        )}

        {error && (
          <div className="text-center p-8 bg-red-800 text-white rounded-xl shadow-lg">
            <p className="text-xl font-semibold">Error: {error}</p>
            <p className="mt-2">Please try again later.</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Bitcoin Card */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <svg className="h-10 w-10 text-orange-400 mr-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5.72 13.96c-.66.8-1.57 1.34-2.6 1.62-.28.08-.5.1-.73.1-.76 0-1.22-.38-1.22-.96 0-.32.14-.54.5-.72.36-.18.8-.32 1.3-.42.5-.1.9-.22 1.28-.4.36-.18.54-.42.54-.7.04-.3-.14-.5-.46-.66-.32-.14-.72-.22-1.18-.22-.64 0-1.16.2-1.56.58-.4.38-.6.9-.64 1.5l-2.02.46c.06-1.1.48-1.92 1.28-2.58.8-.66 1.72-1.04 2.82-1.04.88 0 1.5.2 1.88.54.4.32.6.72.6 1.18 0 .4-.1.74-.3.98-.2.24-.5.42-.84.54-.34.12-.66.2-.9.24-.26.04-.42.06-.5.06-.2 0-.38-.02-.54-.06-.16-.04-.3-.1-.4-.14-.14-.04-.2-.1-.2-.18v-1.6c.06-.2.16-.36.3-.5.14-.14.3-.24.5-.32.2-.08.42-.1.66-.1.68 0 1.2.2 1.54.6.34.4.52.88.52 1.48 0 .62-.22 1.1-.64 1.48z"/>
                </svg>
                <h2 className="text-3xl font-bold text-white">Bitcoin (BTC)</h2>
              </div>
              <p className="text-5xl font-bold text-white mt-4">{formatCurrency(cryptoData.bitcoin?.cad)}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-lg text-gray-400">24h Change: {formatPercentage(cryptoData.bitcoin?.cad_24h_change)}</p>
                <div className="px-4 py-2 rounded-full font-bold text-lg bg-green-600 text-white shadow-md">
                  BUY
                </div>
              </div>
            </div>

            {/* Ethereum Card */}
            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <svg className="h-10 w-10 text-gray-300 mr-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 1.58L19.42 10 12 18.42 4.58 10 12 3.58zM12 5.6L5.6 12 12 18.4l6.4-6.4L12 5.6z"/>
                </svg>
                <h2 className="text-3xl font-bold text-white">Ethereum (ETH)</h2>
              </div>
              <p className="text-5xl font-bold text-white mt-4">{formatCurrency(cryptoData.ethereum?.cad)}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-lg text-gray-400">24h Change: {formatPercentage(cryptoData.ethereum?.cad_24h_change)}</p>
                <div className={`px-4 py-2 rounded-full font-bold text-lg shadow-md ${getEthereumSignal() === "BUY" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
                  {getEthereumSignal()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User's message section */}
        <div className="mt-12 p-8 bg-gray-800 rounded-2xl shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-4">Important Information</h3>
          <p className="text-lg text-gray-400 leading-relaxed">
            Buy Ethereum low and sell Ethereum high in exchange for Bitcoin on a trusted Canadian crypto exchange, and then transfer the Bitcoin to your own self-custody cold wallet.
          </p>
        </div>
      </div>
    </div>
  );
}

