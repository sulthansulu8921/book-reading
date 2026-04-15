import { motion } from "framer-motion";
import { List, CheckCircle2 } from "lucide-react";

export default function Sidebar({ pages, activeId, onNavigate, darkMode }) {
    return (
        <aside className={`fixed inset-y-0 left-0 pt-16 w-72 z-40 border-r backdrop-blur-2xl transition-colors duration-500 ${darkMode ? "bg-black/40 border-white/5" : "bg-white/70 border-slate-200"
            }`}>
            <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-8 opacity-50 uppercase tracking-widest text-[10px] font-bold">
                    <List size={14} />
                    <span>Table of Contents</span>
                </div>
                <nav className="space-y-1.5">
                    {pages.map((page, idx) => (
                        <button
                            key={idx}
                            onClick={() => onNavigate(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 group flex items-center justify-between ${activeId === idx
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                    : (darkMode ? "hover:bg-white/5 text-slate-400 hover:text-white" : "hover:bg-black/5 text-slate-600 hover:text-black")
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-mono opacity-50 ${activeId === idx ? "text-white" : ""}`}>
                                    {(idx + 1).toString().padStart(2, '0')}
                                </span>
                                <span className="font-medium truncate max-w-[140px]">{page.title}</span>
                            </div>
                            {activeId === idx && (
                                <motion.div layoutId="activeDot">
                                    <CheckCircle2 size={14} className="text-white/80" />
                                </motion.div>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
