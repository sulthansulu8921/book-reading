import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PdfViewer() {
    const location = useLocation();
    const navigate = useNavigate();
    const pdfUrl = location.state?.pdfUrl;

    if (!pdfUrl) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <p className="text-xl text-slate-400 mb-4">Book file is corrupted or missing.</p>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 bg-dark-700 hover:bg-dark-600 px-4 py-2 rounded-lg text-slate-200 transition-colors"
                >
                    <ArrowLeft size={18} /> Return to Library
                </button>
            </div>
        );
    }

    const backendPdfUrl = `http://localhost:8000${pdfUrl}`;

    return (
        <div className="h-screen w-full flex flex-col bg-[#525659]">
            <div className="flex-1 w-full relative">
                <iframe
                    src={`${backendPdfUrl}#view=FitH`}
                    className="w-full h-full border-none"
                    title="PDF Viewer"
                />
            </div>

            <button
                onClick={() => navigate("/")}
                className="fixed top-4 left-4 z-50 p-3 bg-dark-800/80 hover:bg-dark-700 backdrop-blur-md rounded-full shadow-xl transition-all border border-slate-700/50 text-slate-200 group flex items-center justify-center"
                title="Back to Library"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
        </div>
    );
}
