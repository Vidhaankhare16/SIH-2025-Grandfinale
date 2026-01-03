import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, X, Square, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { getFarmingAdvisory } from '../services/geminiService';
import { ChatMessage } from '../types';

interface VoiceAssistantProps {
  lang: string;
  location: string;
  openTrigger?: number; // When this changes, open the dialog
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ lang, location, openTrigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Open dialog when openTrigger changes
  useEffect(() => {
    if (openTrigger !== undefined && openTrigger > 0) {
      setIsOpen(true);
    }
  }, [openTrigger]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Minimal markdown -> HTML for bot replies (bold/italic/line breaks)
  const toHtml = (text: string) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  // Initialize welcome message only once
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ 
        id: '1', 
        sender: 'bot', 
        text: lang === 'en' ? 'Namaste! I am Kisan Sahayak. How can I help you grow Oilseeds today?' : 'ନମସ୍କାର! ମୁଁ କିଷାନ ସାହାୟକ | ଆରମ୍ଭ କରିବାକୁ ମୋତେ ତୁମର ଚାଷ ବିଷୟରେ କୁହ |' 
      }]);
    }
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Robust cleanup on unmount or close
  useEffect(() => {
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsListening(false);
    setIsSpeaking(false);
  };

  // ----------------------------------------------------------------------
  // SPEECH RECOGNITION (STT)
  // ----------------------------------------------------------------------
  const startListening = () => {
    // 1. Stop any current audio to prevent echo
    stopEverything();

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    const recogLang = lang === 'en' ? 'en-IN' : 'or-IN';
    recognition.lang = recogLang;
    recognition.continuous = false; // False is more stable on mobile
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputText(transcript);
        // Small delay to allow user to see text before sending
        setTimeout(() => handleSend(transcript), 500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      setIsListening(false);
      // On mobile, 'no-speech' is common if background noise is high
      if (event.error === 'not-allowed') {
        alert("Microphone access denied. Please check settings.");
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Start failed", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // ----------------------------------------------------------------------
  // TEXT TO SPEECH (TTS)
  // ----------------------------------------------------------------------
  const speak = (text: string) => {
    // Cancel any previous speech
    synthRef.current.cancel();

    // Remove HTML tags for speaking
    const cleanText = text.replace(/<[^>]*>?/gm, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Voice Selection Strategy
    const voices = synthRef.current.getVoices();
    let selectedVoice = voices.find(v => 
      (v.name.includes('Google') && v.lang.includes(lang === 'en' ? 'en-IN' : 'hi-IN')) || 
      v.lang.includes(lang === 'en' ? 'en-IN' : 'or-IN')
    );
    
    // Fallback for Oriya if specific voice missing
    if (!selectedVoice && lang === 'or') {
         selectedVoice = voices.find(v => v.lang.includes('hi-IN'));
    }

    if (selectedVoice) utterance.voice = selectedVoice;
    
    // Slightly faster speech for crisper delivery
    utterance.rate = 1.33; 
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleStopSpeaking = () => {
    synthRef.current.cancel();
    setIsSpeaking(false);
  };

  // ----------------------------------------------------------------------
  // LOGIC
  // ----------------------------------------------------------------------
  const handleSend = async (text: string = inputText) => {
    if (!text.trim()) return;

    // Stop listening/speaking when processing starts
    stopEverything();
    
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    const history = messages.slice(-6).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text.replace(/<[^>]*>?/gm, '') 
    }));

    try {
        const response = await getFarmingAdvisory(
            text, 
            lang === 'en' ? 'English' : 'Oriya', 
            { mode: 'CHAT', location },
            history
        );

        // Ensure response is a string, as getFarmingAdvisory can return AdvisoryPlan in other modes
        const responseText = typeof response === 'string' ? response : "Please check the dashboard for the detailed plan.";
        const botHtml = toHtml(responseText);
        
        const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'bot', text: botHtml };
        setMessages(prev => [...prev, botMsg]);
        speak(responseText);
    } catch (error) {
        console.error("Chat error", error);
    } finally {
        setIsProcessing(false);
    }
  };

  // ----------------------------------------------------------------------
  // UI RENDER
  // ----------------------------------------------------------------------
  
  // Floating Action Button (Closed State)
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-enam-dark text-white rounded-full p-4 shadow-xl border-4 border-white flex items-center gap-2 hover:scale-105 transition-transform animate-bounce group"
      >
        <Mic size={28} />
        <span className="font-bold hidden group-hover:block pr-2 whitespace-nowrap">
            {lang === 'en' ? 'Ask Sahayak' : 'ସାହାୟକ'}
        </span>
      </button>
    );
  }

  // Chat Interface (Open State)
  return (
    <div className={`fixed z-[100] bg-white shadow-2xl flex flex-col transition-all duration-300
      ${isMaximized 
        ? 'inset-0' 
        : 'inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[650px] md:rounded-2xl md:border md:border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-enam-dark to-enam-green text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
           <div className={`p-2 bg-white/20 rounded-full border border-white/30 ${isSpeaking ? 'animate-pulse' : ''}`}>
             <Volume2 size={24} />
           </div>
           <div>
             <h3 className="font-bold text-lg leading-tight">
               {lang === 'en' ? 'Kisan Sahayak' : 'କିଷାନ ସାହାୟକ'}
             </h3>
             <span className="text-[10px] opacity-90 block uppercase tracking-wider font-medium">Govt of India AI</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: Minimize to close full screen, Desktop: Maximize toggle */}
          <button onClick={() => setIsMaximized(!isMaximized)} className="hover:bg-white/10 rounded-full p-2 hidden md:block">
            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          {/* Mobile Close Button */}
          <button onClick={() => { stopEverything(); setIsOpen(false); }} className="hover:bg-red-500 rounded-full p-2">
            {isMaximized || window.innerWidth < 768 ? <ChevronDown size={24} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[90%] md:max-w-[85%] ${msg.sender === 'user' ? 'self-end' : 'self-start'}`}
          >
             <div 
                className={`p-3 md:p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${
                msg.sender === 'user' 
                    ? 'bg-enam-dark text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                }`}
             >
                {msg.sender === 'bot' ? (
                    <div dangerouslySetInnerHTML={{ __html: msg.text }} className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-a:text-blue-600" />
                ) : (
                    msg.text
                )}
             </div>
             <span className="text-[10px] text-gray-400 mt-1 px-1 flex items-center gap-1">
                {msg.sender === 'user' ? 'You' : 'Sahayak'} • {new Date(parseInt(msg.id)).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          </div>
        ))}
        
        {isProcessing && (
           <div className="self-start bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm w-16 flex justify-center">
             <div className="flex gap-1">
               <div className="w-2 h-2 bg-enam-green rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
               <div className="w-2 h-2 bg-enam-green rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
               <div className="w-2 h-2 bg-enam-green rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Controls Area */}
      <div className="p-3 md:p-4 bg-white border-t border-gray-200 shrink-0 safe-area-bottom">
        
        {/* Active Status Indicators */}
        {(isListening || isSpeaking) && (
            <div className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2 mb-3 border border-gray-100 animate-in fade-in slide-in-from-bottom-2">
                <span className="flex items-center gap-2 font-bold text-xs">
                    {isListening && <span className="text-red-500 animate-pulse flex items-center gap-1">● Listening...</span>}
                    {isSpeaking && <span className="text-enam-green flex items-center gap-1">● Speaking...</span>}
                </span>
                
                {isSpeaking && (
                    <button 
                        onClick={handleStopSpeaking}
                        className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1.5 rounded-md hover:bg-red-200 font-bold text-xs uppercase"
                    >
                        <Square size={10} fill="currentColor" /> Stop
                    </button>
                )}
            </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-2">
           <button 
            onTouchStart={startListening}
            onTouchEnd={stopListening} // For mobile 'hold to talk' feel if needed, or just click
            onClick={isListening ? stopListening : startListening}
            className={`p-3 md:p-4 rounded-full transition-all duration-200 shadow-md shrink-0 ${
                isListening 
                    ? 'bg-red-500 text-white scale-110 ring-4 ring-red-100' 
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'
            }`}
          >
            <Mic size={24} />
          </button>
          
          <div className="flex-1 relative">
            <textarea 
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder={lang === 'en' ? "Type query..." : "ଲେଖନ୍ତୁ..."}
                className="w-full bg-gray-50 border border-gray-300 rounded-2xl pl-4 pr-10 py-3 text-base focus:outline-none focus:border-enam-green focus:ring-1 focus:ring-enam-green/20 resize-none"
            />
          </div>
          
          <button 
            onClick={() => handleSend()}
            disabled={!inputText.trim() || isProcessing}
            className="bg-enam-green text-white p-3 md:p-4 rounded-full shadow-md disabled:opacity-50 disabled:grayscale shrink-0 active:scale-95 transition-transform"
          >
            <Send size={22} className={inputText.trim() ? "ml-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;