"use client";

import { Scale, Coins } from "lucide-react";
import { MarkdownRenderer } from "./Chat/MarkdownRenderer";
import type { ChatAttachment } from "@/types/chat";
import {
  ChatFileMessage,
  ChatImageMessage,
  ChatAudioMessage,
  MessageExportMenu,
} from "./Chat";

interface ChatMessageProps {
  type: "assistant" | "user";
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  creditsCost?: number | null;
  /** ISO date para a exportação da mensagem (apenas assistente). */
  createdAt?: string;
  /** Título da conversa, usado como hint do nome do arquivo exportado. */
  conversationTitle?: string | null;
}

function CreditBadge({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 dark:text-white/45">
      <Coins className="w-3 h-3" />
      {cost}
    </span>
  );
}

// Renderizar attachment baseado no tipo
function renderAttachment(attachment: ChatAttachment) {
  switch (attachment.type) {
    case "file":
      return <ChatFileMessage key={attachment.id} attachment={attachment} />;
    case "image":
      return <ChatImageMessage key={attachment.id} attachment={attachment} />;
    case "audio":
      return <ChatAudioMessage key={attachment.id} attachment={attachment} />;
    default:
      return null;
  }
}

export default function ChatMessage({
  type,
  content,
  timestamp,
  attachments = [],
  creditsCost,
  createdAt,
  conversationTitle,
}: ChatMessageProps) {
  const hasAttachments = attachments.length > 0;

  if (type === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[90%] sm:max-w-[75%]">
          {/* Attachments */}
          {hasAttachments && (
            <div className="flex flex-wrap gap-2 mb-2 justify-end">
              {attachments.map((att) => renderAttachment(att))}
            </div>
          )}

          {/* Conteúdo de texto — usuário sempre texto simples */}
          {content && (
            <div className="bg-primary dark:bg-[#1a4fd6] text-white rounded-xl rounded-tr-sm p-3 sm:p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {content}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 justify-end">
            <p className="text-xs text-gray-400 dark:text-white/45">{timestamp}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-primary dark:bg-[#1a4fd6] flex items-center justify-center flex-shrink-0">
        <Scale className="w-4 h-4 text-white" strokeWidth={1.5} />
      </div>
      <div className="max-w-[90%] sm:max-w-[75%]">
        <p className="text-primary dark:text-[#7aa6ff] text-sm font-medium mb-1.5">
          Assistente Jurídico
        </p>
        <div className="bg-gray-100 dark:bg-white/[0.04] dark:border dark:border-white/[0.06] rounded-xl rounded-tl-sm p-3 sm:p-4 max-w-none break-words">
          {/* Markdown renderizado para respostas da IA */}
          <MarkdownRenderer content={content} />

          {/* Attachments na resposta do assistente (raro, mas possível) */}
          {hasAttachments && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/[0.08]">
              {attachments.map((att) => renderAttachment(att))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <p className="text-xs text-gray-400 dark:text-white/45">{timestamp}</p>
          {creditsCost != null && creditsCost > 0 && <CreditBadge cost={creditsCost} />}
          {content && createdAt && (
            <MessageExportMenu
              message={{
                content,
                createdAt,
                conversationTitle: conversationTitle ?? null,
              }}
              filenameHint={conversationTitle ?? "resposta"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
