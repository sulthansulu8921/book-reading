import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, Search, Sparkles } from "lucide-react";
import api from "../services/api";
import BookCover from "./BookCover";

export default function BookGrid() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const navigate = useNavigate();

    // Backend base URL for static assets
    const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

    const [recentBooks, setRecentBooks] = useState([]);

    useEffect(() => {
        api.get("/books")
            .then(res => {
                setBooks(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch books", err);
                setLoading(false);
            });

        // Fetch recent reading progress
        api.get("/api/books/recent")
            .then(res => setRecentBooks(res.data))
            .catch(err => console.error("Recent books failed", err));
    }, []);

    const handleBookClick = (book) => {
        if (book.isSecret) {
            navigate("/chat");
        } else {
            // If it's a recent book, it has 'lastPage'
            const page = book.lastPage || 0;
            navigate(`/read/${book.id}/${page}`);
        }
    };

    const categories = ["All", "Malayalam", "Classics", "Modern"];
    const filteredBooks = filter === "All" ? books : books.filter(b => b.language === filter || (filter === "Classics" && b.title === "Randaamoozham"));

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0f18]">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                    <Sparkles size={48} className="text-blue-500 blur-[1px]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f18] text-slate-200 selection:bg-blue-500/30">
            {/* Hero Section */}
            <div className="relative overflow-hidden pt-20 pb-12 px-8 md:px-12 lg:px-16 border-b border-white/5">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-600/10 rounded-full blur-[100px] -ml-32 -mb-32" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row items-center justify-between gap-8"
                    >
                        <div className="text-center md:text-left">
                            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4">
                                Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Library</span>
                            </h1>
                            <p className="text-slate-400 max-w-xl text-lg leading-relaxed">
                                Explore timeless Malayalam classics and modern masterpieces in our premium digital collection.
                            </p>
                        </div>

                        <div className="flex bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setFilter(cat)}
                                    className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${filter === cat
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Continue Reading Section (Conditional) */}
            {recentBooks.length > 0 && filter === "All" && (
                <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 pt-16">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                        <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white">Continue Reading</h2>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
                        {recentBooks.map((book) => (
                            <motion.div
                                key={`recent-${book.id}`}
                                onClick={() => handleBookClick(book)}
                                whileHover={{ scale: 1.02 }}
                                className="flex-none w-72 h-44 group cursor-pointer snap-start relative rounded-3xl overflow-hidden bg-[#151b27] border border-white/5 shadow-2xl"
                            >
                                <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity">
                                    <BookCover title={book.title} coverUrl={book.cover} />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-black text-lg truncate mb-2">{book.title}</h3>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full"
                                                style={{ width: `${Math.min(100, (book.lastPage / 49) * 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-400 uppercase">Page {book.lastPage + 1}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Book Grid */}
            <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 py-16">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-1.5 h-6 bg-slate-600/30 rounded-full" />
                    <h2 className="text-xl font-black uppercase tracking-[0.2em] text-white/50">
                        {filter === "All" ? "Explore Masterpieces" : `${filter} Collection`}
                    </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 md:gap-10">
                    <AnimatePresence mode="popLayout">
                        {filteredBooks.map((book, idx) => (
                            <motion.div
                                key={book.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05, duration: 0.4, ease: "easeOut" }}
                                whileHover={{ y: -12 }}
                                onClick={() => handleBookClick(book)}
                                className="group relative"
                            >
                                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-[#151b27] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 group-hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)]">
                                    <BookCover title={book.title} coverUrl={book.cover} />

                                    {/* Glass Overlay on Hover */}
                                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-center z-20">
                                        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 scale-90 group-hover:scale-100 transition-transform duration-500 shadow-xl">
                                            <BookOpen className="text-white" size={24} />
                                        </div>
                                        <span className="mt-4 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                            {book.isSecret ? "Enter Portal" : "Read Now"}
                                        </span>
                                    </div>
                                </div>

                                {/* Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-[22px] blur-xl opacity-0 group-hover:opacity-100 transition duration-700 -z-10" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredBooks.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center p-20 bg-white/2 backdrop-blur-md rounded-[2.5rem] border border-white/5 border-dashed"
                    >
                        <Search size={48} className="text-slate-600 mb-6" />
                        <p className="text-slate-400 text-xl font-medium">No masterpieces found in this category.</p>
                        <button
                            onClick={() => setFilter("All")}
                            className="mt-6 text-blue-400 hover:text-blue-300 font-bold transition-colors"
                        >
                            Reset Filter
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Footer decoration */}
            <div className="max-w-7xl mx-auto px-8 md:px-12 lg:px-16 pb-12 opacity-20">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-500 to-transparent" />
            </div>
        </div>
    );
}
