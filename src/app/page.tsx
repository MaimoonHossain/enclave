'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Plus, Send, FileText, Cpu, User, Loader2, ArrowUp, X } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
};

export default function Home() {
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Chat State
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  // --- Upload Logic ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      if (selectedFile.size > 100 * 1024) {
        setUploadMessage('Error: File size must be less than 100KB.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setFile(selectedFile);
      setUploadMessage('');
      
      // Auto-upload when selected
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        if (response.ok) {
          setUploadMessage(`Vault Updated: Processed ${selectedFile.name}`);
        } else {
          setUploadMessage(`Error: ${data.error}`);
        }
      } catch {
        setUploadMessage('An unexpected error occurred.');
      } finally {
        setIsUploading(false);
        setFile(null);
        setTimeout(() => setShowUploadMenu(false), 2000);
      }
    }
  };

  // --- Chat Logic ---
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMessage = query.trim();
    setQuery('');
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        setChatHistory(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'ai', 
          content: data.answer,
          sources: data.sources && data.sources.length > 0 ? [...new Set(data.sources as string[])] : undefined 
        }]);
      } else {
        setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `Error: ${data.error}` }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-neutral-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 shadow-inner border border-white/5">
            <Cpu className="w-4 h-4 text-neutral-200" />
          </div>
          <h1 className="text-base font-semibold tracking-tight text-neutral-100">Enclave</h1>
        </div>
        <div className="px-3 py-1 text-xs font-medium border rounded-full bg-neutral-900 border-white/10 text-neutral-400">
          Secure Vault
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-0">
        <div className="max-w-3xl mx-auto py-10 pb-32">
          
          {chatHistory.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center mt-32 text-center"
            >
              <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/5 flex items-center justify-center shadow-2xl">
                <Cpu className="w-8 h-8 text-neutral-400" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-white mb-2">How can I help you today?</h2>
              <p className="text-neutral-500 max-w-sm">Upload documents to your secure local vault, then ask me anything about them.</p>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {chatHistory.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {/* AI Avatar */}
                  {msg.role === 'ai' && (
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 border border-white/10 mt-1">
                      <Cpu className="w-4 h-4 text-neutral-300" />
                    </div>
                  )}

                  {/* Message Content */}
                  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    <div 
                      className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-neutral-200 text-neutral-900 rounded-2xl rounded-tr-sm font-medium' 
                          : 'text-neutral-300 prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700 max-w-none'
                      }`}
                    >
                      {msg.role === 'ai' ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Sources Badge */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.sources.map((src, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400">
                            <FileText className="w-3 h-3" />
                            <span>{src}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 border border-white/10 mt-1">
                    <Cpu className="w-4 h-4 text-neutral-300" />
                  </div>
                  <div className="flex items-center gap-1 px-2">
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pt-10 pb-6 px-4 md:px-0">
        <div className="max-w-3xl mx-auto relative">
          
          {/* Upload Popover */}
          <AnimatePresence>
            {showUploadMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-3 p-1.5 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col gap-1 w-64 z-20"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-semibold text-neutral-400">Add to Vault</span>
                  <button onClick={() => setShowUploadMenu(false)} className="text-neutral-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <input 
                  type="file" 
                  accept=".pdf,.txt" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-neutral-800 transition-colors text-sm text-left disabled:opacity-50 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors">
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <FileText className="w-4 h-4 text-neutral-400" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-neutral-200">Upload Document</span>
                    <span className="text-xs text-neutral-500">PDF or TXT formats</span>
                  </div>
                </button>
                
                {uploadMessage && (
                  <div className={`px-3 py-2 text-xs font-medium rounded-lg mt-1 ${uploadMessage.includes('Error') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {uploadMessage}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Bar */}
          <form 
            onSubmit={handleChat} 
            className="flex items-end gap-2 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[28px] p-2 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-lg"
          >
            {/* Plus Button */}
            <button
              type="button"
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all ml-1"
            >
              <Plus className={`w-5 h-5 transition-transform duration-200 ${showUploadMenu ? 'rotate-45' : 'rotate-0'}`} />
            </button>

            {/* Text Input */}
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="flex-1 bg-transparent border-none focus:outline-none resize-none py-3 text-[15px] max-h-32 min-h-[44px] text-neutral-200 placeholder:text-neutral-500 custom-scrollbar"
              rows={1}
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full mr-1 transition-all ${
                !query.trim() || isTyping 
                  ? 'bg-neutral-800 text-neutral-500' 
                  : 'bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95'
              }`}
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-neutral-600 font-medium">Enclave can make mistakes. Consider verifying important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}