'use client';

import { useEnclave } from '@/hooks/use-enclave';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';

export default function Home() {
  const {
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
    messagesEndRef,
    fileInputRef,
    handleChat,
    handleKeyDown,
    handleFileChange,
    handleDeleteFile,
    stop,
    searchMode,
    setSearchMode,
  } = useEnclave();

  const isEmpty = chatHistory.length === 0;

  return (
    <div className="flex flex-col h-full bg-[#09090b] text-neutral-200 font-sans selection:bg-neutral-800 selection:text-neutral-100">
      <ChatHeader 
        vaultFiles={vaultFiles}
        showVault={showVault}
        setShowVault={setShowVault}
        handleDeleteFile={handleDeleteFile}
        deletingFile={deletingFile}
      />

      <MessageList 
        chatHistory={chatHistory}
        isTyping={isTyping}
        messagesEndRef={messagesEndRef}
      >
        {isEmpty && (
          <ChatInput 
            query={query}
            setQuery={setQuery}
            handleChat={handleChat}
            handleKeyDown={handleKeyDown}
            isTyping={isTyping}
            showUploadMenu={showUploadMenu}
            setShowUploadMenu={setShowUploadMenu}
            isUploading={isUploading}
            uploadMessage={uploadMessage}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            stop={stop}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            isCentered={true}
          />
        )}
      </MessageList>

      {!isEmpty && (
        <ChatInput 
          query={query}
          setQuery={setQuery}
          handleChat={handleChat}
          handleKeyDown={handleKeyDown}
          isTyping={isTyping}
          showUploadMenu={showUploadMenu}
          setShowUploadMenu={setShowUploadMenu}
          isUploading={isUploading}
          uploadMessage={uploadMessage}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          stop={stop}
          searchMode={searchMode}
          setSearchMode={setSearchMode}
          isCentered={false}
        />
      )}

      {isEmpty && (
        <div className="text-center pb-4 pt-2 z-0 flex-shrink-0">
          <span className="text-[11px] text-neutral-600 font-medium select-none">
            Enclave can make mistakes. Consider verifying important information.
          </span>
        </div>
      )}
    </div>
  );
}