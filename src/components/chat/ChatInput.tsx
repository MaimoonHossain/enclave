'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  FileText, 
  Loader2, 
  ArrowUp, 
  Square, 
  Globe, 
  Database, 
  TrendingUp 
} from 'lucide-react';
import { RefObject, useState, useEffect, useRef } from 'react';

interface ChatInputProps {
  query: string;
  setQuery: (query: string) => void;
  handleChat: (e: React.FormEvent) => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isTyping: boolean;
  showUploadMenu: boolean;
  setShowUploadMenu: (show: boolean) => void;
  isUploading: boolean;
  uploadMessage: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  stop: () => void;
  searchMode: 'web' | 'vault' | 'default';
  setSearchMode: (mode: 'web' | 'vault' | 'default') => void;
  isCentered?: boolean;
}

export function ChatInput({
  query,
  setQuery,
  handleChat,
  handleKeyDown,
  isTyping,
  showUploadMenu,
  setShowUploadMenu,
  isUploading,
  uploadMessage,
  fileInputRef,
  handleFileChange,
  stop,
  searchMode,
  setSearchMode,
  isCentered = false,
}: ChatInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when user clicks anywhere outside the input or suggestions block
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={
      isCentered 
        ? "w-full max-w-3xl mx-auto relative px-4 md:px-0 mt-2" 
        : "fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/95 to-transparent pt-10 pb-6 px-4 md:px-0 z-10"
    }>
      <div className={isCentered ? "" : "max-w-3xl mx-auto relative"} ref={containerRef}>
        
        {/* Actions & Tools Popover */}
        <AnimatePresence>
          {showUploadMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full left-0 mb-3 p-1.5 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col gap-1 w-64 z-20"
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-semibold text-neutral-400">Actions & Tools</span>
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
              
              {/* Option 1: Upload Document */}
              <button 
                type="button"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors text-sm text-left disabled:opacity-50 group"
              >
                <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" /> : <FileText className="w-4 h-4 text-neutral-400" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-200">Upload Document</span>
                  <span className="text-xs text-neutral-500">PDF or TXT formats</span>
                </div>
              </button>

              {/* Option 2: Web Search Selective Mode */}
              <button 
                type="button"
                onClick={() => {
                  setSearchMode(searchMode === 'web' ? 'default' : 'web');
                  setShowUploadMenu(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors text-sm text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  searchMode === 'web' ? 'bg-blue-500/20 text-blue-400' : 'bg-neutral-800 group-hover:bg-neutral-700 text-neutral-400 group-hover:text-white'
                }`}>
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-200">Web Search</span>
                  <span className="text-xs text-neutral-500">Search the live web</span>
                </div>
              </button>

              {/* Option 3: Vault Search Selective Mode */}
              <button 
                type="button"
                onClick={() => {
                  setSearchMode(searchMode === 'vault' ? 'default' : 'vault');
                  setShowUploadMenu(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors text-sm text-left group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  searchMode === 'vault' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 group-hover:bg-neutral-700 text-neutral-400 group-hover:text-white'
                }`}>
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-200">Vault Search</span>
                  <span className="text-xs text-neutral-500">Query only your secure files</span>
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
          className="flex items-end gap-2 bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-[28px] p-2 pt-1 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-lg"
        >
          <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all ml-1 mb-0.5"
          >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${showUploadMenu ? 'rotate-45' : 'rotate-0'}`} />
          </button>

          {/* Web Search Selective Active Pill */}
          {searchMode === 'web' && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.1)] text-blue-300 ml-1 animate-fade-in self-center select-none">
              <Globe className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span className="text-xs font-semibold text-blue-200">Search</span>
              <button 
                type="button"
                onClick={() => setSearchMode('default')}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-500/20 text-blue-400 hover:text-white transition-all ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Vault Search Selective Active Pill */}
          {searchMode === 'vault' && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)] text-emerald-300 ml-1 animate-fade-in self-center select-none">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-200">Vault</span>
              <button 
                type="button"
                onClick={() => setSearchMode('default')}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-emerald-500/20 text-emerald-400 hover:text-white transition-all ml-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (searchMode === 'web') {
                setShowSuggestions(true);
              }
            }}
            placeholder={
              searchMode === 'web' 
                ? 'Search the web...' 
                : searchMode === 'vault' 
                  ? 'Search the vault...' 
                  : 'Ask anything...'
            }
            className="flex-1 bg-transparent border-none focus:outline-none resize-none py-3 text-[15px] max-h-32 min-h-[44px] text-neutral-200 placeholder:text-neutral-500 custom-scrollbar"
            rows={1}
          />

          <button
            type={isTyping ? "button" : "submit"}
            onClick={isTyping ? stop : undefined}
            disabled={!query.trim() && !isTyping}
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full mr-1 mb-0.5 transition-all ${
              !query.trim() && !isTyping 
                ? 'bg-neutral-800 text-neutral-500' 
                : 'bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95'
            }`}
          >
            {isTyping ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            )}
          </button>
        </form>

        {/* Web Search Generic Suggestions Panel */}
        <AnimatePresence>
          {searchMode === 'web' && showSuggestions && (
            <motion.div
              initial={isCentered ? { opacity: 0, y: -8, scale: 0.98 } : { opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={isCentered ? { opacity: 0, y: -8, scale: 0.98 } : { opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute left-0 right-0 p-2 rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl flex flex-col gap-0.5 z-10 ${
                isCentered ? 'top-full mt-2' : 'bottom-full mb-2'
              }`}
            >
              {[
                { label: 'Acm Awards 2026', desc: 'Find latest winners and highlights' },
                { label: 'Gina Carano', desc: 'Recent news, legal cases, and updates' },
                { label: 'Lirr Strike 2026', desc: 'Check current service status and negotiations' },
                { label: 'Pga Championship', desc: 'Leaderboard standings and schedule' },
                { label: 'Latest breakthroughs in AI', desc: 'Top research and model releases this week' },
              ].map((sug, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(sug.label);
                    setShowSuggestions(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-neutral-800 transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-800 group-hover:bg-neutral-700 flex items-center justify-center transition-colors">
                    <TrendingUp className="w-4 h-4 text-neutral-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-neutral-200 text-sm group-hover:text-white transition-colors">{sug.label}</span>
                    <span className="text-[11px] text-neutral-500 group-hover:text-neutral-400 transition-colors">{sug.desc}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {!isCentered && (
          <div className="text-center mt-3">
            <span className="text-[11px] text-neutral-600 font-medium">Enclave can make mistakes. Consider verifying important information.</span>
          </div>
        )}
      </div>
    </div>
  );
}
