import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
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
    RotateCcw,
    AlertTriangle
} from 'lucide-react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const AIChatAgent = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    const [shouldBlink, setShouldBlink] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [hasAlertsDetected, setHasAlertsDetected] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
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
            audioRef.current.volume = 0.4;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    };

    const speakText = (text) => {
        if (!('speechSynthesis' in window)) return;
        
        // Cancel ongoing speech
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find professional English voice
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en-GB') && v.name.includes('Google')) || 
                        voices.find(v => v.lang.startsWith('en'));
        
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = 'en-US';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        const checkAlerts = async () => {
            if (!user) return;
            try {
                const userInfoRaw = localStorage.getItem('userInfo');
                if (!userInfoRaw) return;
                const userInfo = JSON.parse(userInfoRaw);
                const { data } = await axios.get('/api/ai/alerts-check', {
                    headers: { Authorization: `Bearer ${userInfo.token}` }
                });
                if (data.alertsDetected) {
                    setAlerts(data.alerts || []);
                    setHasAlertsDetected(true);
                } else {
                    setHasAlertsDetected(false);
                }
            } catch (err) {
                console.error("Alerts check error:", err);
            }
        };
        checkAlerts();
    }, [user]);

    // Handle blinking based on location and detected alerts
    useEffect(() => {
        const isDashboard = location.pathname === '/admin' || location.pathname === '/admin/';
        if (isDashboard && hasAlertsDetected) {
            setShouldBlink(true);
            // Optional: still auto-stop after 25s if you want, or keep it till seen
            const timer = setTimeout(() => setShouldBlink(false), 25000);
            return () => clearTimeout(timer);
        } else {
            setShouldBlink(false);
        }
    }, [location.pathname, hasAlertsDetected]);

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
                        
                        // Speak the briefing - Disabled per user request
                        // setTimeout(() => {
                        //     speakText(data.briefing);
                        // }, 500);

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
            
            // Speak response
            speakText(finalMessage);

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

            <AnimatePresence>
                {isHovered && shouldBlink && alerts.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10, x: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10, x: -20 }}
                        style={{
                            position: 'absolute',
                            bottom: '80px',
                            right: '20px',
                            width: '280px',
                            background: 'rgba(15, 23, 42, 0.95)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '20px',
                            padding: '15px',
                            border: '1px solid rgba(244, 63, 94, 0.3)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                            zIndex: 100,
                            pointerEvents: 'none'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                            <AlertTriangle size={16} color="#f43f5e" />
                            <span style={{ color: 'white', fontWeight: '900', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Expiry Alerts</span>
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {alerts.map((alert, idx) => (
                                <div key={idx} style={{ 
                                    background: 'rgba(255,255,255,0.05)', 
                                    padding: '8px 12px', 
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>{alert.carNumber}</span>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', fontWeight: '700' }}>{alert.type}</span>
                                    </div>
                                    <span style={{ color: '#f43f5e', fontSize: '10px', fontWeight: '800', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 6px', borderRadius: '6px' }}>
                                        {new Date(alert.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Launch Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                animate={shouldBlink ? {
                    background: ["rgba(99, 102, 241, 1)", "rgba(244, 63, 94, 1)", "rgba(99, 102, 241, 1)"],
                    scale: [1, 1.05, 1],
                    boxShadow: [
                        '0 10px 40px -10px rgba(99, 102, 241, 0.6)',
                        '0 10px 50px -5px rgba(244, 63, 94, 0.9)',
                        '0 10px 40px -10px rgba(99, 102, 241, 0.6)'
                    ]
                } : {}}
                transition={shouldBlink ? {
                    duration: 5, // Even slower as requested
                    repeat: 5,
                    ease: "easeInOut"
                } : {}}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShouldBlink(false);
                }}
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
                    background: shouldBlink ? '#f43f5e' : '#6366f1',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: '900',
                    border: '2px solid rgba(15, 23, 42, 1)',
                    transition: 'all 0.3s ease',
                    boxShadow: shouldBlink ? '0 0 15px rgba(244, 63, 94, 0.8)' : 'none'
                }}>
                    AI
                </div>
            </motion.button>
        </div>
    );
};

export default AIChatAgent;
