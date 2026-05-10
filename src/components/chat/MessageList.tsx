'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Cpu, FileText } from 'lucide-react';
import { Message } from '@/types/chat';
import { RefObject } from 'react';

interface MessageListProps {
  chatHistory: Message[];
  isTyping: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function MessageList({
  chatHistory,
  isTyping,
  messagesEndRef,
}: MessageListProps) {
  return (
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
                {msg.role === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 border border-white/10 mt-1">
                    <Cpu className="w-4 h-4 text-neutral-300" />
                  </div>
                )}

                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div 
                    className={`px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-neutral-200 text-neutral-900 rounded-2xl rounded-tr-sm font-medium' 
                        : 'text-neutral-300 prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-800 prose-pre:border prose-pre:border-neutral-700 max-w-none'
                    }`}
                  >
                    {msg.role === 'ai' ? (
                      msg.content.trim() ? (
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      ) : (
                        <div className="flex items-center gap-1 py-1">
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} />
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-neutral-500" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                        </div>
                      )
                    ) : (
                      msg.content
                    )}
                  </div>

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

            {isTyping && chatHistory[chatHistory.length - 1]?.role !== 'ai' && (
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
  );
}
