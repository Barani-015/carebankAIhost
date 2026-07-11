import { Link } from "react-router-dom";
import { TrendingUp, Wallet, ArrowUpRight, PiggyBank } from "lucide-react";
import Panel from "../components/Panel";
import BarChart from "../components/BarChart";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function currency(n) {
  const abs = Math.abs(n);
  return `${n < 0 ? "-" : ""}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const { transactions } = useData();
  const { user } = useAuth();

  const [rightPanelOpen, setRightPanelOpen] = useState(false);
const [rightPanelContent, setRightPanelContent] = useState("");

  const revenue = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const spend = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
  const net = revenue + spend;
  const totalBalance = net;
  const savingsRate = revenue > 0 ? Math.round((net / revenue) * 100) : 0;

  const byCategory = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
    });
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  const hasData = transactions.length > 0;

return (
  <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto">
    {/* Header - Optimized */}
    <div className="mb-8">
      <p className="text-[11px] tracking-[0.3em] text-amber-500/70 font-mono uppercase">
        Overview
      </p>
      <h1 className="text-3xl font-light text-bone mt-1">
        Welcome back, {user?.name?.split(" ")[0] || "Operator"}
      </h1>
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
        {/* Stats Cards - Optimized grid */}
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

        {/* Charts Row - Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <Panel className="p-5" label="Spend by category">
            <div className="h-[400px]">
              <BarChart
                data={categories.map(([cat, amt]) => ({ label: cat, value: amt }))}
                currencySymbol="$"
              />
            </div>
          </Panel>

          <Panel className="p-5" label="Recent activity">
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {transactions
                .slice()
                .reverse()
                .slice(0, 8)
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-void-700/30 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-bone/80 truncate">{t.description}</p>
                      <p className="text-[10px] text-bone/30 font-mono">{t.date}</p>
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
              {transactions.length === 0 && (
                <p className="text-center text-bone/30 text-sm py-8">No recent transactions</p>
              )}
            </div>
          </Panel>
        </div>
      </>
    )}
  </div>
);

}