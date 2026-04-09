"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Paperclip, Mic, Send } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function ChatInput({
  onSendMessage,
  isLoading = false,
  inputRef: externalRef,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef || internalRef;

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
  };

  const handleFileUpload = () => {
    // File upload logic would go here
  };

  return (
    <div className="fixed bottom-0 left-0 lg:left-60 right-0 bg-white border-t border-gray-200 p-4 z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-gray-50 rounded-full border border-gray-200 px-4 py-2 focus-within:border-blue-500 transition-colors">
          {/* Attach Button */}
          <button
            onClick={handleFileUpload}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Anexar arquivo"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o caso, informe o número do processo ou faça uma pergunta estratégica..."
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-base lg:text-sm text-gray-800 placeholder-gray-400"
            disabled={isLoading}
          />

          {/* Voice Button */}
          <button
            onClick={handleVoiceRecord}
            className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
              isRecording
                ? "text-red-500 bg-red-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Gravar mensagem de voz"
          >
            <Mic className={`w-5 h-5 ${isRecording ? "animate-pulse" : ""}`} />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!message.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 bg-primary hover:bg-primary-hover disabled:bg-gray-300 rounded-full flex items-center justify-center transition-colors"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center mt-2">
          A nossa assistente fornece análises preditivas baseadas em jurimetria.
          Sempre consulte um advogado para decisões finais.
        </p>
      </div>
    </div>
  );
}
