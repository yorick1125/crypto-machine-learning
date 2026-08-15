import { useState, useEffect } from 'react';
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

interface WatchlistItem {
  symbol: string;
  name: string;
  logo: string;
  price: number;
  change: number;
  volume: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  const [portfolioBalance, setPortfolioBalance] = useState(2048.0);
  const [totalReturn, setTotalReturn] = useState(150.0);
  const [balanceChangeDirection, setBalanceChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [returnChangeDirection, setReturnChangeDirection] = useState<'up' | 'down' | 'neutral'>('neutral');

  useEffect(() => {
    const interval = setInterval(() => {
      setPortfolioBalance((prev) => {
        const change = (Math.random() - 0.5) * 15;
        const newValue = Math.max(1900, Math.min(2200, prev + change));
        setBalanceChangeDirection(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
        return newValue;
      });

      setTotalReturn((prev) => {
        const change = (Math.random() - 0.5) * 8;
        const newValue = Math.max(100, Math.min(200, prev + change));
        setReturnChangeDirection(change > 0 ? 'up' : change < 0 ? 'down' : 'neutral');
        return newValue;
      });
    }, 2000);

    return () => clearInterval(interval);
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

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
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

  const btcHolding = 0.05; // Static BTC amount
  const marketCards = [
    {
      label: 'Portfolio balance',
      value: `${btcHolding.toFixed(4)} BTC`,
      subvalue: formatCurrency(portfolioBalance),
      change: `+${formatCurrency(totalReturn)}`,
      positive: true,
      icon: <Wallet size={18} />,
      color: 'sky',
      direction: balanceChangeDirection,
    },
    {
      label: 'Total return',
      value: `+${formatCurrency(totalReturn)}`,
      change: `+${((totalReturn / portfolioBalance) * 100).toFixed(2)}%`,
      positive: true,
      icon: <TrendingUp size={18} />,
      color: 'emerald',
      direction: returnChangeDirection,
    },
  ];

  const watchlist: WatchlistItem[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
      price: cryptoData.bitcoin?.cad ?? 0,
      change: cryptoData.bitcoin?.cad_24h_change ?? 0,
      volume: '$22.8B',
      sentiment: getSignal('btc') === 'Bullish' ? 'Bullish' : 'Bearish',
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
      price: cryptoData.ethereum?.cad ?? 0,
      change: cryptoData.ethereum?.cad_24h_change ?? 0,
      volume: '$15.6B',
      sentiment: getSignal('eth') === 'Bullish' ? 'Bullish' : 'Bearish',
    },
    {
      symbol: 'SOL',
      name: 'Solana',
      logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
      price: 198.45,
      change: 4.2,
      volume: '$5.8B',
      sentiment: 'Bullish',
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
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="w-full border-b border-white/10 bg-slate-950/70 p-5 backdrop-blur-xl lg:w-[260px] lg:border-b-0 lg:border-r lg:p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_18px_30px_rgba(249,115,22,0.28)]">
              <Bitcoin size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Portfolio</p>
              <h2 className="mt-1 text-xl font-semibold text-white">CryptoIQ</h2>
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
                Crypto Analysis Dashboard
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

          {!loading && !error && (
            <>
              <section className="mb-6 grid gap-4 md:grid-cols-2">
                {marketCards.map((card) => {
                  const bgColor = card.color === 'sky' ? 'bg-sky-500/10' : 'bg-emerald-500/10';
                  const textColor = card.color === 'sky' ? 'text-sky-300' : 'text-emerald-300';
                  const borderColor = card.color === 'sky' ? 'border-sky-400/20' : 'border-emerald-400/20';
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

              <section className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-slate-950/20 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Watchlist</p>
                    <h2 className="mt-1 text-xl font-bold text-white">Market movers</h2>
                  </div>
                  <button className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:bg-white/10">
                    Open alerts
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-5 gap-3 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    <span>Asset</span>
                    <span>Price</span>
                    <span>24h</span>
                    <span>Volume</span>
                    <span>Signal</span>
                  </div>

                  {watchlist.map((item) => (
                    <div key={item.symbol} className="grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-slate-950/30 px-3 py-3 sm:grid-cols-5 sm:items-center">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.logo}
                          alt={`${item.name} logo`}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-white/10"
                        />
                        <div>
                          <strong className="block text-sm font-bold text-white">{item.symbol}</strong>
                          <small className="text-xs text-slate-400">{item.name}</small>
                        </div>
                      </div>
                      <span className="text-sm text-slate-200">{formatCurrency(item.price)}</span>
                      <span className={item.change >= 0 ? 'text-sm font-semibold text-emerald-300' : 'text-sm font-semibold text-red-300'}>
                        {formatPercentage(item.change)}
                      </span>
                      <span className="text-sm text-slate-300">{item.volume}</span>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] ${item.sentiment === 'Bullish' ? 'bg-emerald-500/15 text-emerald-300' : item.sentiment === 'Bearish' ? 'bg-red-500/15 text-red-300' : 'bg-slate-700/80 text-slate-200'}`}>
                        {item.sentiment}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-emerald-500/10 to-blue-500/10 p-5">
            <h3 className="text-lg font-bold text-white">Important</h3>
            <p className="mt-2 text-sm leading-7 text-slate-200">
              Buy Ethereum low and sell Ethereum high in exchange for Bitcoin on a trusted Canadian crypto exchange,
              then transfer the Bitcoin to your own self-custody cold wallet.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

