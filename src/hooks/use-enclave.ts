import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, VaultFile } from '@/types/chat';

export function useEnclave() {
  // Upload & Vault State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [showVault, setShowVault] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  
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

  // Load vault files from local storage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('enclave_vault');
    if (savedFiles) {
      try {
        setVaultFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error("Failed to parse vault files");
      }
    }
  }, []);

  // --- Upload Logic ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      setFile(selectedFile);
      setUploadMessage('');
      
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await response.json();
        
        if (response.ok) {
          setUploadMessage(`Vault Updated: Processed ${selectedFile.name}`);
          
          const newFile = { name: selectedFile.name, date: Date.now() };
          const updatedVault = [newFile, ...vaultFiles.filter(f => f.name !== selectedFile.name)];
          setVaultFiles(updatedVault);
          localStorage.setItem('enclave_vault', JSON.stringify(updatedVault));
          
        } else {
          setUploadMessage(`Error: ${data.error}`);
        }
      } catch (error) {
        setUploadMessage('An unexpected error occurred.');
        console.error("Upload error: ", error);
      } finally {
        setIsUploading(false);
        setFile(null);
        setTimeout(() => setShowUploadMenu(false), 2000);
      }
    }
  };

  // --- Delete Logic ---
  const handleDeleteFile = async (filename: string) => {
    setDeletingFile(filename);
    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });

      if (response.ok) {
        const updatedVault = vaultFiles.filter(f => f.name !== filename);
        setVaultFiles(updatedVault);
        localStorage.setItem('enclave_vault', JSON.stringify(updatedVault));
      } else {
        const data = await response.json();
        alert(`Failed to delete file: ${data.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Network error while deleting.");
    } finally {
      setDeletingFile(null);
    }
  };

  // --- Chat Logic ---
  const handleChat = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || isTyping) return;

    const userMessage = query.trim();
    setQuery('');
    setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const recentHistory = chatHistory.slice(-4);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: recentHistory 
        }),
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
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'Connection error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat(e as unknown as React.FormEvent);
    }
  };

  return {
    // State
    query,
    setQuery,
    chatHistory,
    isTyping,
    vaultFiles,
    showVault,
    setShowVault,
    showUploadMenu,
    setShowUploadMenu,
    isUploading,
    uploadMessage,
    deletingFile,
    
    // Refs
    messagesEndRef,
    fileInputRef,
    
    // Handlers
    handleChat,
    handleKeyDown,
    handleFileChange,
    handleDeleteFile,
  };
}
