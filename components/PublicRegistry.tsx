import React from 'react';
import Skeleton from './Skeleton';
import { fetchApprovedRegistry } from '../services/sheetService';

const ITEMS_PER_PAGE = 12;

const PublicRegistry = ({ refreshTrigger = 0 }) => {
    const [registry, setRegistry] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);

    React.useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await fetchApprovedRegistry();
            setRegistry(data);
            setLoading(false);
        };
        load();
    }, [refreshTrigger]);

    const filteredRegistry = registry.filter(item => 
        item.nickname.toLowerCase().includes(filter.toLowerCase()) || 
        item.number.toString().includes(filter)
    );

    const totalPages = Math.ceil(filteredRegistry.length / ITEMS_PER_PAGE);
    
    // Reset page if filter changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filter]);

    const paginatedItems = filteredRegistry.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    return (
        <section className="relative py-32 px-4 md:px-0 bg-transparent border-t border-amber-900/20 overflow-hidden min-h-screen">
            
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                
                {/* Header & Search */}
                <div className="flex flex-col items-center justify-center mb-20 text-center space-y-8">
                    <div>
                        <h3 className="text-5xl md:text-7xl font-editorial text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 mb-4 drop-shadow-lg text-gold-shimmer">
                            Números Escolhidos
                        </h3>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-[1px] w-12 bg-amber-500/30"></div>
                            <p className="text-xs text-amber-500/80 uppercase tracking-[0.4em]">RESGATADOS</p>
                            <div className="h-[1px] w-12 bg-amber-500/30"></div>
                        </div>
                    </div>

                    {/* New Minimalist Search HUD */}
                    <div className="relative w-full max-w-md group interactive-hover">
                        <input 
                            type="text" 
                            placeholder="FILTRAR DADOS..." 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full bg-transparent border-b border-white/20 text-white text-center text-sm py-4 font-mono uppercase tracking-[0.2em] placeholder-gray-700 outline-none focus:border-amber-500 transition-colors"
                        />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-amber-500 group-hover:w-full transition-all duration-500"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                    </div>
                </div>

                {/* The Ledger Grid */}
                <div className="min-h-[600px] flex flex-col justify-between">
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                           {[...Array(8)].map((_, i) => (
                               <div key={i} className="h-32 bg-white/5 border border-white/5 rounded-xl p-6 flex flex-col justify-between">
                                   <Skeleton className="h-8 w-1/3" />
                                   <Skeleton className="h-4 w-2/3" />
                               </div>
                           ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {paginatedItems.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="group relative bg-black/40 backdrop-blur-sm border border-white/10 hover:border-amber-500/50 rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(212,175,55,0.15)] animate-in fade-in zoom-in-95 interactive-hover holographic-hover"
                                    style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
                                >
                                    {/* Card Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
                                    
                                    <div className="p-6 relative z-10 flex flex-col gap-4">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 group-hover:bg-amber-500/20 transition-colors">
                                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Ticket</span>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                        </div>

                                        <div className="text-center py-2">
                                            <span className="block text-4xl font-editorial text-white font-bold tracking-tight group-hover:text-gold-shimmer transition-colors">
                                                {item.number.toString().padStart(3, '0')}
                                            </span>
                                        </div>

                                        <div className="border-t border-white/5 pt-4 text-center">
                                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Proprietário</p>
                                            <p className="text-sm font-bold text-gray-300 group-hover:text-white truncate">
                                                {item.nickname}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom Decorative Line */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-900 to-transparent group-hover:via-amber-500 transition-all duration-300"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && filteredRegistry.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">?</span>
                            </div>
                            <p className="text-gray-500 font-editorial text-lg tracking-widest">Nenhum registro encontrado</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8 pb-8">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-white/10 rounded-sm text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all interactive-hover hover:bg-white/5"
                        >
                            Anterior
                        </button>
                        
                        <span className="text-xs font-mono text-amber-500">
                            Página {currentPage} de {totalPages}
                        </span>

                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-white/10 rounded-sm text-xs uppercase tracking-widest text-gray-400 hover:text-white hover:border-amber-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all interactive-hover hover:bg-white/5"
                        >
                            Próximo
                        </button>
                    </div>
                )}

                {/* Footer Stats */}
                <div className="mt-8 flex justify-center">
                    <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/5 rounded-full border border-white/5 backdrop-blur-md hover:border-amber-500/30 transition-colors">
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Bilhetes Emitidos</span>
                            <span className="text-xl font-mono text-white">{registry.length}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-white/10"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-500 uppercase tracking-widest">Disponibilidade</span>
                            <span className="text-xl font-mono text-amber-500">{Math.max(0, 1000 - registry.length)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PublicRegistry;