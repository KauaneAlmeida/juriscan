"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Brain,
  Paperclip,
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Mic,
  Scale,
  Menu,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import ChatMessage from "@/components/ChatMessage";
import ChatEmptyState from "@/components/ChatEmptyState";
import LegalDisclaimerInline from "@/components/LegalDisclaimerInline";
import ThemeToggle from "@/components/ThemeToggle";
import { ChatAttachmentPreview, AudioRecorder, TypingIndicator } from "@/components/Chat";
import TomDeRespostaSelector from "@/components/Chat/TomDeRespostaSelector";
import { useConversations, useConversation } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { useCredits } from "@/hooks/useCredits";
import { useChatAttachments } from "@/hooks/useChatAttachments";
import type { ChatAttachment } from "@/types/chat";
import type { TomDeResposta } from "@/types/chatTone";

const TONS_VALIDOS: TomDeResposta[] = ["formal", "humanizado", "executivo", "minuta"];
const TOM_STORAGE_KEY = "juriscan_tom_preferido";

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationIdParam = searchParams.get("id");

  const [mounted, setMounted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    conversationIdParam
  );
  const [showConversations, setShowConversations] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [tomAtual, setTomAtual] = useState<TomDeResposta>("formal");

  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Sticky-to-bottom: só auto-scrolla se o usuário já estava no fundo.
  // Assim que ele rolar pra cima, a rolagem automática para de forçar.
  const isAtBottomRef = useRef(true);

  const { conversations, isLoading: isLoadingConversations, deleteConversation } =
    useConversations();
  const { messages, isLoading: isLoadingMessages } = useConversation(currentConversationId);
  const { balance } = useCredits();
  const { sendMessage, isStreaming, isWaiting, error: chatError, retry, clearError, optimisticMessages } = useChat({
    conversationId: currentConversationId,
    onConversationCreated: (id) => {
      setCurrentConversationId(id);
      router.push(`/chat?id=${id}`, { scroll: false });
    },
  });

  const {
    attachments,
    uploadProgress,
    isUploading,
    error: attachmentError,
    addAttachment,
    addAudioAttachment,
    removeAttachment,
    clearAttachments,
    uploadAttachments,
    transcribeAudio,
    totalCost,
  } = useChatAttachments();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(TOM_STORAGE_KEY) as TomDeResposta | null;
      if (saved && TONS_VALIDOS.includes(saved)) {
        setTomAtual(saved);
      }
    } catch {
      // localStorage indisponível — mantém o default
    }
  }, []);

  const handleTomChange = (tom: TomDeResposta) => {
    setTomAtual(tom);
    try {
      localStorage.setItem(TOM_STORAGE_KEY, tom);
    } catch {
      // ignora falha de persistência
    }
  };

  useEffect(() => {
    setCurrentConversationId(conversationIdParam);
  }, [conversationIdParam]);

  // Detecta se o usuário está no fundo do chat (com tolerância de 80px
  // pra funcionar mesmo com conteúdo streamando novos chunks).
  const handleChatScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanciaDoFundo = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = distanciaDoFundo < 80;
  };

  useEffect(() => {
    // Só auto-scrolla se o usuário estava grudado no fundo.
    // Assim que ele rolar pra cima, isAtBottomRef vira false e o
    // streaming de chunks não força mais a rolagem.
    if (!isAtBottomRef.current) return;
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, optimisticMessages, isWaiting]);

  // Quando o usuário envia uma mensagem nova, força um reset pro fundo
  // mesmo que ele estivesse rolado pra cima lendo algo antigo.
  useEffect(() => {
    if (isStreaming || isWaiting) {
      isAtBottomRef.current = true;
    }
  }, [isStreaming, isWaiting]);

  useEffect(() => {
    const handleClickOutside = () => setShowAttachMenu(false);
    if (showAttachMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showAttachMenu]);

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    router.push("/chat", { scroll: false });
  };

  const handleSelectConversation = (id: string) => {
    setCurrentConversationId(id);
    router.push(`/chat?id=${id}`, { scroll: false });
    setShowConversations(false);
  };

  const handleDeleteConversation = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta conversa?")) {
      deleteConversation(id);
      if (currentConversationId === id) {
        handleNewConversation();
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputValue.trim();
    if ((!text && attachments.length === 0) || isStreaming || isUploading) return;

    if (balance < totalCost) {
      alert(`Créditos insuficientes. Você precisa de ${totalCost} créditos.`);
      return;
    }

    let uploadedAttachments: ChatAttachment[] = [];
    if (attachments.length > 0) {
      uploadedAttachments = await uploadAttachments();
    }

    sendMessage(text, uploadedAttachments, tomAtual);
    setInputValue("");
    clearAttachments();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await addAttachment(file);
        }
      }
    }
  };

  // Used by the empty-state prompt cards: fill the input but don't auto-send
  const handleFillInput = (text: string) => {
    setInputValue(text);
    // Defer focus until after React commits the new value so the caret lands at the end
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      await addAttachment(file);
    }

    if (e.target) e.target.value = "";
    setShowAttachMenu(false);
  };

  const handleAudioComplete = (blob: Blob, duration: number) => {
    addAudioAttachment(blob, duration);
    setIsRecordingAudio(false);
  };

  const displayMessages = messages.length > 0 ? messages : optimisticMessages;
  // Só mostra o empty state quando é uma conversa nova (sem id) E nada está
  // carregando. Durante refetches ou troca de conversa, preserva a UI anterior
  // para não "flashear" os cards de sugestão.
  const showSuggestions =
    currentConversationId === null &&
    displayMessages.length === 0 &&
    attachments.length === 0 &&
    !isStreaming &&
    !isLoadingMessages;
  const hasAttachments = attachments.length > 0;

  // Título da conversa atual (usado como hint do nome do arquivo na exportação por mensagem)
  const currentConversationTitle = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId)?.title ?? null
    : null;

  if (!mounted) return null;

  return (
    <AppShell hideBottomNav>
      {/* Mobile Conversations Drawer */}
      {showConversations && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConversations(false)}
          />
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#0f1923] shadow-xl animate-slide-left flex flex-col"
            style={{ paddingTop: "var(--safe-area-top)" }}
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/[0.08] flex-shrink-0">
              <h2 className="font-semibold text-gray-800 dark:text-white">Conversas</h2>
            </div>
            <div className="p-2 flex-shrink-0">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 p-3 text-primary dark:text-[#7aa6ff] hover:bg-primary/5 active:bg-primary/10 dark:hover:bg-white/[0.04] rounded-lg transition-colors min-h-[48px]"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Nova conversa</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 overscroll-contain">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between mx-2 rounded-lg ${
                    currentConversationId === conv.id
                      ? "bg-primary/10 dark:bg-white/[0.06]"
                      : "active:bg-gray-100 dark:active:bg-white/[0.04]"
                  }`}
                >
                  <button
                    className="flex items-center gap-3 flex-1 min-w-0 p-3 min-h-[48px] text-left text-gray-700 dark:text-white/85"
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <MessageSquare className="w-4 h-4 text-gray-400 dark:text-white/40 flex-shrink-0" />
                    <span className="text-sm truncate">{conv.title || "Nova conversa"}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-red-500 active:text-red-600 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chat layout - fills the available space */}
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen bg-white dark:bg-[#0f1923]">
        {/* Header */}
        <header className="bg-white dark:bg-[#0f1923] border-b border-gray-200 dark:border-white/[0.08] px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
          {/* Header Content */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile conversations toggle */}
              <button
                onClick={() => setShowConversations(true)}
                className="lg:hidden p-2 -ml-2 text-gray-500 dark:text-white/65 hover:text-gray-700 dark:hover:text-white active:text-gray-900 touch-target flex items-center justify-center flex-shrink-0"
                aria-label="Ver conversas"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex p-2 bg-[#EEF2FF] dark:bg-[#1a4fd6]/15 rounded-[10px] flex-shrink-0">
                <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-primary dark:text-[#7aa6ff]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-white truncate">
                  Análise Jurídica
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-white/55 hidden sm:block">
                  IA conversacional especializada em jurimetria e previsão processual
                </p>
              </div>
            </div>

            {/* Right cluster: theme toggle + new conversation */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <ThemeToggle />

              {/* Mobile new conversation button */}
              <button
                onClick={handleNewConversation}
                className="lg:hidden p-2 text-primary dark:text-[#7aa6ff] hover:bg-primary/5 dark:hover:bg-white/[0.06] active:bg-primary/10 rounded-lg transition-colors touch-target flex items-center justify-center"
                aria-label="Nova conversa"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Desktop new conversation button */}
              <button
                onClick={handleNewConversation}
                className="hidden lg:flex items-center gap-2 px-4 py-2 text-primary dark:text-[#7aa6ff] hover:bg-primary/5 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm">Nova conversa</span>
              </button>
            </div>
          </div>

          {/* Conversation List (Desktop) */}
          <div className="hidden lg:flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {isLoadingConversations ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400 dark:text-white/40" />
            ) : (
              conversations.slice(0, 5).map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-primary text-white dark:bg-[#1a4fd6]"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/[0.05] dark:text-white/80 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="max-w-[150px] truncate">
                    {conv.title || "Nova conversa"}
                  </span>
                </button>
              ))
            )}
          </div>
        </header>

        {/* Chat Area */}
        <main
          ref={chatContainerRef}
          onScroll={handleChatScroll}
          className="flex-1 p-4 sm:p-6 pb-6 overflow-y-auto"
          aria-label="Histórico de mensagens"
        >
          {/* Attachment Error */}
          {attachmentError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{attachmentError}</span>
            </div>
          )}

          {/* Welcome Message */}
          {displayMessages.length === 0 && !isLoadingMessages && !isStreaming && (
            <div className="flex items-start gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary dark:bg-[#1a4fd6] flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-white" strokeWidth={1.5} />
              </div>
              <div className="max-w-2xl">
                <p className="text-primary dark:text-[#7aa6ff] text-sm font-medium mb-1.5">
                  Assistente Jurídico
                </p>
                <div className="bg-gray-100 dark:bg-white/[0.04] dark:border dark:border-white/[0.06] rounded-xl rounded-tl-sm p-4">
                  <p className="text-sm text-gray-700 dark:text-white/85 whitespace-pre-wrap">
                    Olá! Sou o assistente jurídico da Juriscan. Como posso ajudá-lo hoje?
                    {"\n\n"}
                    Você pode me enviar um número de processo, texto descrevendo um caso,
                    ou fazer perguntas sobre legislação e jurisprudência.
                    {"\n\n"}
                    <span className="text-gray-500 dark:text-white/55">
                      💡 Agora você também pode enviar arquivos PDF, imagens de documentos
                      ou gravar mensagens de áudio!
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {isLoadingMessages ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-[#7aa6ff]" />
            </div>
          ) : (
            displayMessages
              .filter((m) => m.role === "USER" || m.content)
              .map((message) => (
                <ChatMessage
                  key={message.id}
                  type={message.role === "USER" ? "user" : "assistant"}
                  content={message.content}
                  timestamp={new Date(message.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  attachments={(message as { attachments?: ChatAttachment[] }).attachments}
                  creditsCost={(message as { credits_cost?: number | null }).credits_cost}
                  createdAt={message.created_at}
                  conversationTitle={currentConversationTitle}
                />
              ))
          )}

          {/* Typing Indicator */}
          {isWaiting && <TypingIndicator />}

          {/* Chat Error with Retry */}
          {chatError && (
            <div className="mb-4 mx-auto max-w-2xl p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{chatError}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={retry}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/15 hover:bg-red-200 dark:hover:bg-red-500/25 rounded-lg transition-colors"
                  >
                    Tentar novamente
                  </button>
                  <button
                    onClick={clearError}
                    className="px-3 py-1.5 text-sm text-gray-600 dark:text-white/65 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - categorized prompt picker */}
          {showSuggestions && (
            <div className="mx-auto max-w-4xl">
              <ChatEmptyState onSelectPrompt={handleFillInput} />
            </div>
          )}
        </main>

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white dark:bg-[#0f1923] border-t border-gray-200 dark:border-white/[0.08] p-3 sm:p-4">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {hasAttachments && (
              <ChatAttachmentPreview
                attachments={attachments}
                uploadProgress={uploadProgress}
                isUploading={isUploading}
                onRemove={removeAttachment}
                onTranscribe={transcribeAudio}
              />
            )}

            {/* Audio Recorder */}
            {isRecordingAudio ? (
              <div className="flex items-center justify-center py-2">
                <AudioRecorder
                  onRecordingComplete={handleAudioComplete}
                  onCancel={() => setIsRecordingAudio(false)}
                  disabled={isStreaming || isUploading}
                />
              </div>
            ) : (
              <div
                data-tour="chat-input"
                className={`flex items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] px-3 sm:px-4 py-2 focus-within:border-blue-500 dark:focus-within:border-[#1a4fd6] transition-colors ${
                  hasAttachments ? "rounded-b-full" : "rounded-full"
                }`}
              >
                {/* Attach Button with Dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAttachMenu(!showAttachMenu);
                    }}
                    disabled={isStreaming || isUploading}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-gray-600 dark:hover:text-white/80 disabled:opacity-50 transition-colors"
                    aria-label="Anexar arquivo"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Dropdown Menu */}
                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-[#1a2433] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.08] py-1 min-w-[180px]">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/[0.04] active:bg-gray-100"
                      >
                        <FileText className="w-5 h-5 text-amber-500" />
                        Documento
                      </button>
                      <button
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-white/85 hover:bg-gray-50 dark:hover:bg-white/[0.04] active:bg-gray-100"
                      >
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                        Imagem
                      </button>
                    </div>
                  )}
                </div>

                {/* Hidden File Inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,text/plain"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept=".jpg, .jpeg, .png, .gif, .webp"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Input Field */}
                <input
                  ref={inputRef}
                  id="chat-input-field"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Descreva o caso ou faça uma pergunta..."
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-base lg:text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-white/40"
                  disabled={isStreaming || isUploading}
                />

                {/* Tom de Resposta Selector — chip à esquerda do mic */}
                <TomDeRespostaSelector
                  tomAtual={tomAtual}
                  onChange={handleTomChange}
                  disabled={isStreaming || isUploading}
                />

                {/* Credit Balance */}
                <span className="text-xs text-gray-400 dark:text-white/45 hidden sm:block whitespace-nowrap">
                  {hasAttachments ? `${totalCost} créditos` : `${balance} créditos`}
                </span>

                {/* Audio Record Button */}
                <button
                  onClick={() => setIsRecordingAudio(true)}
                  disabled={isStreaming || isUploading}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-gray-400 dark:text-white/50 hover:text-purple-600 dark:hover:text-[#b794f4] hover:bg-purple-50 dark:hover:bg-[#7c3aed]/15 disabled:opacity-50 rounded-full transition-colors"
                  aria-label="Gravar áudio"
                  title="Gravar áudio"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={
                    (!inputValue.trim() && attachments.length === 0) ||
                    isStreaming ||
                    isUploading ||
                    balance < totalCost
                  }
                  className="w-11 h-11 bg-primary dark:bg-[#1a4fd6] hover:bg-primary-hover dark:hover:bg-[#1440b8] active:bg-primary-hover disabled:bg-gray-300 dark:disabled:bg-white/[0.08] rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  aria-label="Enviar mensagem"
                >
                  {isStreaming || isUploading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
                  )}
                </button>
              </div>
            )}

            {/* Legal Disclaimer */}
            <LegalDisclaimerInline />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ChatLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0f1923] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary dark:text-[#7aa6ff]" />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatContent />
    </Suspense>
  );
}
