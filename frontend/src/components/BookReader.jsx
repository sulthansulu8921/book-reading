import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, List, Minus, Plus, Moon, Sun, BookOpen } from "lucide-react";
import api from "../services/api";
import Sidebar from "./Sidebar";
import Reader from "./Reader";

export default function BookReader() {
    const { id, pageId } = useParams();
    const navigate = useNavigate();

    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const [fontSize, setFontSize] = useState(18);
    const [currentChapter, setCurrentChapter] = useState(parseInt(pageId) || 0);
    const [progress, setProgress] = useState(0);
    const [chapters, setChapters] = useState([]);

    const contentRef = useRef(null);

    useEffect(() => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(true);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        api.get(`/books/${id}`)
            .then(res => {
                setBook(res.data);
                // Split multi-page content
                const rawContent = res.data.fullStory || "";
                const parts = rawContent.split("--------------------------------------------------");
                const formatted = parts
                    .filter(p => p.trim())
                    .map(p => {
                        const lines = p.trim().split("\n");
                        return {
                            title: lines[0].replace("## ", ""),
                            content: lines.slice(1).join("\n").trim()
                        };
                    });
                setChapters(formatted);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        setCurrentChapter(parseInt(pageId) || 0);
        if (contentRef.current) contentRef.current.scrollTop = 0;
    }, [pageId]);

    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        const scrolled = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setProgress(scrolled);
    };

    const onNavigate = (idx) => {
        setCurrentChapter(idx);
        navigate(`/read/${id}/${idx}`);
        // Save progress to backend
        api.post(`/books/${id}/progress`, { page_index: idx })
            .catch(err => console.error("Save progress failed", err));
    };

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    if (loading) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? "bg-[#0b1220]" : "bg-white"}`}>
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    <BookOpen size={48} className="text-blue-500" />
                </motion.div>
                <p className={`mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40 ${darkMode ? "text-white" : "text-black"}`}>Loading Masterpiece...</p>
            </div>
        );
    }

    if (!book || chapters.length === 0) return <div className="p-20 text-center text-white">Book not found or empty.</div>;

    return (
        <div className={`min-h-screen transition-colors duration-500 overflow-hidden ${darkMode ? "bg-[#0b1220] text-slate-300" : "bg-[#f8f9fa] text-slate-800"}`}>
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[60] bg-white/5">
                <motion.div
                    className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Header */}
            <header className={`fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 md:px-6 border-b backdrop-blur-3xl transition-colors duration-500 ${darkMode ? "bg-black/40 border-white/5" : "bg-white/70 border-slate-200"
                }`}>
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => navigate("/")}
                        className={`p-2 rounded-full transition-all ${darkMode ? "hover:bg-white/5" : "hover:bg-black/5"}`}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col min-w-0">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-blue-500/80 mb-0.5">Premium Library</span>
                        <h2 className="text-[10px] md:text-xs font-black tracking-tight truncate max-w-[120px] md:max-w-md uppercase">
                            {book.title}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-3">
                    {/* Controls */}
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className={`p-2 md:p-2.5 rounded-xl transition-all ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"}`}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <div className={`flex items-center gap-1 p-1 rounded-xl transition-colors ${darkMode ? "bg-white/5" : "bg-black/5"}`}>
                        <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1 hover:opacity-100 opacity-60"><Minus size={14} /></button>
                        <div className="w-6 md:w-8 text-center text-[10px] md:text-[11px] font-black">{fontSize}</div>
                        <button onClick={() => setFontSize(Math.min(36, fontSize + 2))} className="p-1 hover:opacity-100 opacity-60"><Plus size={14} /></button>
                    </div>
                </div>
            </header>

            <div className="flex pt-16 h-[calc(100vh-64px)] overflow-hidden relative">
                <Sidebar
                    pages={chapters}
                    activeId={currentChapter}
                    onNavigate={onNavigate}
                    darkMode={darkMode}
                    isOpen={sidebarOpen}
                    onClose={closeSidebar}
                />

                <main
                    className={`flex-1 overflow-y-auto transition-all duration-500 ${sidebarOpen ? "md:pl-72" : "pl-0"}`}
                    ref={contentRef}
                    onScroll={handleScroll}
                >
                    <Reader
                        title={chapters[currentChapter]?.title}
                        content={chapters[currentChapter]?.content}
                        fontSize={fontSize}
                        darkMode={darkMode}
                        chapterNum={currentChapter}
                    />

                    {/* Navigation Footer */}
                    <div className="max-w-3xl mx-auto px-6 md:px-12 pb-24 flex items-center justify-between gap-4">
                        <button
                            disabled={currentChapter === 0}
                            onClick={() => onNavigate(currentChapter - 1)}
                            className={`flex-1 md:flex-none px-4 md:px-8 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all ${darkMode ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                                } disabled:opacity-20`}
                        >
                            Previous
                        </button>
                        <button
                            disabled={currentChapter === chapters.length - 1}
                            onClick={() => onNavigate(currentChapter + 1)}
                            className="flex-1 md:flex-none px-4 md:px-8 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/30 font-bold text-xs md:text-sm transition-all active:scale-95"
                        >
                            Next Page
                        </button>
                    </div>
                </main>
            </div>

            {/* Sidebar Toggle Float */}
            <button
                onClick={toggleSidebar}
                className={`fixed bottom-6 right-6 md:bottom-8 md:left-8 p-4 rounded-2xl shadow-2xl z-50 transition-all ${darkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-500 text-white"
                    } active:scale-90 md:hidden`}
            >
                <List size={24} />
            </button>
        </div>
    );
}
