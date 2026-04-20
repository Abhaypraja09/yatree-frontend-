import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Bot, 
    X, 
    Send, 
    Mic, 
    MicOff, 
    Sparkles, 
    MessageSquare,
    ChevronDown,
    Maximize2,
    RotateCcw
} from 'lucide-react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AIChatAgent = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Hello! I am your Texi Fleet AI Assistant. How can I help you manage your fleet today? (You can type or use voice!)' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [hasGreeted, setHasGreeted] = useState(false);
    const messagesEndRef = useRef(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));


    // Speech Recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = SpeechRecognition ? new SpeechRecognition() : null;

    if (recognition) {
        recognition.continuous = false;
        recognition.lang = 'en-US'; // Can be improved to use 'en-IN' or 'hi-IN'

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            console.error('Speech Recognition Error', event.error);
            setIsListening(false);
        };
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const playAlertSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
            // Repeat for 3 seconds effect
            const interval = setInterval(() => {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(e => {});
            }, 1000);
            setTimeout(() => clearInterval(interval), 3000);
        }
    };

    useEffect(() => {
        const fetchBriefing = async () => {
            if (isOpen && !hasGreeted) {
                setIsTyping(true);
                try {
                    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                    const { data } = await axios.get('/api/ai/briefing', {
                        headers: { Authorization: `Bearer ${userInfo.token}` }
                    });
                    if (data.briefing) {
                        setMessages(prev => [...prev, { role: 'ai', content: data.briefing }]);
                        setHasGreeted(true);
                        if (data.alertsDetected) {
                            playAlertSound();
                        }
                    }

                } catch (err) {
                    console.error("Briefing failed", err);
                } finally {
                    setIsTyping(false);
                }
            }
        };
        fetchBriefing();
    }, [isOpen, hasGreeted]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (e) => {
        if (e) e.preventDefault();
        const userMessage = input.trim();
        if (!userMessage) return;

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsTyping(true);

        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            const { data } = await axios.post('/api/ai/query', { 
                question: userMessage,
                history: messages.slice(-5) 
            }, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

            let finalMessage = data.response;
            const actionMatch = finalMessage.match(/\[ACTION:\s*({.*?})\]/);
            
            if (actionMatch) {
                try {
                    const action = JSON.parse(actionMatch[1]);
                    finalMessage = finalMessage.replace(/\[ACTION:.*?\]/g, '').trim();
                    
                    if (action.type === 'navigate') {
                        let url = action.path;
                        if (action.filters) {
                            const params = new URLSearchParams(action.filters).toString();
                            url += `?${params}`;
                        }
                        
                        // Execute navigation after short delay
                        setTimeout(() => {
                            navigate(url);
                        }, 1000);
                    }
                } catch (e) {
                    console.error("Action Parse Error", e);
                }
            }

            setMessages(prev => [...prev, { role: 'ai', content: finalMessage }]);
            if (data.alertsDetected) {
                playAlertSound();
            }

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: error.response?.data?.message || 'Sorry, I am having trouble connecting to my brain right now.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const toggleListening = () => {
        if (!recognition) {
            alert('Speech Recognition is not supported in your browser. Please use Chrome.');
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    const userRole = user?.role?.toLowerCase() || '';
    const isAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole.includes('admin') || userRole === 'executive';

    if (!user || !isAdmin) return null; // Only show for logged in admin/executive users

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 999 }}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 100 }}
                        style={{
                            width: '400px',
                            height: '600px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '30px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            marginBottom: '20px'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '20px',
                            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.2), transparent)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '42px',
                                    height: '42px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
                                }}>
                                    <Bot size={24} color="white" />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '15px', color: 'white', fontWeight: '800', margin: 0 }}>Fleet AI Assistant</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                                        <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>System Active</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setMessages([{ role: 'ai', content: 'History cleared. How can I help you?' }])} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><RotateCcw size={18} /></button>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }} className="custom-scrollbar">
                            {messages.map((msg, i) => (
                                <div key={i} style={{
                                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '85%',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        padding: '14px 18px',
                                        borderRadius: '20px',
                                        borderBottomRightRadius: msg.role === 'user' ? '4px' : '20px',
                                        borderBottomLeftRadius: msg.role === 'ai' ? '4px' : '20px',
                                        background: msg.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '14px',
                                        lineHeight: 1.5,
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {msg.content}
                                    </div>
                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '5px', textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                                        {msg.role === 'user' ? 'You' : 'AI Agent'}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.03)', padding: '12px 20px', borderRadius: '15px' }}>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: '4px', height: '4px', background: '#6366f1', borderRadius: '50%' }} />
                                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} style={{ width: '4px', height: '4px', background: '#6366f1', borderRadius: '50%' }} />
                                        <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} style={{ width: '4px', height: '4px', background: '#6366f1', borderRadius: '50%' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} style={{
                            padding: '20px',
                            background: 'rgba(0,0,0,0.2)',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center'
                        }}>
                            <button 
                                type="button"
                                onClick={toggleListening}
                                style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '14px',
                                    background: isListening ? '#f43f5e' : 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {isListening ? <MicOff size={20} className="animate-pulse" /> : <Mic size={20} />}
                            </button>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={isListening ? "Listening..." : "Ask fleet data or help..."}
                                style={{
                                    flex: 1,
                                    height: '46px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '14px',
                                    padding: '0 15px',
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                            <button
                                type="submit"
                                disabled={isTyping || !input.trim()}
                                style={{
                                    width: '46px',
                                    height: '46px',
                                    borderRadius: '14px',
                                    background: '#6366f1',
                                    border: 'none',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: input.trim() ? 'pointer' : 'default',
                                    opacity: input.trim() ? 1 : 0.5
                                }}
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Launch Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '22px',
                    background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
                    boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.6)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                }}
            >
                <div style={{ position: 'absolute', inset: 0, borderRadius: '22px', background: 'inherit', filter: 'blur(20px)', opacity: 0.4 }} />
                <Bot size={32} style={{ position: 'relative', zIndex: 1 }} />
                <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    padding: '4px 8px',
                    background: '#f43f5e',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '900',
                    border: '2px solid rgba(15, 23, 42, 1)'
                }}>
                    AI
                </div>
            </motion.button>
        </div>
    );
};

export default AIChatAgent;
