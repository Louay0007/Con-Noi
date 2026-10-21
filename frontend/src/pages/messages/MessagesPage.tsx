import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Loader2, Send, Paperclip, ChevronLeft, MoreVertical,
  XCircle, Check, CheckCheck, MessageSquare, Plus, Search,
} from "lucide-react";
import { api, type SafeUser } from "@/lib/api";

type Thread = {
  _id: string;
  participants: Array<{ id: string; fullName: string; avatarUrl?: string }>;
  lastMessage?: { body: string; createdAt: string; senderId: string };
  unreadCount: number;
  context?: string;
  isClosed: boolean;
  updatedAt: string;
};

type Message = {
  _id: string;
  senderId: string;
  body: string;
  attachmentFileIds: string[];
  readBy: string[];
  createdAt: string;
};

const CONTEXT_LABELS: Record<string, string> = {
  application: "Candidatura",
  direct: "Diretto",
  admin: "Admin",
};

function formatTime(d: string): string {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Adesso";
  if (diffMins < 60) return `${diffMins}m fa`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h fa`;
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const initialThreadId = searchParams.get("thread");

  const [user, setUser] = useState<SafeUser | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgCursor, setMsgCursor] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(!!initialThreadId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load user + threads
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, th] = await Promise.all([api.getMe(), api.getThreads()]);
        if (!cancelled) {
          setUser(me);
          setThreads(th);
        }
      } catch {}
      finally { if (!cancelled) setLoadingThreads(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load messages when active thread changes
  const loadMessages = useCallback(async (threadId: string, cursor?: string, append = false) => {
    if (!cursor) setLoadingMessages(true);
    try {
      const result = await api.getMessages(threadId, cursor, 50);
      if (append) {
        setMessages((prev) => [...result.items.reverse(), ...prev]);
      } else {
        setMessages(result.items.reverse());
      }
      setMsgCursor(result.nextCursor);
      // Mark as read
      api.markThreadRead(threadId).catch(() => {});
    } catch {}
    finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    if (activeThreadId) {
      loadMessages(activeThreadId);
      setShowMobileChat(true);
    }
  }, [activeThreadId, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!activeThreadId || !inputText.trim() || sending) return;
    const text = inputText.trim();
    setInputText("");
    setSending(true);

    // Optimistic local message
    const optimisticMsg: Message = {
      _id: `opt-${Date.now()}`,
      senderId: user?.id || "",
      body: text,
      attachmentFileIds: [],
      readBy: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await api.sendMessage(activeThreadId, { body: text });
      // Replace optimistic with real or just keep it
    } catch {
      // Could revert optimistic message here
    } finally {
      setSending(false);
    }
  };

  const handleCloseThread = async () => {
    if (!activeThreadId) return;
    try {
      await api.closeThread(activeThreadId);
      setThreads((prev) => prev.map((t) => t._id === activeThreadId ? { ...t, isClosed: true } : t));
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherParticipant = (thread: Thread) =>
    thread.participants.find((p) => p.id !== user?.id) || thread.participants[0];

  if (loadingThreads) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="size-8 animate-spin text-[#0F4C81]" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#F8F9FA]">
      {/* Thread List (left panel / main on mobile) */}
      <aside className={`flex w-full flex-col border-r border-[#E5E7EB] bg-white md:w-[340px] md:flex ${showMobileChat ? "hidden" : "flex"}`}>
        <div className="border-b border-[#E5E7EB] px-4 py-4">
          <h1 className="text-lg font-bold text-[#1A1A1A]">Messaggi</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <MessageSquare className="mx-auto mb-3 size-10 text-[#6B7280]" />
              <p className="text-sm text-[#6B7280]">Nessuna conversazione</p>
            </div>
          ) : (
            threads.map((thread) => {
              const other = otherParticipant(thread);
              const isActive = thread._id === activeThreadId;
              return (
                <button
                  key={thread._id}
                  onClick={() => { setActiveThreadId(thread._id); setShowMobileChat(true); }}
                  className={`flex w-full items-start gap-3 border-b border-[#E5E7EB] px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-[#0F4C81]/5" : "hover:bg-[#F8F9FA]"
                  } ${thread.isClosed ? "opacity-50" : ""}`}
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0F4C81]/10 text-sm font-bold text-[#0F4C81]">
                    {other?.fullName?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#1A1A1A]">{other?.fullName}</span>
                      <span className="shrink-0 text-[10px] text-[#6B7280]">
                        {thread.lastMessage ? formatTime(thread.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#6B7280]">
                      {thread.lastMessage?.body || "Nessun messaggio"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {thread.context && (
                        <span className="rounded bg-[#F8F9FA] px-1.5 py-0.5 text-[10px] font-medium text-[#6B7280]">
                          {CONTEXT_LABELS[thread.context] || thread.context}
                        </span>
                      )}
                      {thread.unreadCount > 0 && (
                        <span className="flex size-4 items-center justify-center rounded-full bg-[#0F4C81] text-[9px] font-bold text-white">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Conversation View (right panel / drill-down on mobile) */}
      <main className={`flex flex-1 flex-col bg-white ${showMobileChat ? "flex" : "hidden md:flex"}`}>
        {activeThreadId ? (
          <>
            {/* Header */}
            <header className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMobileChat(false)}
                  className="rounded-md p-1 text-[#6B7280] hover:bg-[#F8F9FA] md:hidden"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <div>
                  <p className="text-sm font-bold text-[#1A1A1A]">
                    {otherParticipant(threads.find((t) => t._id === activeThreadId)!)?.fullName}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {threads.find((t) => t._id === activeThreadId)?.isClosed ? "Conversazione chiusa" : "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCloseThread}
                  className="rounded-md p-2 text-[#6B7280] hover:bg-[#DC2626]/10 hover:text-[#DC2626]"
                  title="Chiudi conversazione"
                >
                  <XCircle className="size-4" />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-[#0F4C81]" />
                </div>
              ) : (
                <div className="space-y-3">
                  {msgCursor && (
                    <button
                      onClick={() => loadMessages(activeThreadId, msgCursor, true)}
                      className="w-full py-2 text-center text-xs font-medium text-[#0F4C81] hover:underline"
                    >
                      Carica messaggi precedenti
                    </button>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.senderId === user?.id;
                    const isRead = msg.readBy.length > 1;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? "rounded-br-md bg-[#0F4C81] text-white"
                              : "rounded-bl-md bg-[#F8F9FA] text-[#1A1A1A]"
                          }`}
                        >
                          {msg.body}
                          {msg.attachmentFileIds.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.attachmentFileIds.map((fid) => (
                                <a
                                  key={fid}
                                  href={`/api/files/download/${fid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
                                    isMine ? "bg-white/20 text-white" : "bg-[#E5E7EB] text-[#1A1A1A]"
                                  }`}
                                >
                                  <Paperclip className="size-3" /> Allegato
                                </a>
                              ))}
                            </div>
                          )}
                          <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMine ? "text-white/70" : "text-[#6B7280]"}`}>
                            {new Date(msg.createdAt).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                            {isMine && (
                              isRead ? <CheckCheck className="size-3" /> : <Check className="size-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input bar */}
            {!threads.find((t) => t._id === activeThreadId)?.isClosed && (
              <div className="border-t border-[#E5E7EB] px-4 py-3">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scrivi un messaggio…"
                    rows={1}
                    className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#6B7280] focus:border-[#0F4C81] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim() || sending}
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0F4C81] text-white transition-colors hover:bg-[#0a3d6b] disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-right text-[10px] text-[#6B7280]">
                  30 messaggi/minuto
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="mb-4 size-12 text-[#6B7280]" />
            <p className="text-sm font-medium text-[#1A1A1A]">Seleziona una conversazione</p>
            <p className="mt-1 text-xs text-[#6B7280]">Scegli un thread dalla lista per iniziare a chattare</p>
          </div>
        )}
      </main>
    </div>
  );
}