import { motion } from "framer-motion";
import { List, CheckCircle2, X } from "lucide-react";

export default function Sidebar({ pages, activeId, onNavigate, darkMode, isOpen, onClose }) {
    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            <aside className={`fixed inset-y-0 left-0 pt-16 w-72 z-50 border-r backdrop-blur-2xl transition-transform duration-500 ease-in-out ${darkMode ? "bg-black/40 border-white/5" : "bg-white/70 border-slate-200"
                } ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

                {/* Mobile Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full md:hidden hover:bg-white/10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 h-full overflow-y-auto">
                    <div className="flex items-center gap-2 mb-8 opacity-50 uppercase tracking-widest text-[10px] font-bold">
                        <List size={14} />
                        <span>Table of Contents</span>
                    </div>
                    <nav className="space-y-1.5">
                        {pages.map((page, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    onNavigate(idx);
                                    if (window.innerWidth < 768) onClose();
                                }}
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
        </>
    );
}
