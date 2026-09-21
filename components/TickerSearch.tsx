
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Tag, Check, HelpCircle } from 'lucide-react';
import Fuse from 'fuse.js';

export interface Suggestion {
  ticker: string;
  name: string;
  exchange: string;
}

// Local database for instant suggestions
const LOCAL_STOCKS: Suggestion[] = [
  { ticker: '2330.TW', name: '台積電 (TSMC)', exchange: 'TWSE' },
   { ticker: '2884.TW', name: '玉山金', exchange: 'TWSE' },
      { ticker: '2327.TW', name: '國巨*', exchange: 'TWSE' },
      { ticker: '2752.TW', name: '豆府', exchange: 'TWSE' },
   { ticker: '2891.TW', name: '中信金', exchange: 'TWSE' },
  { ticker: '0050.TW', name: '元大台灣50', exchange: 'TWSE' },
  { ticker: '0056.TW', name: '元大高股息', exchange: 'TWSE' },
  { ticker: '00878.TW', name: '國泰永續高股息', exchange: 'TWSE' },
    { ticker: '2241.TW', name: '艾姆勒', exchange: 'TWSE' },
  { ticker: '006208.TW', name: '富邦台灣采吉50', exchange: 'TWSE' },
  { ticker: '00830.TW', name: '國泰費城半導體', exchange: 'TWSE' },
  { ticker: '2317.TW', name: '鴻海 (Foxconn)', exchange: 'TWSE' },
    { ticker: '2402.TPE', name: '毅嘉科技)', exchange: 'TWSE' },
  { ticker: '2412.TW', name: '中華電信', exchange: 'TWSE' },
  { ticker: '2454.TW', name: '聯發科', exchange: 'TWSE' },
  { ticker: '2881.TW', name: '富邦金', exchange: 'TWSE' },
  { ticker: '2882.TW', name: '國泰金', exchange: 'TWSE' },
  { ticker: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', exchange: 'NASDAQ' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ' },
  { ticker: 'META', name: 'Meta Platforms', exchange: 'NASDAQ' },
  { ticker: 'NFLX', name: 'Netflix, Inc.', exchange: 'NASDAQ' },
    { ticker: 'LITE', name: '魯門特姆控股公司', exchange: 'NASDAQ' },
    { ticker: 'COHR', name: 'Coherent Corp', exchange: 'NASDAQ' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  { ticker: 'INTC', name: 'VOO', exchange: 'NASDAQ' },
    { ticker: 'VOO', name: 'Intel Corporation', exchange: 'NASDAQ' },
    { ticker: 'QQQ', name: 'QQQ', exchange: 'NASDAQ' },
  { ticker: '8001.TYO', name: '伊藤忠商事', exchange: 'TYO' },
   { ticker: '6324.TYO', name: 'Harmonic Drive Systems Inc', exchange: 'TYO' },
  { ticker: '8002.TYO', name: '丸紅', exchange: 'TYO' },
  { ticker: '8031.TYO', name: '三井物產', exchange: 'TYO' },
  { ticker: '8058.TYO', name: '三菱商事', exchange: 'TYO' },
    { ticker: '6997.TYO', name: '日本佳美工公司', exchange: 'TYO' },
  { ticker: '8001.TYO', name: '伊藤忠商事', exchange: 'TYO' }
];

interface TickerSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: Suggestion) => void;
  placeholder?: string;
  accentColor?: string;
  customTickers?: { ticker: string; name: string; exchange?: string }[];
}

const TickerSearch: React.FC<TickerSearchProps> = ({ 
  value, 
  onChange, 
  onSelect, 
  placeholder = "Input ticker (e.g. 2330.TW)", 
  accentColor = "blue",
  customTickers = []
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allStocks = useMemo(() => {
    const seen = new Set<string>();
    const combined: Suggestion[] = [];
    
    // Add custom/history tickers first
    customTickers.forEach(c => {
      const key = c.ticker.toUpperCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        combined.push({
          ticker: c.ticker.toUpperCase(),
          name: c.name || '',
          exchange: c.exchange || 'History (已輸入)'
        });
      }
    });
    
    // Add default stocks if not already present
    LOCAL_STOCKS.forEach(stock => {
      const key = stock.ticker.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        combined.push(stock);
      }
    });
    
    return combined;
  }, [customTickers]);

  const fuse = useMemo(() => new Fuse(allStocks, {
    keys: ['ticker', 'name'],
    threshold: 0.4, // Adjust for fuzziness
    distance: 100,
    minMatchCharLength: 1
  }), [allStocks]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (query.length < 1) {
      if (customTickers && customTickers.length > 0) {
        const seen = new Set<string>();
        const filtered: Suggestion[] = [];
        customTickers.forEach(c => {
          const key = c.ticker.toUpperCase();
          if (key && !seen.has(key) && filtered.length < 8) {
            seen.add(key);
            filtered.push({
              ticker: c.ticker.toUpperCase(),
              name: c.name || '',
              exchange: c.exchange || 'History (已輸入)'
            });
          }
        });
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
      return;
    }

    const results = fuse.search(query);
    const filtered = results.map(r => r.item).slice(0, 8);

    setSuggestions(filtered);
    setIsOpen(filtered.length > 0);
  }, [query, fuse, customTickers]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  const selectSuggestion = (e: React.PointerEvent, s: Suggestion) => {
    e.preventDefault();
    e.stopPropagation();
    setQuery(s.ticker);
    onChange(s.ticker);
    if (onSelect) onSelect(s);
    setIsOpen(false);
  };

  const ringClass = accentColor === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-blue-500';

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Tag className="absolute left-3 top-3 text-slate-400" size={18} />
        <input 
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setQuery(val);
            onChange(val);
          }}
          onFocus={() => {
            if (query.length > 0 || (customTickers && customTickers.length > 0)) {
              setIsOpen(true);
            }
          }}
          className={`w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 ${ringClass} outline-none transition-all text-base bg-white shadow-sm font-medium`}
        />
        <div className="absolute right-3 top-3.5">
          <Search size={18} className="text-slate-300" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 z-[100] mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-h-[280px] overflow-y-auto">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onPointerDown={(e) => selectSuggestion(e, s)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-between border-b border-slate-50 last:border-0 cursor-pointer"
              >
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-slate-900 text-sm">{s.ticker}</span>
                  <span className="text-[10px] text-slate-500 truncate">{s.name}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{s.exchange}</span>
                  {value === s.ticker && <Check size={14} className="text-emerald-500 mt-1" />}
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center text-[10px] text-slate-400 italic">
            <HelpCircle size={10} className="mr-1" />
            Can't find? Type your ticker manually.
          </div>
        </div>
      )}
    </div>
  );
};

export default TickerSearch;
