import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, ChatSession } from '../types';
import { generateResponse } from '../services/geminiService';
import { saveSession, getSession, getAppConfig } from '../services/storageService';

// Extend window for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ChatInterfaceProps {
  contextUrl?: string;
  sessionId?: string;
  onSessionChange: (id: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ contextUrl, sessionId, onSessionChange }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // New features state
  const [isListening, setIsListening] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string} | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentSessionIdRef = useRef<string | undefined>(sessionId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, attachedFile]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Load session or initialize
  useEffect(() => {
    currentSessionIdRef.current = sessionId;
    
    if (sessionId) {
      const session = getSession(sessionId);
      if (session) {
        setMessages(session.messages);
        return;
      }
    }

    // Initialize new chat
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        text: contextUrl 
          ? `I've indexed the documentation at **${contextUrl}**.\n\nI'm ready to answer your questions about:\n- System Architecture\n- API Endpoints\n- Integration patterns\n\nHow can I help?` 
          : "Hello! I am **Lumina**. How can I assist you today?",
        timestamp: new Date().toISOString()
      }
    ]);
  }, [sessionId, contextUrl]);

  // Voice Handler
  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // File Handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setAttachedFile({
        name: file.name,
        content: text
      });
      // Reset input value so same file can be selected again if needed
      e.target.value = '';
    } catch (err) {
      console.error("Failed to read file", err);
      alert("Could not read file. Please ensure it is a text-based format (MD, TXT, Code).");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !attachedFile) || isTyping) return;

    // Combine input with file content
    let fullPrompt = input;
    let displayAttachmentName = undefined;

    if (attachedFile) {
      fullPrompt = `[FILE ATTACHED: ${attachedFile.name}]\n\n${attachedFile.content}\n\n[USER QUERY]\n${input}`;
      displayAttachmentName = attachedFile.name;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input || `Analyzed ${attachedFile?.name}`, // Fallback text if only file sent
      attachmentName: displayAttachmentName,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setAttachedFile(null); // Clear attachment
    setIsTyping(true);

    // Save user message immediately (optimistic save)
    updateSession(newMessages);

    try {
      const config = getAppConfig();
      // Validate key based on provider
      if (config.provider === 'google' && !config.googleKey) {
          throw new Error("Google API Key is missing. Please configure in Settings.");
      }
      if (config.provider === 'openrouter' && !config.openRouterKey) {
          throw new Error("OpenRouter API Key is missing. Please configure in Settings.");
      }
      
      // Use fullPrompt (with file content) for generation
      const responseText = await generateResponse(config, newMessages, fullPrompt, contextUrl);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date().toISOString()
      };
      
      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);
      updateSession(finalMessages);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const updateSession = (msgs: Message[]) => {
    let id = currentSessionIdRef.current;
    let title = "New Chat";
    
    // Generate title from first user message
    const firstUserMsg = msgs.find(m => m.role === 'user');
    if (firstUserMsg) {
       title = firstUserMsg.text.slice(0, 40) + (firstUserMsg.text.length > 40 ? '...' : '');
    } else if (contextUrl) {
       title = `Chat about ${contextUrl.replace(/https?:\/\//, '')}`;
    }

    if (!id) {
      id = Date.now().toString(); // Simple ID generation
      currentSessionIdRef.current = id;
      onSessionChange(id); // Notify parent
    }

    const session: ChatSession = {
      id,
      title,
      date: new Date().toISOString(),
      messages: msgs,
      contextUrl
    };

    saveSession(session);
  };

  // Helper component to render rich Markdown
  const MarkdownRenderer = ({ content, role }: { content: string, role: 'user' | 'model' }) => {
    const isModel = role === 'model';
    
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Header styles
          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-4" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-3" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
          
          // List styles
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mb-2 space-y-1" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mb-2 space-y-1" {...props} />,
          li: ({node, ...props}) => <li className="pl-1" {...props} />,
          
          // Text styles
          p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
          strong: ({node, ...props}) => <strong className={`font-bold ${isModel ? 'text-slate-900' : 'text-white'}`} {...props} />,
          em: ({node, ...props}) => <em className="italic opacity-80" {...props} />,
          a: ({node, ...props}) => <a className={`underline underline-offset-2 hover:opacity-80 transition-opacity ${isModel ? 'text-indigo-600 decoration-indigo-300' : 'text-white decoration-white/50'}`} target="_blank" rel="noopener noreferrer" {...props} />,
          
          // Table styles - crucial for "voir les tableau"
          table: ({node, ...props}) => (
            <div className={`overflow-x-auto my-4 rounded-xl border ${isModel ? 'border-slate-200' : 'border-white/20'}`}>
              <table className={`min-w-full divide-y ${isModel ? 'divide-slate-200' : 'divide-white/20'}`} {...props} />
            </div>
          ),
          thead: ({node, ...props}) => <thead className={isModel ? 'bg-slate-50' : 'bg-black/10'} {...props} />,
          tbody: ({node, ...props}) => <tbody className={`divide-y ${isModel ? 'divide-slate-200' : 'divide-white/20'}`} {...props} />,
          tr: ({node, ...props}) => <tr {...props} />,
          th: ({node, ...props}) => <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${isModel ? 'text-slate-500' : 'text-indigo-100'}`} {...props} />,
          td: ({node, ...props}) => <td className="px-4 py-3 text-sm whitespace-nowrap" {...props} />,
          
          // Code styles
          code: ({node, inline, className, children, ...props}: any) => {
             const match = /language-(\w+)/.exec(className || '');
             if (inline) {
               return (
                 <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isModel ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-black/20 text-indigo-50 border border-white/10'}`} {...props}>
                   {children}
                 </code>
               );
             }
             return (
               <div className={`rounded-xl overflow-hidden my-3 border ${isModel ? 'border-slate-200 bg-slate-50' : 'border-white/20 bg-black/20'}`}>
                 <div className={`px-4 py-1 text-[10px] font-mono opacity-50 border-b ${isModel ? 'border-slate-200' : 'border-white/10'}`}>
                    {match ? match[1] : 'code'}
                 </div>
                 <pre className="p-4 overflow-x-auto">
                    <code className="text-xs font-mono leading-relaxed" {...props}>
                      {children}
                    </code>
                 </pre>
               </div>
             );
          },
          blockquote: ({node, ...props}) => (
            <blockquote className={`border-l-4 pl-4 italic my-4 ${isModel ? 'border-indigo-300 text-slate-500' : 'border-white/50 text-indigo-100'}`} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto h-[85vh] flex flex-col bg-white rounded-[2.5rem] shadow-xl border border-white/50 overflow-hidden animate-slideUp">
      {/* Chat Header */}
      <div className="h-16 border-b border-slate-100 flex items-center px-8 bg-white/50 backdrop-blur-sm sticky top-0 z-10 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Lumina AI</span>
          {contextUrl && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full truncate max-w-[200px]">
              Context: {contextUrl}
            </span>
          )}
        </div>
        {sessionId && (
           <span className="text-xs text-slate-400 font-mono">ID: {sessionId.slice(-4)}</span>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            {/* Attachment Indicator in History */}
            {msg.attachmentName && (
              <div className="mb-1 mr-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
                </svg>
                {msg.attachmentName}
              </div>
            )}
            
            <div 
              className={`
                max-w-[85%] p-5 rounded-2xl shadow-sm text-sm 
                ${msg.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none shadow-indigo-200' 
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}
                ${msg.isError ? 'bg-red-50 border-red-200 text-red-600' : ''}
              `}
            >
               <MarkdownRenderer content={msg.text} role={msg.role} />
               
               <div className={`text-[10px] mt-2 opacity-50 text-right ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex gap-2 items-center">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-0"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></span>
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        
        {/* Attachment Preview Chip */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-3 bg-indigo-50 border border-indigo-100 px-3 py-2 rounded-xl w-fit animate-fadeIn">
             <div className="p-1.5 bg-white rounded-lg text-indigo-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                </svg>
             </div>
             <div className="flex flex-col">
                <span className="text-xs font-bold text-indigo-900 line-clamp-1 max-w-[200px]">{attachedFile.name}</span>
                <span className="text-[10px] text-indigo-500">Ready to analyze</span>
             </div>
             <button 
               onClick={() => setAttachedFile(null)}
               className="ml-2 text-indigo-400 hover:text-indigo-600 p-1 rounded-full hover:bg-indigo-100 transition-colors"
             >
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                 <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
               </svg>
             </button>
          </div>
        )}

        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          
          {/* File Upload Button */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect}
            className="hidden" 
            accept=".md,.txt,.json,.js,.ts,.tsx,.py,.html,.css"
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-slate-100 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all h-[56px] w-[56px] flex items-center justify-center shrink-0"
            title="Upload MD/Text file"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
               <path fillRule="evenodd" d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z" clipRule="evenodd" />
             </svg>
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening..." : "Ask or attach a file..."}
            className={`w-full bg-slate-100 border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-indigo-100 text-slate-700 placeholder:text-slate-400 transition-all h-[56px] ${isListening ? 'placeholder:text-indigo-500 placeholder:font-semibold' : ''}`}
          />
          
          {/* Voice Input Button */}
          <button 
            type="button"
            onClick={toggleVoice}
            className={`
               absolute right-[60px] p-2 rounded-xl transition-all top-1/2 -translate-y-1/2
               ${isListening ? 'text-red-500 bg-red-50 animate-pulse ring-2 ring-red-100' : 'text-slate-400 hover:text-indigo-500'}
            `}
            title="Voice Input"
          >
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
               <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
               <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
             </svg>
          </button>

          {/* Send Button */}
          <button 
            type="submit"
            disabled={(!input.trim() && !attachedFile) || isTyping}
            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-md h-[56px] w-[56px] flex items-center justify-center shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;