import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, Mic, LogOut, ChevronLeft, MicOff, Edit2, Trash2, X } from "lucide-react";
import api from "../services/api";

export default function SecretChat() {
    const [users, setUsers] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [msgText, setMsgText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [editingMsg, setEditingMsg] = useState(null);
    const [currentUser, setCurrentUser] = useState({ id: parseInt(localStorage.getItem("user_id")) });

    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }

        fetchUsers();

        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
        const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
        const wsHost = backendUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");

        ws.current = new WebSocket(`${wsProtocol}://${wsHost}/ws/${token}`);

        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "chat") {
                const incomingMsg = data.message;
                setMessages((prev) => [...prev, incomingMsg]);
            } else if (data.type === "chat_edit") {
                setMessages((prev) => prev.map(m => m.id === data.message_id ? { ...m, ...data } : m));
            } else if (data.type === "chat_delete") {
                setMessages((prev) => prev.filter(m => m.id !== data.message_id));
            } else if (data.type === "status") {
                fetchUsers();
            }
        };

        return () => {
            ws.current?.close();
        };
    }, [token, navigate]);

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users");
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users", err);
        }
    };

    const loadConversation = async (user) => {
        setActiveChat(user);
        setEditingMsg(null);
        setMsgText("");
        try {
            const res = await api.get(`/messages/${user.id}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChat]);

    const sendMessage = async () => {
        if (!msgText.trim() || !activeChat) return;

        if (editingMsg) {
            ws.current.send(JSON.stringify({
                action: "edit",
                message_id: editingMsg.id,
                recipient_id: activeChat.id,
                text: msgText
            }));
            setEditingMsg(null);
        } else {
            ws.current.send(JSON.stringify({
                action: "send",
                recipient_id: activeChat.id,
                text: msgText
            }));
        }

        setMsgText("");
    };

    const deleteMessage = (msgId) => {
        if (!activeChat) return;
        ws.current.send(JSON.stringify({
            action: "delete",
            message_id: msgId,
            recipient_id: activeChat.id
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeChat) return;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("file_type", "image");

        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            ws.current.send(JSON.stringify({
                action: "send",
                recipient_id: activeChat.id,
                image_url: res.data.url
            }));
        } catch (err) {
            console.error(err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            audioChunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.current.push(e.data);
            };

            mediaRecorder.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });

                const formData = new FormData();
                formData.append("file", new File([audioBlob], "voice.webm", { type: 'audio/webm' }));
                formData.append("file_type", "audio");

                try {
                    const res = await api.post("/upload", formData);
                    ws.current.send(JSON.stringify({
                        action: "send",
                        recipient_id: activeChat.id,
                        audio_url: res.data.url
                    }));
                } catch (err) {
                    console.error(err);
                }
            };

            mediaRecorder.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Microphone permission denied", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop();
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user_id");
        navigate("/");
    };

    const displayedMessages = messages.filter(
        (m) => (m.sender_id === currentUser.id && m.recipient_id === activeChat?.id) ||
            (m.sender_id === activeChat?.id && m.recipient_id === currentUser.id) ||
            (m.sender_id === activeChat?.id || m.sender_id === currentUser.id)
    );

    return (
        <div className="h-screen bg-dark-900 flex overflow-hidden font-sans">
            <div className={`w-full md:w-80 bg-dark-800 border-r border-slate-700/50 flex-col flex ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 p-0.5">
                            <div className="w-full h-full bg-dark-800 rounded-full flex items-center justify-center text-white font-bold opacity-90">
                                ME
                            </div>
                        </div>
                        <div>
                            <h2 className="text-slate-100 font-semibold leading-tight">Secret Network</h2>
                            <p className="text-xs text-primary-400">Encrypted Channel</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                    {users.map(u => (
                        <motion.div
                            key={u.id}
                            whileHover={{ scale: 1.02 }}
                            onClick={() => loadConversation(u)}
                            className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors ${activeChat?.id === u.id ? 'bg-primary-500/20 shadow-inner border border-primary-500/20' : 'hover:bg-dark-700/50'}`}
                        >
                            <div className="relative">
                                <img src={u.pfp_url} alt="pfp" className="w-12 h-12 rounded-full shadow-sm bg-dark-700" />
                                {u.is_online && (
                                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-dark-800 rounded-full"></span>
                                )}
                            </div>
                            <div className="ml-3 flex-1 overflow-hidden">
                                <h4 className="text-slate-200 font-medium truncate">{u.username}</h4>
                                <p className="text-xs text-slate-400 truncate">{u.is_online ? "Active now" : "Offline"}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className={`flex-1 flex flex-col bg-[#0b101a] relative ${!activeChat ? 'hidden md:flex items-center justify-center' : ''}`}>
                {!activeChat ? (
                    <div className="text-center p-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 shadow-xl mb-6">
                            <span className="text-4xl">🕵️</span>
                        </div>
                        <h3 className="text-2xl text-slate-300 font-semibold mb-2">Secure Comms Established</h3>
                        <p className="text-slate-500">Select an agent on the left to begin transmission.</p>
                    </div>
                ) : (
                    <>
                        <div className="h-16 px-4 flex items-center bg-dark-800/80 backdrop-blur-md border-b border-slate-700/50 shadow-sm z-10 sticky top-0 gap-3">
                            <button
                                onClick={() => setActiveChat(null)}
                                className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-200 transition-colors"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="relative">
                                <img src={activeChat.pfp_url} alt="pfp" className="w-10 h-10 rounded-full bg-dark-700" />
                                {activeChat.is_online && (
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-dark-800 rounded-full"></span>
                                )}
                            </div>
                            <div>
                                <h4 className="text-slate-100 font-medium">{activeChat.username}</h4>
                                <p className="text-xs text-slate-400">{activeChat.is_online ? "Active Now" : "Offline"}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar scroll-smooth pb-10">
                            <AnimatePresence initial={false}>
                                {displayedMessages.map((msg, i) => {
                                    const isMe = msg.sender_id === currentUser.id;
                                    return (
                                        <motion.div
                                            key={msg.id || i}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`group max-w-[75%] rounded-2xl px-4 py-2 shadow-sm relative ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'glass !bg-dark-800 text-slate-200 rounded-bl-none border-dark-700'}`}>

                                                {/* Edit/Delete Actions overlay on hover for sent messages */}
                                                {isMe && (
                                                    <div className="absolute top-0 right-3 -translate-y-[80%] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-dark-900/90 rounded-md px-2 py-1 shadow-md border border-slate-700">
                                                        {msg.text && (
                                                            <button
                                                                onClick={() => { setEditingMsg(msg); setMsgText(msg.text || ""); }}
                                                                className="text-slate-300 hover:text-white"
                                                                title="Edit message"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => deleteMessage(msg.id)}
                                                            className="text-red-400 hover:text-red-500 ml-1.5"
                                                            title="Delete message"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                )}

                                                {msg.image_url && (
                                                    <img src={`http://localhost:8000${msg.image_url}`} alt="attachment" className="mt-1 mb-2 rounded-xl border border-white/10 max-h-64 object-contain" />
                                                )}
                                                {msg.audio_url && (
                                                    <audio controls src={`http://localhost:8000${msg.audio_url}`} className="w-full mt-1 mb-2 h-10 outline-none" />
                                                )}
                                                {msg.text && <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>}

                                                <div className={`text-[10px] mt-1 text-right opacity-60 ${isMe ? 'text-primary-100' : 'text-slate-400'}`}>
                                                    {new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-dark-800/50 backdrop-blur-sm border-t border-slate-700/50 relative">
                            {editingMsg && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute -top-10 left-4 right-4 bg-dark-800 border border-slate-700 rounded-t-lg px-4 py-2 flex items-center justify-between shadow-lg"
                                >
                                    <div className="flex items-center gap-2 text-sm text-primary-400">
                                        <Edit2 size={14} /> Editing message...
                                    </div>
                                    <button
                                        onClick={() => { setEditingMsg(null); setMsgText(""); }}
                                        className="p-1 hover:bg-dark-700 rounded-md text-slate-400 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}

                            <div className="flex items-end gap-2 bg-dark-900 p-2 rounded-2xl border border-slate-700/50 shadow-inner">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={!!editingMsg}
                                />

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`p-3 rounded-full transition-all ${editingMsg ? 'opacity-50 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-primary-400 hover:bg-dark-800'}`}
                                    disabled={!!editingMsg}
                                    title="Upload Image"
                                >
                                    <ImageIcon size={22} />
                                </button>

                                <button
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={stopRecording}
                                    onTouchStart={startRecording}
                                    onTouchEnd={stopRecording}
                                    className={`p-3 rounded-full transition-all duration-300 ${editingMsg ? 'opacity-50 cursor-not-allowed text-slate-600' : isRecording ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : 'text-slate-400 hover:text-primary-400 hover:bg-dark-800'}`}
                                    title="Hold to Record Audio"
                                    disabled={!!editingMsg}
                                >
                                    {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                                </button>

                                <textarea
                                    value={msgText}
                                    onChange={(e) => setMsgText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage();
                                        }
                                    }}
                                    placeholder={editingMsg ? "Edit your message..." : "Type a message..."}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-slate-200 resize-none max-h-32 py-3 px-2 custom-scrollbar text-[15px]"
                                    rows="1"
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={!msgText.trim()}
                                    className={`p-3 rounded-full transition-all ${msgText.trim() ? 'bg-primary-500 text-white shadow-lg hover:shadow-primary-500/25 hover:bg-primary-400' : 'bg-dark-800 text-slate-500'}`}
                                >
                                    <Send size={20} className={msgText.trim() ? 'ml-0.5' : ''} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
