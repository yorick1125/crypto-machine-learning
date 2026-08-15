import { useState, useEffect } from 'react';
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Bitcoin,
  RefreshCw,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface CryptoPriceData {
  cad: number;
  cad_24h_change: number;
}

interface CryptoData {
  bitcoin?: CryptoPriceData;
  ethereum?: CryptoPriceData;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GoogleUser {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export default function App() {
  const [cryptoData, setCryptoData] = useState<CryptoData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advisorInput, setAdvisorInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'I can help with crypto positioning, market structure, and portfolio risk.',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [balanceChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [returnChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [walletFormOpen, setWalletFormOpen] = useState<'send' | 'receive' | null>(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [receiveAddress, setReceiveAddress] = useState('');
  const [sentimentLive, setSentimentLive] = useState(true);
  const [socialSentiment, setSocialSentiment] = useState([
    { platform: 'YouTube', icon: 'YT', buyers: 74, sellers: 26 },
    { platform: 'TikTok', icon: 'TT', buyers: 68, sellers: 32 },
    { platform: 'X', icon: 'X', buyers: 51, sellers: 49 },
    { platform: 'Instagram', icon: 'IG', buyers: 44, sellers: 56 },
    { platform: 'LinkedIn', icon: 'LI', buyers: 38, sellers: 62 },
  ]);

  useEffect(() => {
    // Balances are set to zero and static
    return () => {};
  }, []);

  useEffect(() => {
    const API_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=cad&include_24hr_change=true';

    const fetchCryptoData = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Failed to fetch cryptocurrency data');
        }
        const data: CryptoData = await response.json();
        setCryptoData(data);
      } catch (e) {
        console.error('Error fetching crypto data:', e);
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
  }, []);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setGoogleAuthError('Google sign-in returned no credential.');
      return;
    }

    const decodedUser = jwtDecode<GoogleUser>(credentialResponse.credential);
    setGoogleUser(decodedUser);
    setGoogleAuthError(null);
  };

  const handleGoogleError = () => {
    setGoogleAuthError('Google sign-in failed. Please try again.');
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getSignal = (asset: 'btc' | 'eth') => {
    const value = asset === 'btc' ? cryptoData.bitcoin?.cad_24h_change : cryptoData.ethereum?.cad_24h_change;
    if (value === undefined || value === null) return 'N/A';
    return value >= 0 ? 'Bullish' : 'Bearish';
  };

  const handleAdvisorSubmit = async () => {
    const trimmedInput = advisorInput.trim();
    if (!trimmedInput || chatLoading) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmedInput };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setAdvisorInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('Add VITE_OPENAI_API_KEY to your .env file before using the advisor.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content:
                'You are a concise, practical crypto market advisor focused on Canadian investor context. Give tactical, risk-aware insights using plain English and short bullet points when useful.',
            },
            ...nextMessages.slice(-10),
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message ?? 'OpenAI request failed');
      }

      const assistantReply = data?.choices?.[0]?.message?.content?.trim();
      if (!assistantReply) {
        throw new Error('OpenAI returned an empty response.');
      }

      setMessages((current) => [...current, { role: 'assistant', content: assistantReply }]);
    } catch (event) {
      const errorMessage = event instanceof Error ? event.message : 'The advisor could not respond right now.';
      setChatError(errorMessage);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'I hit an issue while contacting OpenAI. Check your API key and try again.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const btcHolding = 0; // Static BTC amount
  const totalReturnValue = 0; // For color determination
  
  const getTotalReturnColor = () => {
    if (totalReturnValue > 0) return 'emerald';
    if (totalReturnValue < 0) return 'red';
    return 'slate';
  };

  const marketCards = [
    {
      label: 'Portfolio balance',
      value: `${btcHolding.toFixed(4)} BTC`,
      subvalue: formatCurrency(0),
      change: `+${formatCurrency(0)}`,
      positive: true,
      icon: <Wallet size={18} />,
      color: 'sky',
      direction: balanceChangeDirection,
    },
    {
      label: 'Total return',
      value: `${totalReturnValue >= 0 ? '+' : ''}${formatCurrency(totalReturnValue)}`,
      change: `${totalReturnValue >= 0 ? '+' : ''}0.00%`,
      positive: totalReturnValue >= 0,
      icon: <TrendingUp size={18} />,
      color: getTotalReturnColor(),
      direction: returnChangeDirection,
    },
  ];

  const positions = [
    { label: 'BTC allocation', value: '42%', accent: 'btc' },
    { label: 'SOL allocation', value: '31%', accent: 'eth' },
    { label: 'Stable coin', value: '27%', accent: 'neutral' },
  ];

  const assetRanking = [
    { name: 'Bitcoin', ticker: 'BTC', performance: 286, color: 'bg-sky-400', accent: 'text-sky-300' },
    { name: 'S&P 500', ticker: 'SPX', performance: 96, color: 'bg-red-400', accent: 'text-red-300' },
    { name: 'Gold', ticker: 'XAU', performance: 68, color: 'bg-yellow-300', accent: 'text-yellow-300' },
    { name: 'US Bonds', ticker: 'BND', performance: 24, color: 'bg-emerald-400', accent: 'text-emerald-300' },
  ];

  useEffect(() => {
    if (!sentimentLive) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSocialSentiment((current) =>
        current.map((item) => {
          const drift = (Math.random() - 0.5) * 18;
          const nextBuyers = Math.max(20, Math.min(85, Math.round(item.buyers + drift)));
          const nextSellers = 100 - nextBuyers;

          return {
            ...item,
            buyers: nextBuyers,
            sellers: nextSellers,
          };
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, [sentimentLive]);

  const overallBuyers = Math.round(
    socialSentiment.reduce((sum, item) => sum + item.buyers, 0) / socialSentiment.length
  );
  const overallSellers = 100 - overallBuyers;

  const isAuthenticated = googleUser !== null;

  const fiveYearSeries = [
    { label: '2021', btc: 100, spy: 100, gold: 100, bonds: 100 },
    { label: '2022', btc: 52, spy: 82, gold: 109, bonds: 96 },
    { label: '2023', btc: 172, spy: 118, gold: 116, bonds: 103 },
    { label: '2024', btc: 236, spy: 154, gold: 140, bonds: 108 },
    { label: '2025', btc: 155, spy: 126, gold: 128, bonds: 98 },
    { label: '2026', btc: 112, spy: 118, gold: 121, bonds: 92 },
  ];

  const chartPath = (key: 'btc' | 'spy' | 'gold' | 'bonds') => {
    const width = 520;
    const height = 220;
    const padding = 24;
    const maxValue = 250;
    const minValue = 0;
    const xStep = (width - padding * 2) / (fiveYearSeries.length - 1);

    return fiveYearSeries
      .map((point, index) => {
        const x = padding + xStep * index;
        const y = height - padding - ((point[key] - minValue) / (maxValue - minValue || 1)) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {!isAuthenticated ? (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,#020817,#0f172a_45%,#111827)] px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_18px_30px_rgba(249,115,22,0.28)]">
                <Bitcoin size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Portfolio</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">MarketIQ</h2>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Secure access</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Sign in to access the market dashboard</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You need to be successfully authenticated with Google before you can view market intelligence, portfolio data, and social sentiment signals.
            </p>

            <div className="mt-6 flex justify-center">
              {clientId ? (
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="filled_black"
                  shape="pill"
                  text="signin_with"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setGoogleAuthError('Add VITE_GOOGLE_CLIENT_ID to your .env file to enable Google auth.')}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-[0_18px_24px_rgba(59,130,246,0.2)] transition hover:-translate-y-0.5"
                >
                  Sign in with Google
                </button>
              )}
            </div>

            {googleAuthError && (
              <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                {googleAuthError}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row relative">
          {/* User menu dropdown - top right corner */}
          <div className="fixed top-5 right-5 z-50">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/70 text-white transition hover:bg-slate-800/70"
              aria-label="User menu"
            >
              {googleUser.picture ? (
                <img src={googleUser.picture} alt={googleUser.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 text-xs font-bold text-white">
                  {googleUser.name.charAt(0).toUpperCase()}
                </div>
              )}
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
                <div className="border-b border-white/10 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Signed in as</p>
                  <p className="mt-2 text-sm font-semibold text-white">{googleUser.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{googleUser.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    googleLogout();
                    setGoogleUser(null);
                    setUserDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>

          <aside className="w-full border-b border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:w-[260px] lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_18px_30px_rgba(249,115,22,0.28)]">
                <Bitcoin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Portfolio</p>
                <h2 className="mt-1 text-xl font-semibold text-white">MoneyIQ</h2>
              </div>
            </div>

            <nav className="mt-6 grid gap-2.5">
              {/* Navigation removed - using unified view */}
            </nav>

            <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">AI advisor</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Market copilot</h3>

              <div className="mt-4 max-h-56 space-y-2.5 overflow-y-auto pr-1">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`rounded-xl border p-2.5 text-xs leading-5 ${
                      message.role === 'user'
                        ? 'ml-4 border-blue-500/20 bg-blue-500/10 text-blue-50'
                        : 'mr-4 border-white/5 bg-slate-950/60 text-slate-200'
                    }`}
                  >
                    <span className="mb-1 block font-semibold text-slate-100">
                      {message.role === 'user' ? 'You' : 'AI'}
                    </span>
                    {message.content}
                  </div>
                ))}
                {chatLoading && (
                  <div className="mr-4 rounded-xl border border-white/5 bg-slate-950/60 p-2.5 text-xs text-slate-300">
                    Thinking…
                  </div>
                )}
                {chatError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs leading-5 text-red-100">
                    {chatError}
                  </div>
                )}
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/90 px-2.5 py-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <input
                    type="text"
                    value={advisorInput}
                    onChange={(event) => setAdvisorInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleAdvisorSubmit();
                      }
                    }}
                    placeholder="Ask advisor"
                    className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
                    disabled={chatLoading}
                  />
                  <button
                    type="button"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-[0_10px_16px_rgba(59,130,246,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label="Send message"
                    onClick={() => void handleAdvisorSubmit()}
                    disabled={chatLoading || !advisorInput.trim()}
                  >
                    <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-2xl shadow-slate-950/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Strategy</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Signal</h3>
              <div className="mt-3 inline-flex rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-black uppercase tracking-[0.12em] text-emerald-300">
                {getSignal('eth') === 'Bullish' ? 'BUY' : 'SELL'}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Ethereum momentum remains {getSignal('eth').toLowerCase()} based on the last 24-hour move.
              </p>
            </div>
          </aside>

          <main className="flex-1 p-5 sm:p-6 lg:p-8">
            <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Market overview</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl text-shadow-soft">
                  Market Dashboard
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2.5 text-sm text-slate-300">
                  <Search size={16} />
                  <span>Search assets</span>
                </div>
                <button className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-slate-900/70 text-slate-100 transition hover:-translate-y-0.5" aria-label="Notifications">
                  <Bell size={18} />
                </button>
                <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_24px_rgba(59,130,246,0.2)] transition hover:-translate-y-0.5">
                  <RefreshCw size={15} />
                  Sync data
                </button>
              </div>
            </header>

            {/* Investment Thesis Section */}
            <section className="mb-8 rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-slate-900/50 to-emerald-500/10 p-6 shadow-2xl shadow-slate-950/30">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">Investment thesis</p>
              <p className="mt-4 text-lg leading-7 text-slate-100">
                Bitcoin represents decentralized, global technological infrastructure—a shift from concentrated corporate tech to collaborative innovation. It's the solarpunk future: open-source, borderless, and built by millions rather than monopolies.
              </p>
            </section>

            {loading && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-white/10 bg-slate-900/75 p-5 shadow-2xl shadow-slate-950/20">
                <div className="h-11 w-11 animate-spin rounded-full border-3 border-slate-700 border-t-emerald-400" aria-label="Loading data" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Syncing data</p>
                  <h2 className="mt-1 text-2xl font-bold text-white">Loading market data…</h2>
                </div>
              </div>
            )}

            {error && !loading && (
              <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">Alert</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Market feed unavailable</h2>
                <p className="mt-2 text-red-100">{error}</p>
              </div>
            )}

            {googleAuthError && (
              <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">Google auth</p>
                <p className="mt-2 text-sm text-amber-100">{googleAuthError}</p>
              </div>
            )}

            {!loading && !error && (
              <>
                <section className="mb-6 grid gap-4 md:grid-cols-2">
                  {marketCards.map((card) => {
                    const bgColor = card.color === 'sky' ? 'bg-sky-500/10' : 'bg-emerald-500/10';
                    const textColor = card.color === 'sky' ? 'text-sky-300' : 'text-emerald-300';
                    const borderColor = card.color === 'sky' ? 'border-sky-400/20' : 'border-emerald-400/20';
                    const isPortfolioCard = card.label === 'Portfolio balance';
                    return (
                      <article key={card.label} className={`rounded-2xl border ${borderColor} ${bgColor} p-4 shadow-2xl shadow-slate-950/20 transition-all duration-300`}>
                        <div className="mb-4 flex items-center justify-between">
                          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgColor} ${textColor}`}>{card.icon}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${card.positive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                            {card.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            {card.change}
                          </span>
                        </div>
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-400">{card.label}</p>
                        <h3 className="mt-3 text-2xl font-bold text-orange-400 transition-all duration-300 tabular-nums">{card.value}</h3>
                        {card.subvalue && (
                          <p className="mt-1 text-sm text-slate-300 transition-all duration-300 tabular-nums">{card.subvalue}</p>
                        )}
                        {isPortfolioCard && (
                          <div className="mt-4 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setWalletFormOpen('send')}
                              className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                            >
                              Send
                            </button>
                            <button
                              type="button"
                              onClick={() => setWalletFormOpen('receive')}
                              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:brightness-110"
                            >
                              Receive
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </section>

                <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/20 sm:p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Relative strength</p>
                      <h2 className="mt-1 text-xl font-bold text-white">5-year performance</h2>
                    </div>
                    <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300">
                      Indexed to 100
                    </span>
                  </div>

                  <div className="mb-5 rounded-2xl border border-white/5 bg-slate-950/30 p-3">
                    <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      <span>Y-axis</span>
                      <span>Indexed performance (%)</span>
                    </div>
                    <svg viewBox="0 0 520 220" className="h-56 w-full" role="img" aria-label="Five-year comparison chart for Bitcoin, S&P 500, Gold and bonds">
                      {[0, 50, 100, 150, 200, 250].map((gridValue) => {
                        const y = 196 - ((gridValue / 250) * 160);
                        return (
                          <g key={gridValue}>
                            <line x1="24" x2="496" y1={y} y2={y} stroke="rgba(148,163,184,0.2)" strokeDasharray="4 6" />
                            <text x="4" y={y + 4} fill="rgba(148,163,184,0.7)" fontSize="10">{gridValue}%</text>
                          </g>
                        );
                      })}

                      {fiveYearSeries.map((point, index) => {
                        const x = 24 + (index * (472 / (fiveYearSeries.length - 1)));
                        return (
                          <g key={point.label}>
                            <line x1={x} x2={x} y1="24" y2="196" stroke="rgba(148,163,184,0.08)" />
                            <text x={x - 8} y="212" fill="rgba(148,163,184,0.8)" fontSize="10">{point.label}</text>
                          </g>
                        );
                      })}

                      <path d={chartPath('btc')} fill="none" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
                      <path d={chartPath('spy')} fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" />
                      <path d={chartPath('gold')} fill="none" stroke="#facc15" strokeWidth="3" strokeLinecap="round" />
                      <path d={chartPath('bonds')} fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" />BTC</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-400" />S&P</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-yellow-300" />Gold</span>
                    <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Bonds</span>
                  </div>

                  <div className="space-y-3">
                    {assetRanking.map((asset, index) => (
                      <div key={asset.ticker} className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-slate-950 shadow-sm shadow-slate-900/20 ${asset.color}`}>
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-white">{asset.name}</p>
                              <p className="text-[10px] uppercase tracking-[0.15em] text-slate-400">{asset.ticker}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-bold ${asset.accent}`}>+{asset.performance}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full ${asset.color}`}
                            style={{ width: `${Math.max((asset.performance / 15) * 100, 18)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-6 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/20 sm:p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Retail sentiment</p>
                      <h2 className="mt-1 text-xl font-bold text-white">Social media trends</h2>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">
                        Buyers {overallBuyers}%
                      </div>
                      <button
                        type="button"
                        onClick={() => setSentimentLive((current) => !current)}
                        className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
                      >
                        {sentimentLive ? 'Pause live' : 'Resume live'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 rounded-2xl border border-white/5 bg-slate-950/30 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Algorithmic mix</p>
                        <h3 className="mt-1 text-2xl font-black text-white">{overallBuyers}% buyers</h3>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-300">
                        {overallSellers}% sellers
                      </span>
                    </div>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="flex h-full w-full">
                        <div className="h-full rounded-l-full bg-gradient-to-r from-emerald-400 to-lime-400" style={{ width: `${overallBuyers}%` }} />
                        <div className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${overallSellers}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {socialSentiment.map((item) => (
                      <div key={item.platform} className="rounded-xl border border-white/5 bg-slate-950/30 p-3">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-[10px] font-black text-cyan-300">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{item.platform}</p>
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Algorithmic signal</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-emerald-300">
                              {item.buyers}% buyers
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                          <div className="flex h-full w-full">
                            <div className="h-full rounded-l-full bg-gradient-to-r from-emerald-400 to-lime-400" style={{ width: `${item.buyers}%` }} />
                            <div className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: `${item.sellers}%` }} />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.12em] text-slate-400">
                          <span>Likely buyers</span>
                          <strong className="text-sm font-bold text-white">{item.buyers}%</strong>
                          <span>Likely sellers</span>
                          <strong className="text-sm font-bold text-white">{item.sellers}%</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mb-6 grid gap-4 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/20 sm:p-5">
                    <div className="mb-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Allocation</p>
                      <h2 className="mt-1 text-xl font-bold text-white">Portfolio mix</h2>
                    </div>

                    <div className="space-y-4">
                      {positions.map((position) => (
                        <div key={position.label} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-2.5 text-sm text-slate-200">
                            <span className={`h-2.5 w-2.5 rounded-full ${position.accent === 'btc' ? 'bg-amber-400' : position.accent === 'eth' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                            {position.label}
                          </div>
                          <span className="text-sm font-bold text-white">{position.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-400">
                        <span>Risk score</span>
                        <strong className="text-sm font-bold text-white">68 / 100</strong>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Send Modal */}
            {walletFormOpen === 'send' && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/50">
                  <h2 className="text-2xl font-bold text-white">Send crypto</h2>
                  <p className="mt-1 text-sm text-slate-400">Transfer funds to a wallet address</p>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Wallet address</label>
                      <input
                        type="text"
                        value={sendAddress}
                        onChange={(e) => setSendAddress(e.target.value)}
                        placeholder="0x..."
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Amount</label>
                      <input
                        type="number"
                        value={sendAmount}
                        onChange={(e) => setSendAmount(e.target.value)}
                        placeholder="0.00"
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWalletFormOpen(null)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Handle send logic here
                        setWalletFormOpen(null);
                        setSendAddress('');
                        setSendAmount('');
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Receive Modal */}
            {walletFormOpen === 'receive' && (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/50">
                  <h2 className="text-2xl font-bold text-white">Receive crypto</h2>
                  <p className="mt-1 text-sm text-slate-400">Share your wallet address to receive funds</p>
                  
                  <div className="mt-6">
                    <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Your wallet address</label>
                    <input
                      type="text"
                      value={receiveAddress}
                      onChange={(e) => setReceiveAddress(e.target.value)}
                      placeholder="0x..."
                      className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="mt-2 text-xs text-slate-400">Enter your wallet address where you want to receive funds</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setWalletFormOpen(null)}
                      className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Copy address to clipboard
                        if (receiveAddress) {
                          navigator.clipboard.writeText(receiveAddress);
                        }
                        setWalletFormOpen(null);
                        setReceiveAddress('');
                      }}
                      className="flex-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      Copy Address
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

