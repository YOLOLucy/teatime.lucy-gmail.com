
import React, { useRef, useState } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, PiggyBank } from 'lucide-react';
import { Transaction, Dividend, TransactionType } from '../types';

interface DataManagementProps {
  transactions: Transaction[];
  dividends: Dividend[];
  onImportTransactions: (ts: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  onImportDividends: (ds: Dividend[] | ((prev: Dividend[]) => Dividend[])) => void;
  onResetAll: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  transactions, 
  dividends, 
  onImportTransactions, 
  onImportDividends,
  onResetAll
}) => {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const transactionInputRef = useRef<HTMLInputElement>(null);
  const dividendInputRef = useRef<HTMLInputElement>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    // Scroll to top so user sees the message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setMessage(null), 3000);
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTransactions = () => {
    const headers = ['id', 'date', 'ticker', 'name', 'type', 'quantity', 'price', 'fees', 'rate'];
    const rows = transactions.map(t => [
      t.id, t.date, t.ticker, t.name, t.type, t.quantity, t.price, t.fees, t.rate || 1
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCSV(csvContent, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('交易紀錄匯出成功', 'success');
  };

  const exportDividends = () => {
    const headers = ['id', 'date', 'ticker', 'name', 'amount', 'rate', 'rawAmount'];
    const rows = dividends.map(d => [
      d.id, d.date, d.ticker, d.name, d.amount, d.rate || 1, d.rawAmount ?? d.amount
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadCSV(csvContent, `dividends_${new Date().toISOString().split('T')[0]}.csv`);
    showMessage('股息紀錄匯出成功', 'success');
  };

  const handleImportTransactions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const imported: Transaction[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          return {
            id: parts[0] || Date.now().toString() + Math.random(),
            date: parts[1],
            ticker: parts[2],
            name: parts[3],
            type: parts[4] as TransactionType,
            quantity: parseFloat(parts[5]),
            price: parseFloat(parts[6]),
            fees: parseFloat(parts[7] || '0'),
            rate: parts[8] ? parseFloat(parts[8]) : 1
          };
        });
        onImportTransactions((prev) => [...prev, ...imported]);
        showMessage(`成功匯入 ${imported.length} 筆交易!`, 'success');
      } catch (err) {
        showMessage('匯入失敗，請檢查 CSV 格式。', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImportDividends = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        const imported: Dividend[] = lines.slice(1).map(line => {
          const parts = line.split(',');
          const rateVal = parts[5] ? parseFloat(parts[5]) : 1;
          const rawAmountVal = parts[6] ? parseFloat(parts[6]) : parseFloat(parts[4]);
          return {
            id: parts[0] || Date.now().toString() + Math.random(),
            date: parts[1],
            ticker: parts[2],
            name: parts[3],
            amount: parseFloat(parts[4]),
            rate: rateVal,
            rawAmount: rawAmountVal
          };
        });
        onImportDividends((prev) => [...prev, ...imported]);
        showMessage(`成功匯入 ${imported.length} 筆股息資料!`, 'success');
      } catch (err) {
        showMessage('匯入失敗，請檢查 CSV 格式。', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-20">
      {message && (
        <div className={`fixed top-20 right-8 z-50 flex items-center space-x-2 px-6 py-4 rounded-2xl shadow-lg border animate-in slide-in-from-right-8 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Transactions Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">交易數據管理</h3>
              <p className="text-sm text-slate-500">目前共有 {transactions.length} 筆紀錄</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={exportTransactions}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all group"
            >
              <div className="flex items-center space-x-3 text-slate-700 font-semibold">
                <Download size={20} className="text-blue-500" />
                <span>匯出 CSV 檔案</span>
              </div>
            </button>

            <div className="py-1 text-center">
              <p className="text-sm font-bold text-blue-600">匯入之前,要對數據管理資料清空</p>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportTransactions} 
                ref={transactionInputRef} 
                className="hidden" 
              />
              <button 
                onClick={() => transactionInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white transition-all shadow-lg shadow-blue-100"
              >
                <div className="flex items-center space-x-3 font-semibold">
                  <Upload size={20} />
                  <span>匯入 CSV 檔案</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Dividends Card */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <PiggyBank size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">股息數據管理</h3>
              <p className="text-sm text-slate-500">目前共有 {dividends.length} 筆紀錄</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={exportDividends}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 transition-all group"
            >
              <div className="flex items-center space-x-3 text-slate-700 font-semibold">
                <Download size={20} className="text-emerald-500" />
                <span>匯出 CSV 檔案</span>
              </div>
            </button>

            <div className="py-1 text-center">
              <p className="text-sm font-bold text-emerald-600">匯入之前,要對數據管理資料清空</p>
            </div>

            <div className="relative">
              <input 
                type="file" 
                accept=".csv" 
                onChange={handleImportDividends} 
                ref={dividendInputRef} 
                className="hidden" 
              />
              <button 
                onClick={() => dividendInputRef.current?.click()}
                className="w-full flex items-center justify-between p-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-white transition-all shadow-lg shadow-emerald-100"
              >
                <div className="flex items-center space-x-3 font-semibold">
                  <Upload size={20} />
                  <span>匯入 CSV 檔案</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataManagement;
