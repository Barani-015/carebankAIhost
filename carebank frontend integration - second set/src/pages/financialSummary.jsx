// pages/SmartBudgeting.jsx
import { useState } from "react";
import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import { TrendingDown, TrendingUp, AlertCircle, CheckCircle, Target, Calendar } from "lucide-react";

function currency(n) {
  const abs = Math.abs(n);
  return `${n < 0 ? "-" : ""}$${abs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function SmartBudgeting() {
  const { transactions } = useData();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [budgetPeriod, setBudgetPeriod] = useState("monthly");

  // Calculate spending by category
  const byCategory = {};
  transactions
    .filter((t) => t.amount < 0)
    .forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Math.abs(t.amount);
    });
  
  const categories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const totalSpend = categories.reduce((sum, [_, amt]) => sum + amt, 0);

  // Calculate monthly average (assuming daily data for simplicity)
  const avgMonthlySpend = totalSpend / (transactions.length > 0 ? Math.max(1, Math.round(transactions.length / 30)) : 1);

  // Budget recommendations based on spending patterns
  const getBudgetRecommendations = () => {
    const recommendations = [];
    categories.forEach(([cat, amt]) => {
      const percentage = (amt / totalSpend) * 100;
      if (percentage > 30) {
        recommendations.push({
          category: cat,
          amount: amt,
          percentage: Math.round(percentage),
          suggestion: `High spending in ${cat} (${Math.round(percentage)}%). Consider setting a monthly budget of ${currency(amt * 0.8)} to save 20%.`,
          severity: "warning"
        });
      } else if (percentage < 5 && amt > 0) {
        recommendations.push({
          category: cat,
          amount: amt,
          percentage: Math.round(percentage),
          suggestion: `Low spending in ${cat} (${Math.round(percentage)}%). You could increase allocation here if needed.`,
          severity: "info"
        });
      }
    });
    return recommendations;
  };

  const recommendations = getBudgetRecommendations();

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[11px] tracking-[0.3em] text-amber-500/70 font-mono uppercase">
          Financial Summary
        </p>
        <h1 className="text-3xl font-light text-bone mt-1">
          Summary of your financial health and spending patterns
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Panel className="p-5" label="Total Monthly Spend">
          <p className="text-3xl font-mono text-bone">{currency(avgMonthlySpend)}</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingDown className="text-amber-400" size={16} />
            <span className="text-xs text-bone/30">Average per month</span>
          </div>
        </Panel>

        <Panel className="p-5" label="Total Categories">
          <p className="text-3xl font-mono text-bone">{categories.length}</p>
          <div className="flex items-center gap-2 mt-1">
            <Target className="text-cyan-400" size={16} />
            <span className="text-xs text-bone/30">Active spending areas</span>
          </div>
        </Panel>

        <Panel className="p-5" label="Top Category">
          <p className="text-3xl font-mono text-bone">
            {categories.length > 0 ? categories[0][0] : "N/A"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {categories.length > 0 && (
              <span className="text-xs text-bone/30">
                {currency(categories[0][1])} ({Math.round((categories[0][1] / totalSpend) * 100)}%)
              </span>
            )}
          </div>
        </Panel>

        <Panel className="p-5" label="Budget Health">
          <div className="flex items-center justify-between">
            <p className={`text-3xl font-mono ${recommendations.filter(r => r.severity === "warning").length === 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {recommendations.filter(r => r.severity === "warning").length === 0 ? "Good" : "Needs Review"}
            </p>
            {recommendations.filter(r => r.severity === "warning").length === 0 ? (
              <CheckCircle className="text-emerald-400" size={18} />
            ) : (
              <AlertCircle className="text-amber-400" size={18} />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-bone/30">
              {recommendations.filter(r => r.severity === "warning").length} areas need attention
            </span>
          </div>
        </Panel>
      </div>

      {/* Budget Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-mono text-amber-500/80 mb-3">Financial Recommendations</h2>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border ${
                  rec.severity === "warning" 
                    ? "bg-amber-500/5 border-amber-500/20" 
                    : "bg-cyan-500/5 border-cyan-500/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-bone/80">{rec.category}</p>
                    <p className="text-xs text-bone/40 mt-1">{rec.suggestion}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-bone/60">{currency(rec.amount)}</p>
                    <p className="text-xs text-bone/30">{rec.percentage}% of total</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <Panel className="p-5" label="Category Breakdown">
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {categories.map(([cat, amt]) => {
            const percentage = (amt / totalSpend) * 100;
            const isHigh = percentage > 30;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-bone/80">{cat}</span>
                  <span className="text-sm font-mono text-bone/60">
                    {currency(amt)} ({Math.round(percentage)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-void-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isHigh 
                        ? "bg-gradient-to-r from-amber-500 to-amber-400" 
                        : "bg-gradient-to-r from-cyan-500 to-cyan-400"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
          {categories.length === 0 && (
            <p className="text-center text-bone/30 text-sm py-8">No spending data available</p>
          )}
        </div>
      </Panel>
    </div>
  );
}