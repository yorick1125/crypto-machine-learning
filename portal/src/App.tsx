import { useState, useEffect } from 'react';
import { Wallet, Send, ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Copy, QrCode, RefreshCw, Bitcoin, Zap, Plus, History, Shield, Settings } from 'lucide-react';

interface WalletBalance {
  btc: number;
  eth: number;
  btcCad: number;
  ethCad: number;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  currency: 'BTC' | 'ETH';
  amount: number;
  cadAmount: number;
  address: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'failed';
  fee?: number;
}

interface CryptoPrices {
  btc: number;
  eth: number;
}

export default function CryptoWallet() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'send' | 'receive' | 'history'>('wallet');
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<'BTC' | 'ETH'>('BTC');
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<CryptoPrices>({ btc: 65000, eth: 3500 });
  
  // Wallet state
  const [walletBalance, setWalletBalance] = useState<WalletBalance>({
    btc: 0.02547831,
    eth: 1.25643210,
    btcCad: 0,
    ethCad: 0
  });
  
  const [walletAddress] = useState({
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    ETH: '0x742d35Cc6634C0532925a3b8D9F9EL8f7E1b19Ce'
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'received',
      currency: 'BTC',
      amount: 0.01234567,
      cadAmount: 802.50,
      address: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
      timestamp: new Date('2024-12-15T10:30:00'),
      status: 'confirmed'
    },
    {
      id: '2',
      type: 'sent',
      currency: 'ETH',
      amount: 0.5,
      cadAmount: 1750.00,
      address: '0x8ba1f109551bD432803012645Hac136c',
      timestamp: new Date('2024-12-14T15:45:00'),
      status: 'confirmed',
      fee: 0.002
    },
    {
      id: '3',
      type: 'received',
      currency: 'ETH',
      amount: 1.0,
      cadAmount: 3500.00,
      address: '0x9ba2f209661cD542804123456Hac246d',
      timestamp: new Date('2024-12-13T09:15:00'),
      status: 'confirmed'
    }
  ]);
  
  const [sendForm, setSendForm] = useState({
    amount: '',
    address: '',
    note: ''
  });
  
  // Fetch prices (simulated)
  const fetchPrices = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPrices({ btc: 65000 + Math.random() * 2000 - 1000, eth: 3500 + Math.random() * 200 - 100 });
      setLoading(false);
    }, 1000);
  };
  
  useEffect(() => {
    const updateCADValues = () => {
      setWalletBalance(prev => ({
        ...prev,
        btcCad: prev.btc * prices.btc,
        ethCad: prev.eth * prices.eth
      }));
    };
    updateCADValues();
  }, [prices, walletBalance.btc, walletBalance.eth]);
  
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const formatCrypto = (amount: number, currency: 'BTC' | 'ETH') => {
    return `${amount.toFixed(8)} ${currency}`;
  };
  
  const formatCAD = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };
  
  const getTotalBalance = () => {
    return walletBalance.btcCad + walletBalance.ethCad;
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // In a real app, you'd show a toast notification
  };
  
  const handleSend = () => {
    if (!sendForm.amount || !sendForm.address) return;
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'sent',
      currency: selectedCurrency,
      amount: parseFloat(sendForm.amount),
      cadAmount: parseFloat(sendForm.amount) * (selectedCurrency === 'BTC' ? prices.btc : prices.eth),
      address: sendForm.address,
      timestamp: new Date(),
      status: 'pending',
      fee: selectedCurrency === 'BTC' ? 0.0001 : 0.002
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    // Update balance
    setWalletBalance(prev => ({
      ...prev,
      [selectedCurrency.toLowerCase()]: prev[selectedCurrency.toLowerCase() as keyof WalletBalance] - parseFloat(sendForm.amount)
    }));
    
    setSendForm({ amount: '', address: '', note: '' });
    setActiveTab('wallet');
  };
  
  const WalletTab = () => (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 text-white shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-sm font-medium">Total Balance</p>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-bold">
                {balanceVisible ? formatCAD(getTotalBalance()) : '••••••'}
              </h2>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {balanceVisible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchPrices}
              disabled={loading}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bitcoin size={24} className="text-orange-400" />
              <span className="font-semibold">Bitcoin</span>
            </div>
            <p className="text-2xl font-bold">{balanceVisible ? formatCrypto(walletBalance.btc, 'BTC') : '•••••'}</p>
            <p className="text-blue-100 text-sm">{balanceVisible ? formatCAD(walletBalance.btcCad) : '•••••'}</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={24} className="text-blue-400" />
              <span className="font-semibold">Ethereum</span>
            </div>
            <p className="text-2xl font-bold">{balanceVisible ? formatCrypto(walletBalance.eth, 'ETH') : '•••••'}</p>
            <p className="text-blue-100 text-sm">{balanceVisible ? formatCAD(walletBalance.ethCad) : '•••••'}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('send')}
          className="flex flex-col items-center gap-3 p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all hover:scale-105"
        >
          <div className="p-3 bg-red-600 rounded-xl">
            <Send size={24} className="text-white" />
          </div>
          <span className="font-semibold text-white">Send</span>
        </button>
        
        <button
          onClick={() => setActiveTab('receive')}
          className="flex flex-col items-center gap-3 p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all hover:scale-105"
        >
          <div className="p-3 bg-green-600 rounded-xl">
            <ArrowDownLeft size={24} className="text-white" />
          </div>
          <span className="font-semibold text-white">Receive</span>
        </button>
        
        <button
          onClick={() => setActiveTab('history')}
          className="flex flex-col items-center gap-3 p-6 bg-gray-800 hover:bg-gray-700 rounded-2xl transition-all hover:scale-105"
        >
          <div className="p-3 bg-blue-600 rounded-xl">
            <History size={24} className="text-white" />
          </div>
          <span className="font-semibold text-white">History</span>
        </button>
      </div>
      
      {/* Recent Transactions */}
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {transactions.slice(0, 3).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${tx.type === 'sent' ? 'bg-red-600' : 'bg-green-600'}`}>
                  {tx.type === 'sent' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                </div>
                <div>
                  <p className="text-white font-medium">
                    {tx.type === 'sent' ? 'Sent' : 'Received'} {tx.currency}
                  </p>
                  <p className="text-gray-400 text-sm">{tx.timestamp.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                  {tx.type === 'sent' ? '-' : '+'}{formatCrypto(tx.amount, tx.currency)}
                </p>
                <p className="text-gray-400 text-sm">{formatCAD(tx.cadAmount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
  
  const SendTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Send Cryptocurrency</h3>
        
        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedCurrency('BTC')}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
              selectedCurrency === 'BTC' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Bitcoin size={24} />
            <div className="text-left">
              <p className="font-semibold">Bitcoin</p>
              <p className="text-sm opacity-80">{formatCrypto(walletBalance.btc, 'BTC')}</p>
            </div>
          </button>
          
          <button
            onClick={() => setSelectedCurrency('ETH')}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
              selectedCurrency === 'ETH' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap size={24} />
            <div className="text-left">
              <p className="font-semibold">Ethereum</p>
              <p className="text-sm opacity-80">{formatCrypto(walletBalance.eth, 'ETH')}</p>
            </div>
          </button>
        </div>
        
        {/* Send Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={sendForm.amount}
                onChange={(e) => setSendForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder={`0.00000000 ${selectedCurrency}`}
                step="0.00000001"
                className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute right-4 top-4 text-gray-400 text-sm">
                ≈ {formatCAD(parseFloat(sendForm.amount || '0') * (selectedCurrency === 'BTC' ? prices.btc : prices.eth))}
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={sendForm.address}
              onChange={(e) => setSendForm(prev => ({ ...prev, address: e.target.value }))}
              placeholder={selectedCurrency === 'BTC' ? 'bc1q...' : '0x...'}
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Note (Optional)</label>
            <input
              type="text"
              value={sendForm.note}
              onChange={(e) => setSendForm(prev => ({ ...prev, note: e.target.value }))}
              placeholder="Add a note..."
              className="w-full p-4 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Transaction Fee */}
        <div className="mt-6 p-4 bg-gray-700/50 rounded-xl">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee:</span>
            <span className="text-white">
              {formatCrypto(selectedCurrency === 'BTC' ? 0.0001 : 0.002, selectedCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-400">Total Amount:</span>
            <span className="text-white font-medium">
              {formatCrypto(
                (parseFloat(sendForm.amount || '0')) + (selectedCurrency === 'BTC' ? 0.0001 : 0.002), 
                selectedCurrency
              )}
            </span>
          </div>
        </div>
        
        <button
          onClick={handleSend}
          disabled={!sendForm.amount || !sendForm.address}
          className="w-full mt-6 p-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white font-semibold transition-colors"
        >
          Send {selectedCurrency}
        </button>
      </div>
    </div>
  );
  
  const ReceiveTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Receive Cryptocurrency</h3>
        
        {/* Currency Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setSelectedCurrency('BTC')}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
              selectedCurrency === 'BTC' 
                ? 'bg-orange-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Bitcoin size={24} />
            <span className="font-semibold">Bitcoin</span>
          </button>
          
          <button
            onClick={() => setSelectedCurrency('ETH')}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
              selectedCurrency === 'ETH' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap size={24} />
            <span className="font-semibold">Ethereum</span>
          </button>
        </div>
        
        {/* QR Code Placeholder */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center">
            <QrCode size={120} className="text-gray-800" />
          </div>
          
          <p className="text-gray-400 text-center">
            Scan this QR code to receive {selectedCurrency}
          </p>
        </div>
        
        {/* Address */}
        <div className="mt-6">
          <label className="block text-white font-medium mb-2">Your {selectedCurrency} Address</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={walletAddress[selectedCurrency]}
              readOnly
              className="flex-1 p-4 bg-gray-700 border border-gray-600 rounded-xl text-white"
            />