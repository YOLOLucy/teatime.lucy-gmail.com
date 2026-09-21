
import React from 'react';
import { Holding, Transaction } from '../types';
import { PieChart, ShieldCheck, TrendingUp, AlertTriangle, Layers, Target } from 'lucide-react';

interface PortfolioAnalyticsProps {
  holdings: Holding[];
  transactions: Transaction[];
}

const PortfolioAnalytics: React.FC<PortfolioAnalyticsProps> = ({ holdings, transactions }) => {
  const totalInvested = holdings.reduce((acc, h) => acc + h.totalInvested, 0);
  const topHolding = holdings.length > 0 ? [...holdings].sort((a,b) => b.totalInvested - a.totalInvested)[0] : null;
  const avgAllocation = holdings.length > 0 ? 100 / holdings.length : 0;
  const maxAllocation = topHolding ? (topHolding.totalInvested / totalInvested) * 100 : 0;

  if (holdings.length === 0) {
    return (
      <div className="bg-slate-50 p-10 rounded-3xl border border-slate-200 border-dashed text-center">
        <PieChart className="mx-auto text-slate-300 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Add transactions to generate portfolio analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center space-x-3 mb-6">
          <Layers className="text-blue-400" size={24} />
          <h2 className="text-2xl font-bold tracking-tight">Portfolio Health Report</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Index 1 */}
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${maxAllocation > 30 ? 'bg-orange-500/20 text-orange-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Concentration Risk</p>
              <p className="text-lg font-bold mt-1">{maxAllocation > 30 ? 'Moderate' : 'Healthy'}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Largest position makes up {maxAllocation.toFixed(1)}% of your total capital.
              </p>
            </div>
          </div>

          {/* Health Index 2 */}
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-start space-x-4">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Efficiency Score</p>
              <p className="text-lg font-bold mt-1">{(100 - maxAllocation + avgAllocation).toFixed(0)} / 100</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Calculated based on balance and asset count ({holdings.length} tickers).
              </p>
            </div>
          </div>

          {/* Health Index 3 */}
          <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-start space-x-4">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Target size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Top Driver</p>
              <p className="text-lg font-bold mt-1">{topHolding?.ticker}</p>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                Currently your primary source of equity exposure and dividends.
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Warning Message */}
        {maxAllocation > 40 && (
          <div className="mt-8 flex items-center space-x-3 bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-orange-200 text-xs">
            <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
            <p>Warning: High concentration in {topHolding?.ticker}. Consider diversifying to reduce specific asset risk.</p>
          </div>
        )}
      </div>

      {/* Simple Data Summary */}
      <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Assets</p>
          <p className="text-xl font-bold text-slate-900">{holdings.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avg. Allocation</p>
          <p className="text-xl font-bold text-slate-900">{avgAllocation.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Max Weight</p>
          <p className="text-xl font-bold text-slate-900">{maxAllocation.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activity</p>
          <p className="text-xl font-bold text-slate-900">{transactions.length} Trades</p>
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;
