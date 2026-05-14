import { useState, useRef, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

import { Message, VaultFile } from '@/types/chat';

export function useEnclave() {
  // =========================
  // Input State
  // =========================
  const [query, setQuery] = useState('');

  // =========================
  // Vault State
  // =========================
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  const [vaultFiles, setVaultFiles] = useState<VaultFile[]>([]);
  const [showVault, setShowVault] = useState(false);

  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  // =========================
  // Refs & Source Mapping
  // =========================
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Track sources per message ID to preserve them in history
  const [sourcesMap, setSourcesMap] = useState<Record<string, string[]>>({});
  const latestSourcesRef = useRef<string[] | null>(null);

  // =========================
  // AI SDK Chat
  // =========================
  const {
    messages,
    sendMessage,
    status,
    error,
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      // Extract the custom header when the stream first connects
      fetch: async (input, init) => {
        const response = await fetch(input, init);
        const sourcesHeader = response.headers.get('X-Enclave-Sources');
        if (sourcesHeader) {
          try {
            latestSourcesRef.current = JSON.parse(sourcesHeader);
          } catch (e) {
            console.error('Failed to parse sources header:', e);
          }
        }
        return response;
      },
    }),
    
    // Lock the sources to the specific message ID when generation finishes
    onFinish: (message: any) => {
      if (latestSourcesRef.current) {
        setSourcesMap((prev) => ({
          ...prev,
          [message.id]: latestSourcesRef.current!,
        }));
        latestSourcesRef.current = null;
      }
    },

    onError: (error) => {
      console.error('Chat stream error:', error);
    },
  });

  // =========================
  // Loading State
  // =========================
  const isTyping = status === 'submitted' || status === 'streaming';

  // =========================
  // Auto Scroll
  // =========================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isTyping]);

  // =========================
  // Load Vault Files
  // =========================
  useEffect(() => {
    const savedFiles = localStorage.getItem('enclave_vault');

    if (savedFiles) {
      try {
        setVaultFiles(JSON.parse(savedFiles));
      } catch (error) {
        console.error('Failed to parse vault files:', error);
      }
    }
  }, []);

  // =========================
  // Convert SDK Messages
  // =========================
// =========================
// Convert SDK Messages
// =========================
const chatHistory: Message[] = messages.map((message, index) => {
  const isLastMessage = index === messages.length - 1;
  let activeSources: string[] | undefined = sourcesMap[message.id];

  if (!activeSources && isLastMessage && message.role !== 'user') {
    activeSources = latestSourcesRef.current || undefined;
  }

  // Extract Tool Invocations from message parts (AI SDK v6 pattern)
  // We use a combination of message.toolInvocations (v4/v5 compat) and parts (v6)
  const toolCalls = [
    ...(message.toolInvocations || []),
    ...(message.parts
      ?.filter((part: any) => part.type === 'tool-invocation')
      .map((part: any) => part.toolInvocation) || [])
  ];

  // Deduplicate by toolCallId
  const uniqueToolCalls = Array.from(
    new Map(toolCalls.map(tc => [tc.toolCallId, tc])).values()
  );

  return {
    id: message.id,
    role: message.role === 'user' ? 'user' : 'ai',
    content: message.parts?.map((part: any) => (part.type === 'text' ? part.text : '')).join('') || '',
    sources: activeSources,
    toolInvocations: uniqueToolCalls
  };
});

  // =========================
  // Upload File
  // =========================
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    const selectedFile = e.target.files[0];

    setFile(selectedFile);
    setUploadMessage('');
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadMessage(`Vault Updated: Processed ${selectedFile.name}`);

        const newFile: VaultFile = {
          name: selectedFile.name,
          date: Date.now(),
        };

        const updatedVault = [
          newFile,
          ...vaultFiles.filter((f) => f.name !== selectedFile.name),
        ];

        setVaultFiles(updatedVault);
        localStorage.setItem('enclave_vault', JSON.stringify(updatedVault));
      } else {
        setUploadMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      setUploadMessage('An unexpected error occurred.');
    } finally {
      setIsUploading(false);
      setFile(null);

      setTimeout(() => {
        setShowUploadMenu(false);
      }, 2000);
    }
  };

  // =========================
  // Delete File
  // =========================
  const handleDeleteFile = async (filename: string) => {
    setDeletingFile(filename);

    try {
      const response = await fetch('/api/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (response.ok) {
        const updatedVault = vaultFiles.filter((f) => f.name !== filename);
        setVaultFiles(updatedVault);
        localStorage.setItem('enclave_vault', JSON.stringify(updatedVault));
      }
    } catch (error) {
      console.error(error);
      alert('Network error while deleting.');
    } finally {
      setDeletingFile(null);
    }
  };

  // =========================
  // Send Chat Message
  // =========================
  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || isTyping) {
      return;
    }

    const userMessage = query.trim();

    // Clear UI instantly
    setQuery('');

    // Send message using the v6 format
    sendMessage({
      text: userMessage,
    });
  };

  // =========================
  // Enter to Send
  // =========================
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChat(e as unknown as React.FormEvent);
    }
  };

  // =========================
  // Return
  // =========================
  return {
    query,
    setQuery,
    chatHistory,
    isTyping,
    error,
    vaultFiles,
    showVault,
    setShowVault,
    showUploadMenu,
    setShowUploadMenu,
    isUploading,
    uploadMessage,
    deletingFile,
    messagesEndRef,
    fileInputRef,
    handleChat,
    handleKeyDown,
    handleFileChange,
    handleDeleteFile,
    stop,
  };
}