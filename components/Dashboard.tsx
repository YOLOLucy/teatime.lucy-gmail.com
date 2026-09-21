
import React, { useMemo, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Bar,
  Line,
  ComposedChart,
  Legend,
  ReferenceLine
} from 'recharts';
import { Transaction, Dividend, Holding, TransactionType } from '../types';
import { TrendingUp, DollarSign, Activity, BarChart3, Percent, Layers, ExternalLink, Filter } from 'lucide-react';
import PortfolioAnalytics from './AIInsights';

const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#0891b2'];

interface DashboardProps {
  holdings: Holding[];
  transactions: Transaction[];
  dividends: Dividend[];
  selectedYear: string;
  dashboardType: string;
  onTypeChange: (type: string) => void;
}

const StatCard = ({ title, value, subValue, icon: Icon, colorClass, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4 h-full ${onClick ? 'cursor-pointer hover:shadow-md transition-all active:scale-95 group' : ''}`}
  >
    <div className={`p-3 rounded-xl ${colorClass} flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon size={24} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
      <h3 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
        {value}
      </h3>
      {subValue && (
        <p className="text-[11px] font-semibold text-slate-400 mt-1 truncate">
          {subValue}
        </p>
      )}
    </div>
  </div>
);

const getYearFromDate = (dateStr: string) => {
  const match = dateStr.match(/(\d{4})/);
  return match ? match[0] : new Date().getFullYear().toString();
};

const Dashboard: React.FC<DashboardProps> = ({ holdings, transactions, dividends, selectedYear, dashboardType, onTypeChange }) => {
  const [selectedTicker, setSelectedTicker] = useState<string>('All');

  const availableTickers = useMemo(() => {
    const tickerMap = new Map<string, string>();
    
    const yearlyTransactions = selectedYear === 'All' 
      ? transactions 
      : transactions.filter(t => t.date.startsWith(selectedYear));
    
    const yearlyDividends = selectedYear === 'All' 
      ? dividends 
      : dividends.filter(d => d.date.startsWith(selectedYear));

    yearlyTransactions.forEach(t => tickerMap.set(t.ticker, t.name || ''));
    yearlyDividends.forEach(d => tickerMap.set(d.ticker, d.name || ''));
    
    return Array.from(tickerMap.entries())
      .map(([ticker, name]) => ({ ticker, name }))
      .sort((a, b) => a.ticker.localeCompare(b.ticker));
  }, [transactions, dividends, selectedYear]);

  const { yearlyData, currentYearStats, prevYearStats, totalStats, targetYear, comparisonYear } = useMemo(() => {
    const years: Record<string, { dividend: number; capitalGain: number }> = {};
    let allTimeRealizedGain = 0;
    let allTimeDividends = 0;
    
    transactions.forEach(t => {
      const yr = getYearFromDate(t.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
    });
    dividends.forEach(d => {
      const yr = getYearFromDate(d.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
    });

    const availableYears = Object.keys(years).sort();
    const currentYear = new Date().getFullYear().toString();
    const targetYear = selectedYear === 'All' ? currentYear : selectedYear;
    const comparisonYear = (parseInt(targetYear) - 1).toString();

    const sortedTx = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.type === TransactionType.BUY ? -1 : 1;
    });

    const costBasisMap: Record<string, { qty: number; totalCost: number }> = {};
    sortedTx.forEach(t => {
      const yr = getYearFromDate(t.date);
      const rate = t.rate || 1;
      if (t.type === TransactionType.BUY) {
        if (!costBasisMap[t.ticker]) costBasisMap[t.ticker] = { qty: 0, totalCost: 0 };
        costBasisMap[t.ticker].qty += t.quantity;
        costBasisMap[t.ticker].totalCost += (t.quantity * t.price * rate + t.fees);
      } else if (t.type === TransactionType.SELL) {
        if (costBasisMap[t.ticker] && costBasisMap[t.ticker].qty > 0) {
          const avgPrice = costBasisMap[t.ticker].totalCost / costBasisMap[t.ticker].qty;
          const actualSoldQty = Math.min(t.quantity, costBasisMap[t.ticker].qty);
          const netProceeds = (t.price * rate * actualSoldQty) - (t.fees * (actualSoldQty / t.quantity));
          const gain = netProceeds - (avgPrice * actualSoldQty);
          
          if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
          years[yr].capitalGain += gain;
          allTimeRealizedGain += gain;
          
          costBasisMap[t.ticker].qty -= actualSoldQty;
          costBasisMap[t.ticker].totalCost = costBasisMap[t.ticker].qty * avgPrice;
        }
      }
    });

    dividends.forEach(d => {
      const yr = getYearFromDate(d.date);
      if (!years[yr]) years[yr] = { dividend: 0, capitalGain: 0 };
      years[yr].dividend += d.amount;
      allTimeDividends += d.amount;
    });

    let runningTotalProfit = 0;
    const sortedYearsList = Object.keys(years).sort();
    const yearlyDataArray = sortedYearsList.map(yr => {
      runningTotalProfit += (years[yr].dividend + years[yr].capitalGain);
      return {
        year: yr,
        dividend: years[yr].dividend,
        capitalGain: years[yr].capitalGain,
        cumulativeProfit: runningTotalProfit
      };
    });

    return { 
      yearlyData: yearlyDataArray,
      currentYearStats: years[targetYear] || { dividend: 0, capitalGain: 0 },
      prevYearStats: years[comparisonYear] || { dividend: 0, capitalGain: 0 },
      totalStats: { dividend: allTimeDividends, capitalGain: allTimeRealizedGain },
      targetYear,
      comparisonYear
    };
  }, [dividends, transactions, selectedYear]);

  const divGrowth = prevYearStats.dividend > 0 
    ? ((currentYearStats.dividend - prevYearStats.dividend) / prevYearStats.dividend * 100) 
    : 0;
  
  const isTargetCurrentYear = targetYear === new Date().getFullYear().toString();
  const divisor = isTargetCurrentYear ? (new Date().getMonth() + 1) : 12;
  const monthlyAvgCombined = (currentYearStats.dividend + currentYearStats.capitalGain) / divisor;

  const allocationData = useMemo(() => {
    return holdings.map(h => ({
      name: h.ticker,
      value: h.totalInvested
    })).sort((a, b) => b.value - a.value);
  }, [holdings]);

  const sellRecordsWithGain = useMemo(() => {
    const sortedTx = [...transactions].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.type === TransactionType.BUY ? -1 : 1;
    });

    const costBasisMap: Record<string, { qty: number; totalCost: number }> = {};
    const sellRecords: any[] = [];

    sortedTx.forEach(t => {
      const rate = t.rate || 1;
      if (t.type === TransactionType.BUY) {
        if (!costBasisMap[t.ticker]) costBasisMap[t.ticker] = { qty: 0, totalCost: 0 };
        costBasisMap[t.ticker].qty += t.quantity;
        costBasisMap[t.ticker].totalCost += (t.quantity * t.price * rate + t.fees);
      } else if (t.type === TransactionType.SELL) {
        let gain = 0;
        if (costBasisMap[t.ticker] && costBasisMap[t.ticker].qty > 0) {
          const avgPrice = costBasisMap[t.ticker].totalCost / costBasisMap[t.ticker].qty;
          const actualSoldQty = Math.min(t.quantity, costBasisMap[t.ticker].qty);
          const netProceeds = (t.price * rate * actualSoldQty) - (t.fees * (actualSoldQty / t.quantity));
          gain = netProceeds - (avgPrice * actualSoldQty);
          
          costBasisMap[t.ticker].qty -= actualSoldQty;
          costBasisMap[t.ticker].totalCost = costBasisMap[t.ticker].qty * avgPrice;
        }
        
        sellRecords.push({
          ...t,
          gain: gain
        });
      }
    });

    return sellRecords;
  }, [transactions]);

  const filteredTransactionsDetail = useMemo(() => {
    let result = sellRecordsWithGain;
    if (selectedYear !== 'All') {
      result = result.filter(t => t.date.startsWith(selectedYear));
    }
    if (selectedTicker !== 'All') {
      result = result.filter(t => t.ticker === selectedTicker);
    }
    return result;
  }, [sellRecordsWithGain, selectedYear, selectedTicker]);

  const filteredDividendsDetail = useMemo(() => {
    let result = dividends;
    if (selectedYear !== 'All') {
      result = result.filter(d => d.date.startsWith(selectedYear));
    }
    if (selectedTicker !== 'All') {
      result = result.filter(d => d.ticker === selectedTicker);
    }
    return result;
  }, [dividends, selectedYear, selectedTicker]);

  const totalFilteredDividends = useMemo(() => {
    return filteredDividendsDetail.reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDividendsDetail]);

  const totalFilteredGains = useMemo(() => {
    return filteredTransactionsDetail.reduce((sum, t) => sum + (t.gain || 0), 0);
  }, [filteredTransactionsDetail]);

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Dividend Growth" 
          value={`${divGrowth >= 0 ? '+' : ''}${divGrowth.toFixed(1)}%`}
          subValue={`YoY vs ${comparisonYear}`}
          icon={Percent}
          colorClass="bg-blue-50 text-blue-600"
        />
        
        <StatCard 
          title={`${targetYear} Dividends`} 
          value={`$${currentYearStats.dividend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subValue={`Previous: $${prevYearStats.dividend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="bg-emerald-50 text-emerald-600"
          onClick={() => onTypeChange('Dividends')}
        />

        <StatCard 
          title={`${targetYear} Realized Gains`} 
          value={`$${currentYearStats.capitalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subValue={`Previous: $${prevYearStats.capitalGain.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          colorClass={currentYearStats.capitalGain >= 0 ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"}
          onClick={() => onTypeChange('Transactions')}
        />

        <StatCard 
          title="Monthly Average" 
          value={`$${monthlyAvgCombined.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subValue={`${targetYear} Avg (D+G)`}
          icon={BarChart3}
          colorClass="bg-purple-50 text-purple-600"
        />
      </div>

      {dashboardType === 'Overall' ? (
        <>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Portfolio Growth Evolution</h3>
                <p className="text-sm text-slate-500">Track your annual success map</p>
              </div>
            </div>
            <div className="h-[400px] w-full">
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                      formatter={(val: number) => [`$${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, '']}
                    />
                    <Legend verticalAlign="top" height={40} iconType="circle" />
                    <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    <Bar name="Annual Realized Gain" dataKey="capitalGain" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                    <Bar name="Annual Dividends" dataKey="dividend" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    <Line name="Cumulative Wealth" type="monotone" dataKey="cumulativeProfit" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#7c3aed', strokeWidth: 2, stroke: '#fff' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 italic">
                   <Activity size={48} className="mb-4 opacity-20" />
                   <p>Provide data to see your growth evolution.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2 mb-6">
                <Layers className="text-blue-500" size={20} />
                <h3 className="text-lg font-bold text-slate-800">Asset Allocation</h3>
              </div>
              <div className="h-[350px] w-full">
                {allocationData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={allocationData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value">
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         formatter={(value: number) => `$${value.toLocaleString()}`}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 italic">
                    No active inventory to display distribution.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 分析區塊：現在改為純本地數學分析，不需要 API */}
          <div className="mt-8">
            <PortfolioAnalytics holdings={holdings} transactions={transactions} />
          </div>
        </>
      ) : dashboardType === 'Dividends' ? (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800">Dividend Details ({selectedYear})</h3>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Filter size={14} className="text-slate-400 mr-2" />
              <select 
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none min-w-[80px]"
              >
                <option value="All">All Tickers</option>
                {availableTickers.map(t => (
                  <option key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticker</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDividendsDetail.length > 0 && (
                  <tr className="bg-emerald-50/30 font-bold border-b-2 border-emerald-100">
                    <td className="px-6 py-4 text-emerald-800 text-sm">TOTAL</td>
                    <td className="px-6 py-4 text-emerald-800 text-sm">Summary</td>
                    <td className="px-6 py-4 text-emerald-600 font-black text-lg">
                      ${totalFilteredDividends.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {filteredDividendsDetail.length > 0 ? (
                  filteredDividendsDetail.sort((a,b) => b.date.localeCompare(a.date)).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 text-sm">{d.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{d.ticker}</span>
                          <span className="text-[10px] text-slate-400">{d.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-600">${d.amount.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">No records for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-slate-800">Transaction Details ({selectedYear})</h3>
            <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Filter size={14} className="text-slate-400 mr-2" />
              <select 
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer appearance-none min-w-[80px]"
              >
                <option value="All">All Tickers</option>
                {availableTickers.map(t => (
                  <option key={t.ticker} value={t.ticker}>{t.ticker} - {t.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ticker</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Value</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Gain / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactionsDetail.length > 0 && (
                  <tr className="bg-blue-50/30 font-bold border-b-2 border-blue-100">
                    <td className="px-6 py-4 text-blue-800 text-sm">TOTAL</td>
                    <td className="px-6 py-4 text-blue-800 text-sm">Summary</td>
                    <td className="px-6 py-4 text-blue-800 text-sm">-</td>
                    <td className="px-6 py-4 text-blue-800 text-sm">-</td>
                    <td className={`px-6 py-4 text-right font-black text-lg ${totalFilteredGains >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      ${totalFilteredGains.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                )}
                {filteredTransactionsDetail.length > 0 ? (
                  filteredTransactionsDetail.sort((a,b) => b.date.localeCompare(a.date)).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">{t.date}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{t.ticker}</span>
                          <span className="text-[10px] text-slate-400">{t.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600">
                          SELL
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        ${(t.quantity * t.price * (t.rate || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${t.gain >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.gain >= 0 ? '+' : ''}${t.gain.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No records for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
