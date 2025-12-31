import React from 'react';
import Skeleton from './Skeleton';

const NumberSelector = ({ takenNumbers, selectedNumber, onSelect, loading = false }) => {
  const [rangeIndex, setRangeIndex] = React.useState(0); // 0 = 0-99, 1 = 100-199...
  const [searchTerm, setSearchTerm] = React.useState('');

  // Ranges setup
  const ranges = React.useMemo(() => {
    const r = [];
    for (let i = 0; i < 10; i++) {
      r.push({
        id: i,
        label: `${i}00`, 
        fullLabel: `${i}00 - ${i}99`,
        start: i * 100,
        end: (i * 100) + 99
      });
    }
    return r;
  }, []);

  // Filter logic
  const visibleNumbers = React.useMemo(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.replace(/\D/g, '');
      const results = [];
      for (let i = 0; i < 1000; i++) {
        const numStr = i.toString().padStart(3, '0');
        if (numStr.includes(term)) {
          results.push(i);
        }
      }
      return results;
    } else {
      const currentRange = ranges[rangeIndex];
      const nums = [];
      for (let i = currentRange.start; i <= currentRange.end; i++) {
        nums.push(i);
      }
      return nums;
    }
  }, [rangeIndex, searchTerm, ranges]);

  return (
    <div className="bg-[#050505] border border-white/10 rounded-xl overflow-hidden relative group/container shadow-inner">
      
      {/* Decorative Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      {/* Header & Controls */}
      <div className="p-6 border-b border-white/5 bg-white/[0.02] backdrop-blur-sm relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </div>
                <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Seletor de Matriz</h4>
                    <p className="text-[9px] text-gray-500 font-mono">Total Disponível: {1000 - takenNumbers.size}</p>
                </div>
            </div>

            <div className="relative w-full md:w-48 group/search">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600 group-focus-within/search:text-amber-500 transition-colors">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input 
                    type="text" 
                    placeholder="DIGITE O Nº" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-xs text-white placeholder-gray-700 focus:border-amber-500/50 focus:bg-black outline-none transition-all font-mono tracking-widest shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                />
            </div>
        </div>
      </div>

      {/* Range Navigation (Timeline Style) */}
      {!searchTerm && (
        <div className="bg-black/40 border-b border-white/5 py-3 relative z-10">
            <div className="flex overflow-x-auto custom-scrollbar px-4 gap-2 snap-x">
                {loading ? (
                     <div className="flex gap-2 w-full justify-between">
                         {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-20 h-6 rounded" />)}
                     </div>
                ) : (
                    ranges.map((r, idx) => (
                        <button
                            key={idx}
                            onClick={() => setRangeIndex(idx)}
                            className={`
                                snap-start flex-shrink-0 relative px-4 py-2 text-[10px] font-mono font-bold tracking-widest transition-all rounded duration-300
                                ${rangeIndex === idx ? 'text-black bg-amber-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}
                            `}
                        >
                            {r.fullLabel}
                            {rangeIndex === idx && <div className="absolute top-full left-1/2 -translate-x-1/2 w-1 h-1 bg-amber-500 mt-1 rounded-full"></div>}
                        </button>
                    ))
                )}
            </div>
            {/* Fade Gradients */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-[#050505] to-transparent pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-[#050505] to-transparent pointer-events-none"></div>
        </div>
      )}

      {/* Numbers Grid */}
      <div className="p-4 bg-[#080808] min-h-[300px] relative z-0">
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
                Array.from({ length: 50 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded opacity-20" />
                ))
            ) : (
                <>
                    {visibleNumbers.map(num => {
                        const isTaken = takenNumbers.has(num);
                        const numStr = num.toString().padStart(3, '0');
                        const isSelected = parseInt(selectedNumber) === num;

                        return (
                            <button
                                key={num}
                                disabled={isTaken && !isSelected}
                                onClick={() => onSelect(numStr)}
                                className={`
                                    group relative h-10 rounded text-[10px] font-mono flex items-center justify-center transition-all duration-300 border
                                    ${isSelected 
                                        ? 'bg-amber-500 text-black border-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.5)] z-10 scale-105 font-bold' 
                                        : isTaken 
                                            ? 'bg-[#0f0505] border-red-900/20 text-red-900/30 cursor-not-allowed' 
                                            : 'bg-white/[0.02] border-white/5 text-gray-400 hover:border-amber-500/40 hover:text-white hover:bg-white/5 hover:shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                                    }
                                `}
                            >
                                {/* Content */}
                                <span className="relative z-10">{numStr}</span>

                                {/* Locked Pattern Overlay */}
                                {isTaken && !isSelected && (
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiAvPgo8cGF0aCBkPSJNLTEgMUw1IDdNLTEgNUw1IDExIiBzdHJva2U9IiMzMTAwMDAiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
                                )}
                                
                                {/* Selected Glow Ring */}
                                {isSelected && (
                                    <span className="absolute inset-0 rounded ring-1 ring-white/50 animate-pulse"></span>
                                )}
                            </button>
                        );
                    })}

                    {visibleNumbers.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 opacity-40">
                            <svg className="w-12 h-12 text-gray-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="text-[10px] uppercase tracking-widest text-gray-500">Dados não encontrados</span>
                        </div>
                    )}
                </>
            )}
          </div>
      </div>

      {/* Footer Legend */}
      <div className="px-6 py-4 bg-black border-t border-white/5 flex justify-center gap-6 text-[9px] uppercase tracking-widest text-gray-500">
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/20"></span> Disponível
          </div>
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-900/50 border border-red-900"></span> Ocupado
          </div>
          <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_5px_#f59e0b]"></span> Selecionado
          </div>
      </div>
    </div>
  );
};

export default NumberSelector;