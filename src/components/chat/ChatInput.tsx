'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, FileText, Loader2, ArrowUp, Square } from 'lucide-react';
import { RefObject } from 'react';

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
}: ChatInputProps) {
  return (
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
          <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-all ml-1"
          >
            <Plus className={`w-5 h-5 transition-transform duration-200 ${showUploadMenu ? 'rotate-45' : 'rotate-0'}`} />
          </button>

          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-transparent border-none focus:outline-none resize-none py-3 text-[15px] max-h-32 min-h-[44px] text-neutral-200 placeholder:text-neutral-500 custom-scrollbar"
            rows={1}
          />

          <button
            type={isTyping ? "button" : "submit"}
            onClick={isTyping ? stop : undefined}
            disabled={!query.trim() && !isTyping}
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full mr-1 transition-all ${
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
        <div className="text-center mt-3">
          <span className="text-[11px] text-neutral-600 font-medium">Enclave can make mistakes. Consider verifying important information.</span>
        </div>
      </div>
    </div>
  );
}
