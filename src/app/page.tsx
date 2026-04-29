'use client';

import { useState } from 'react';

export default function Home() {
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // Chat State
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // --- Upload Logic ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadMessage('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (response.ok) {
        setUploadMessage(`✅ Success: ${data.message}`);
        setFile(null);
      } else {
        setUploadMessage(`❌ Error: ${data.error}`);
      }
    } catch {
      setUploadMessage('❌ An unexpected error occurred.');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Chat Logic ---
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = query;
    setQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (response.ok) {
        setChatHistory(prev => [...prev, { role: 'ai', content: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', content: `❌ Error: ${data.error}` }]);
      }
    } catch {
      setChatHistory(prev => [...prev, { role: 'ai', content: '❌ Connection error.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 flex flex-col items-center py-10 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Enclave</h1>
        <p className="text-sm text-neutral-400">Secure Knowledge Base</p>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Upload */}
        <div className="md:col-span-1 bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-fit">
          <h2 className="font-semibold text-white mb-4">1. Add to Vault</h2>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="block w-full text-xs text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 cursor-pointer border border-neutral-800 rounded-md p-2 bg-neutral-950"
            />
            <button
              type="submit"
              disabled={!file || isUploading}
              className={`py-2 px-4 rounded-md font-semibold text-xs transition-colors ${
                !file || isUploading ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {isUploading ? 'Embedding...' : 'Upload Document'}
            </button>
          </form>
          {uploadMessage && <div className="mt-4 p-3 rounded text-xs border bg-neutral-950 border-neutral-800">{uploadMessage}</div>}
        </div>

        {/* Right Column: Chat */}
        <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col h-[600px]">
          <h2 className="font-semibold text-white mb-4">2. Query Vault</h2>
          
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
            {chatHistory.length === 0 ? (
              <p className="text-neutral-500 text-sm italic text-center mt-20">Upload a document, then ask a question about it.</p>
            ) : (
              chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' ? 'bg-blue-600/20 border border-blue-900/50 text-blue-100' : 'bg-neutral-800 border border-neutral-700 text-neutral-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {isTyping && <div className="text-neutral-500 text-xs italic">Enclave is searching the vault...</div>}
          </div>

          <form onSubmit={handleChat} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your documents..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-neutral-600"
            />
            <button type="submit" disabled={!query || isTyping} className="bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50">
              Send
            </button>
          </form>
        </div>

      </div>
    </main>
  );
}