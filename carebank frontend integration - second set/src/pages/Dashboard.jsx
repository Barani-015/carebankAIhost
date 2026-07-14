import { Link } from "react-router-dom";
import { TrendingUp, Wallet, ArrowUpRight, PiggyBank } from "lucide-react";
import Panel from "../components/Panel";
import BarChart from "../components/BarChart";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

function currency(n) {
  const abs = Math.abs(n);
  return `${n < 0 ? "-" : ""}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  console.log("🔷 [DASHBOARD] Component mounted");
  
  const { user, token } = useAuth();
  
  // Use local state for transactions
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);

  const fetchTransactionsManually = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const authToken = localStorage.getItem('token') || localStorage.getItem('authToken');
      
      if (!authToken) {
        console.error('❌ No token found');
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      console.log('📡 Fetching transactions from backend...');
      
      const response = await fetch('https://carebankhost-1.onrender.com/api/transactions', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success) {
        const txns = data.transactions || [];
        console.log(`✅ Loaded ${txns.length} transactions`);
        setTransactions(txns);
        
        // Prepare chart data
        prepareChartData(txns);
      } else {
        setError(data.message || 'Failed to fetch transactions');
        setTransactions([]);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data - handles both credits and debits
  // const prepareChartData = (txns) => {
  //   // For debits (spending)
  //   const spendByCategory = {};
  //   txns
  //     .filter((t) => t.amount < 0)
  //     .forEach((t) => {
  //       const category = t.category || 'Other';
  //       spendByCategory[category] = (spendByCategory[category] || 0) + Math.abs(t.amount);
  //     });
    
  //   // For credits (income)
  //   const incomeByCategory = {};
  //   txns
  //     .filter((t) => t.amount > 0)
  //     .forEach((t) => {
  //       const category = t.category || 'Income';
  //       incomeByCategory[category] = (incomeByCategory[category] || 0) + t.amount;
  //     });
    
  //   // Determine what to show
  //   let chartData = [];
  //   let chartLabel = 'Spending';
    
  //   if (Object.keys(spendByCategory).length > 0) {
  //     // Show spending categories
  //     chartData = Object.entries(spendByCategory)
  //       .sort((a, b) => b[1] - a[1])
  //       .map(([cat, amt]) => ({ 
  //         label: cat, 
  //         value: amt 
  //       }));
  //     chartLabel = 'Spending';
  //   } else if (Object.keys(incomeByCategory).length > 0) {
  //     // Show income categories if no spending
  //     chartData = Object.entries(incomeByCategory)
  //       .sort((a, b) => b[1] - a[1])
  //       .map(([cat, amt]) => ({ 
  //         label: cat, 
  //         value: amt 
  //       }));
  //     chartLabel = 'Income';
  //   }
    
  //   console.log('📊 [DASHBOARD] Chart Data Prepared:', {
  //     spendCategories: Object.keys(spendByCategory).length,
  //     incomeCategories: Object.keys(incomeByCategory).length,
  //     chartLabel: chartLabel,
  //     chartDataLength: chartData.length,
  //     chartData: chartData.slice(0, 3),
  //     totalSpend: Object.values(spendByCategory).reduce((a, b) => a + b, 0),
  //     totalIncome: Object.values(incomeByCategory).reduce((a, b) => a + b, 0)
  //   });
    
  //   setChartData(chartData);
  // };

  // Prepare chart data - handles both credits and debits based on type field
const prepareChartData = (txns) => {
  // For debits (spending) - use type === 'debit'
  const spendByCategory = {};
  txns
    .filter((t) => t.type === 'debit')  // Changed from t.amount < 0
    .forEach((t) => {
      const category = t.category || 'Other';
      spendByCategory[category] = (spendByCategory[category] || 0) + t.amount; // amount is already positive
    });
  
  // For credits (income) - use type === 'credit'
  const incomeByCategory = {};
  txns
    .filter((t) => t.type === 'credit')  // Changed from t.amount > 0
    .forEach((t) => {
      const category = t.category || 'Income';
      incomeByCategory[category] = (incomeByCategory[category] || 0) + t.amount;
    });
  
  // Determine what to show
  let chartData = [];
  let chartLabel = 'Spending';
  
  if (Object.keys(spendByCategory).length > 0) {
    // Show spending categories
    chartData = Object.entries(spendByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ 
        label: cat, 
        value: amt 
      }));
    chartLabel = 'Spending';
  } else if (Object.keys(incomeByCategory).length > 0) {
    // Show income categories if no spending
    chartData = Object.entries(incomeByCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({ 
        label: cat, 
        value: amt 
      }));
    chartLabel = 'Income';
  }
  
  console.log('📊 [DASHBOARD] Chart Data Prepared:', {
    spendCategories: Object.keys(spendByCategory).length,
    incomeCategories: Object.keys(incomeByCategory).length,
    chartLabel: chartLabel,
    chartDataLength: chartData.length,
    chartData: chartData.slice(0, 3),
    totalSpend: Object.values(spendByCategory).reduce((a, b) => a + b, 0),
    totalIncome: Object.values(incomeByCategory).reduce((a, b) => a + b, 0)
  });
  
  setChartData(chartData);
};


  // Fetch on mount
  useEffect(() => {
    fetchTransactionsManually();
  }, []);

  // Calculate metrics
  // const revenue = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  // const spend = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  // const net = revenue + spend;
  // const totalBalance = net;
  // const savingsRate = revenue > 0 ? Math.round((net / revenue) * 100) : 0;

  // Calculate metrics - use type field instead of amount sign
const revenue = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
const spend = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
const net = revenue - spend; // subtract spend since amounts are positive
const totalBalance = net;
const savingsRate = revenue > 0 ? Math.round((net / revenue) * 100) : 0;

  const hasData = transactions.length > 0;

  console.log("🎯 [DASHBOARD] Final Render State:", {
    hasData,
    transactionCount: transactions.length,
    totalBalance: currency(totalBalance),
    revenue: currency(revenue),
    spend: currency(spend),
    savingsRate: `${savingsRate}%`,
    chartDataLength: chartData.length
  });

  if (loading) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mx-auto"></div>
          <p className="text-bone/60 mt-4">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto">
        <Panel className="p-12 text-center" label="Error loading data">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={fetchTransactionsManually}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            Retry
          </button>
        </Panel>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] text-amber-500/70 font-mono uppercase">
          Overview
        </p>
        <h1 className="text-3xl font-light text-bone mt-1">
          Welcome back, {user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator"}
        </h1>
        <p className="text-bone/30 text-sm mt-1">
          {hasData ? `${transactions.length} transactions loaded` : 'No transactions yet'}
        </p>
        <div className="flex gap-4 mt-2 text-xs text-bone/40">
          <span>💰 Income: {currency(revenue)}</span>
          <span>💸 Spending: {currency(Math.abs(spend))}</span>
          <span>📈 Savings: {savingsRate}%</span>
        </div>
      </div>

      {!hasData ? (
        <Panel className="p-12 text-center" label="No data yet">
          <Wallet className="mx-auto mb-4 text-bone/20" size={36} />
          <p className="text-bone/60 mb-1">Your workspace is empty.</p>
          <p className="text-bone/40 text-sm mb-6">
            Import a CSV of transactions to populate this overview.
          </p>
          <Link
            to="/app/import"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-void-950 text-sm font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            Import data <ArrowUpRight size={15} />
          </Link>
        </Panel>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <Panel className="p-5" label="Total balance">
              <p className={`text-3xl font-mono ${totalBalance >= 0 ? "text-bone" : "text-ember-500"}`}>
                {currency(totalBalance)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Wallet className={totalBalance >= 0 ? "text-amber-400" : "text-ember-500"} size={16} />
                <span className="text-xs text-bone/30">Current balance</span>
              </div>
            </Panel>

            <Panel className="p-5" label="Total income">
              <p className="text-3xl font-mono text-bone">{currency(revenue)}</p>
              <div className="flex items-center gap-2 mt-1">
                <TrendingUp className="text-emerald-400" size={16} />
                <span className="text-xs text-bone/30">All time revenue</span>
              </div>
            </Panel>

            <Panel className="p-5" label="Savings rate">
              <div className="flex items-center justify-between">
                <p className={`text-3xl font-mono ${savingsRate >= 0 ? "text-cyan-400" : "text-ember-500"}`}>
                  {savingsRate}%
                </p>
                <PiggyBank className={savingsRate >= 0 ? "text-cyan-400" : "text-ember-500"} size={18} />
              </div>
              <div className="h-1 bg-void-700 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    savingsRate >= 0
                      ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                      : "bg-gradient-to-r from-ember-600 to-ember-500"
                  }`}
                  style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
                />
              </div>
            </Panel>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <Panel className="p-5" label={`${chartData.length > 0 ? 'Spend by category' : 'No spending data'}`}>
              <div className="h-[400px]">
                {chartData.length > 0 ? (
                  <BarChart
                    data={chartData}
                    currencySymbol="$"
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-bone/30">
                    <p className="text-lg mb-2">📊</p>
                    <p>No spending categories to display</p>
                    <p className="text-xs mt-1">All transactions are income (credits)</p>
                  </div>
                )}
              </div>
            </Panel>

            <Panel className="p-5" label={`Recent activity (${transactions.length} total)`}>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {transactions
                  .slice()
                  .reverse()
                  .slice(0, 8)
                  .map((t) => (
                    <div key={t._id || t.id} className="flex items-center justify-between py-2 border-b border-void-700/30 last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-bone/80 truncate">{t.name || t.description || 'Transaction'}</p>
                        <p className="text-[10px] text-bone/30 font-mono">{t.date || 'No date'}</p>
                        <span className="text-[9px] text-bone/20">{t.category || 'Uncategorized'}</span>
                      </div>
                      <span
                        className={`font-mono text-sm shrink-0 ml-3 ${
                          t.amount < 0 ? "text-ember-500" : "text-emerald-400"
                        }`}
                      >
                        {currency(t.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}