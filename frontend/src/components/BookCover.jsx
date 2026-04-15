import { motion } from "framer-motion";

export default function BookCover({ title, coverUrl, showTitle = true }) {
    // List of known placeholder substrings or patterns
    const isPlaceholder = !coverUrl ||
        coverUrl === "" ||
        coverUrl.includes("placeholder") ||
        coverUrl.includes("randaamoozham.png") || // repeated
        coverUrl.includes("manju.png") ||
        coverUrl.includes("aarachaar.png") ||
        coverUrl.includes("ente_katha.png") ||
        coverUrl.includes("khasakkinte_itihasam.png") ||
        coverUrl.includes("oru_deshathinte_kadha.png") ||
        coverUrl.includes("oru_sankeerthanam_pole.png") ||
        coverUrl.includes("naalukettu.png") ||
        coverUrl.includes("mathilukal.png");

    // We only use the image if it's NOT a repeated placeholder for a DIFFERENT book.
    // However, the user wants "correct match". 
    // If we have a truly unique cover for this specific book, we show it.
    // Otherwise, we show the professional typographic cover.

    const bookKey = title.toLowerCase().replace(/\s+/g, '_');
    const isActuallyCorrect = coverUrl && (
        coverUrl.includes(bookKey) ||
        // Original 15 that we know have correct covers
        ["Randaamoozham", "Oru Deshathinte Kadha", "Pathummayude Aadu", "Naalukettu", "Balyakalasakhi",
            "Khasakkinte Itihasam", "Aadujeevitham", "Manju", "Premalekhanam", "Oru Sankeerthanam Pole",
            "Ente Katha", "Neermathalam Pootha Kalam", "Aarachaar", "Mathilukal", "Rahasyam - The Secret Diary"
        ].includes(title)
    );

    if (isActuallyCorrect && coverUrl) {
        return (
            <div className="relative w-full h-full overflow-hidden rounded-2xl">
                <img
                    src={`http://127.0.0.1:8000${coverUrl}`}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Malayalam</span>
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg">{title}</h3>
                </div>
            </div>
        );
    }

    // Professional Typographic Cover Fallback
    const gradients = [
        "from-indigo-900 to-slate-900",
        "from-emerald-900 to-neutral-900",
        "from-rose-900 to-stone-900",
        "from-teal-900 to-zinc-900",
        "from-amber-900 to-black"
    ];
    // Hash title to pick a consistent gradient
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[hash % gradients.length];

    return (
        <div className={`relative w-full h-full overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 flex flex-col justify-between border border-white/5`}>
            {/* Texture Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 opacity-40">
                    <div className="w-8 h-px bg-white/50" />
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white">Classic Masterpiece</span>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center text-center">
                    <motion.h3
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-white text-3xl md:text-2xl font-black leading-tight tracking-tighter serif mb-4 drop-shadow-2xl"
                        style={{ fontFamily: "'Noto Serif Malayalam', serif" }}
                    >
                        {title}
                    </motion.h3>
                    <div className="h-0.5 w-12 bg-blue-500/50 rounded-full" />
                </div>

                <div className="mt-8 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400/80 mb-1">Premium Edition</span>
                    <span className="text-[8px] opacity-30 text-white uppercase tracking-widest">Digital Collection</span>
                </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16" />
        </div>
    );
}
