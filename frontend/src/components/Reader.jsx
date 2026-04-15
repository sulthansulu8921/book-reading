import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function Reader({ title, content, fontSize, darkMode, chapterNum }) {
    // Basic read time calculation (characters / words)
    const wordCount = content?.split(/\s+/).length || 0;
    const readTime = Math.max(1, Math.round(wordCount / 150));

    return (
        <div className="max-w-3xl w-full px-6 md:px-12 py-10 md:py-24 mx-auto">
            <motion.div
                key={chapterNum}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="space-y-8 md:space-y-12"
            >
                {/* Chapter Header */}
                <div className="space-y-4 md:space-y-6 text-center md:text-left">
                    <div className="flex items-center gap-4 justify-center md:justify-start opacity-50">
                        <span className="text-blue-500 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em]">
                            Chapter {chapterNum + 1}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-500" />
                        <div className="flex items-center gap-1.5 text-[8px] md:text-[10px] font-bold uppercase tracking-wider">
                            <Clock size={12} />
                            {readTime} Min Read
                        </div>
                    </div>

                    <h2 className={`text-3xl md:text-6xl font-black tracking-tight leading-tight ${darkMode ? "text-white" : "text-black"
                        }`}>
                        {title}
                    </h2>
                </div>

                {/* Content Area */}
                <article
                    className="leading-[1.8] whitespace-pre-wrap font-serif selection:bg-blue-500/30 transition-all duration-300"
                    style={{
                        fontSize: `${Math.max(14, fontSize * 0.9)}px`, // Slightly smaller on mobile if set large
                        color: darkMode ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)"
                    }}
                >
                    {content}
                </article>

                {/* Footer Tip */}
                <div className="pt-16 md:pt-20 border-t border-white/5 text-center">
                    <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest opacity-20">
                        End of Chapter {chapterNum + 1}
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
