
import React from 'react';
import { Holding } from '../types';
import { ExternalLink, DollarSign, Calculator } from 'lucide-react';

interface PortfolioProps {
  holdings: Holding[];
  onUpdateEstimate: (ticker: string, value: number) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ holdings, onUpdateEstimate }) => {
  const totalEstimatedAnnualIncome = holdings.reduce((acc, h) => acc + (h.estimatedTotalDividend || 0), 0);

  return (
    <div className="space-y-6">
      {/* Projection Summary Card */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-100 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-emerald-50 opacity-90 text-sm font-medium">Estimated Annual Passive Income</p>
          <h3 className="text-3xl font-bold">${totalEstimatedAnnualIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
        </div>
        <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
           <Calculator size={32} />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Ticker</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Shares</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Total Value</th>
                <th className="px-6 py-5 text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50/30">Est. Div/Share</th>
                <th className="px-6 py-5 text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/50">Est. Total Div</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {holdings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No holdings found. Start by adding a transaction.
                  </td>
                </tr>
              ) : (
                holdings.map((h) => {
                  const totalInvested = holdings.reduce((acc, curr) => acc + curr.totalInvested, 0);
                  const allocation = (h.totalInvested / totalInvested) * 100;
                  
                  return (
                    <tr key={h.ticker} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                            {h.ticker[0]}
                          </div>
                          <a 
                            href={`https://finance.yahoo.com/quote/${h.ticker}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 transition-all"
                            title="View on Yahoo Finance"
                          >
                            <span>{h.ticker}</span>
                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-40" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-sm font-medium">
                        <div className="truncate max-w-[120px]">{h.name}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{h.quantity.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900">${h.totalInvested.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4 bg-emerald-50/20">
                        <div className="relative flex items-center">
                          <DollarSign size={14} className="absolute left-2 text-emerald-400" />
                          <input 
                            type="number" 
                            step="any"
                            value={h.estimatedDividendPerShare || ''}
                            onChange={(e) => onUpdateEstimate(h.ticker, parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-24 pl-6 pr-2 py-1 bg-white border border-emerald-100 rounded-lg text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 bg-emerald-50/40">
                        <span className="font-bold text-emerald-700">
                          ${(h.estimatedTotalDividend || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-slate-500 mb-1">{allocation.toFixed(1)}%</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full" 
                              style={{ width: `${allocation}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-start space-x-4">
        <DollarSign className="text-blue-500 mt-1" size={20} />
        <div>
          <h4 className="font-bold text-slate-800">Pro-Tip: Setting Estimates</h4>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">
            Enter the <strong>expected annual dividend per share</strong> for each stock. This allows the system to project your annual passive income based on your current inventory. 
          </p>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
