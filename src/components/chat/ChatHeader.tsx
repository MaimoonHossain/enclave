'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Archive, X, FileText, Trash2, Loader2 } from 'lucide-react';
import { VaultFile } from '@/types/chat';

interface ChatHeaderProps {
  vaultFiles: VaultFile[];
  showVault: boolean;
  setShowVault: (show: boolean) => void;
  handleDeleteFile: (filename: string) => Promise<void>;
  deletingFile: string | null;
}

export function ChatHeader({
  vaultFiles,
  showVault,
  setShowVault,
  handleDeleteFile,
  deletingFile,
}: ChatHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#09090b]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 shadow-inner border border-white/5">
            <Cpu className="w-4 h-4 text-neutral-200" />
          </div>
          <h1 className="text-base font-semibold tracking-tight text-neutral-100">Enclave</h1>
        </div>
        
        <button 
          onClick={() => setShowVault(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-full bg-neutral-900 border-white/10 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <Archive className="w-3 h-3" />
          <span>Vault ({vaultFiles.length})</span>
        </button>
      </header>

      {/* --- Vault Modal Overlay --- */}
      <AnimatePresence>
        {showVault && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-neutral-900/50">
                <div>
                  <h2 className="text-lg font-semibold text-white">Your Vault</h2>
                  <p className="text-xs text-neutral-400">Manage your active knowledge base files.</p>
                </div>
                <button onClick={() => setShowVault(false)} className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {vaultFiles.length === 0 ? (
                  <div className="text-center py-8">
                    <Archive className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                    <p className="text-sm text-neutral-500">Your vault is currently empty.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {vaultFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-white/5 group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-neutral-400" />
                          </div>
                          <div className="flex flex-col truncate">
                            <span className="text-sm font-medium text-neutral-200 truncate">{f.name}</span>
                            <span className="text-xs text-neutral-500">
                              Uploaded {new Date(f.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleDeleteFile(f.name)}
                          disabled={deletingFile === f.name}
                          className="flex-shrink-0 p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingFile === f.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
