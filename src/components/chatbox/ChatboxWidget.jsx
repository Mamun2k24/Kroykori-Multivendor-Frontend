import React, { useEffect, useRef, useState } from "react";
import {
  Paperclip,
  Send,
  MoreVertical,
  Box,
  RotateCcw,
  CreditCard,
  Headphones,
  Sparkles,
  MessageCircle,
  X,
} from "lucide-react";
import { io } from "socket.io-client";
import { useUser } from "../../hooks/userContext";

const API_BASE = import.meta.env.VITE_APP_SERVER_URL?.replace(/\/$/, "");

const socket = io(API_BASE, {
  transports: ["websocket"],
  withCredentials: true,
});

const quickButtons = [
  { key: "track_order", label: "Track my order", icon: Box },
  { key: "return_product", label: "Return a product", icon: RotateCcw },
  { key: "refund_status", label: "Refund status", icon: CreditCard },
  { key: "talk_support", label: "Live support", icon: Headphones },
];

const getGuestId = () => {
  let guestId = localStorage.getItem("chat_guest_id");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("chat_guest_id", guestId);
  }
  return guestId;
};

const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ChatboxWidget() {
  const { user } = useUser() || {};

  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/chat/conversation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user?.id || null,
            guestId: user?.id ? null : getGuestId(),
            customerName: user?.name || "Guest User",
            customerEmail: user?.email || null,
            customerMobile: user?.mobile || null,
          }),
        });

        const data = await res.json();

        if (data?.conversation?._id) {
          setConversationId(data.conversation._id);
          socket.emit("joinConversation", data.conversation._id);

          const msgRes = await fetch(
            `${API_BASE}/api/chat/messages/${data.conversation._id}`
          );

          const msgData = await msgRes.json();
          setMessages(msgData?.messages || []);
        }
      } catch (error) {
        console.error("Chat init error:", error);
      }
    };

    initChat();
  }, [user?.id]);

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const sendMessage = async (text, quickKey = null) => {
    if (!conversationId || uploading) return;

    const finalText = text?.trim();
    if (!finalText && !quickKey) return;

    setInput("");

    try {
      await fetch(`${API_BASE}/api/chat/message/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          message: finalText,
          quickKey,
          userId: user?.id || null,
        }),
      });
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const uploadImage = async (file) => {
    if (!conversationId || !file) return;

    if (!file.type.startsWith("image/")) {
      alert("Only image file allowed");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("conversationId", conversationId);
    formData.append("sender", "user");
    formData.append("userId", user?.id || "");

    try {
      setUploading(true);

      await fetch(`${API_BASE}/api/chat/upload-image`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#4f46e5] hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 group animate-bounce"
        >
          <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="w-[360px] sm:w-[420px] bg-white rounded-[24px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[580px] transition-all duration-300 transform scale-100 origin-bottom-right">
          <div className="bg-[#4f46e5] p-4 flex items-center justify-between text-white shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-400 shadow-inner">
                <span className="text-xl">🤖</span>
              </div>

              <div className="leading-tight">
                <h3 className="font-bold text-sm tracking-wide">Nova</h3>
                <p className="text-[11px] text-indigo-200 font-medium">
                  AI Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-white/90">
              <div className="flex items-center gap-1.5 bg-black/10 px-2.5 py-1 rounded-full border border-white/10 mr-1">
                <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold tracking-wide">
                  Online
                </span>
              </div>

              <button className="hover:text-white transition-colors p-1">
                <MoreVertical className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 space-y-4 text-xs">
            {messages.map((msg) =>
              msg.sender === "user" ? (
                <div key={msg._id} className="flex justify-end">
                  <div className="max-w-[80%] flex flex-col items-end">
                    <div className="bg-[#4f46e5] text-white p-3 rounded-2xl rounded-tr-none shadow-md leading-relaxed font-medium relative">
                      {msg.messageType === "image" ? (
                        <img
                          src={msg.attachment?.url || msg.message}
                          alt="chat attachment"
                          className="max-w-[180px] rounded-xl border border-indigo-200"
                        />
                      ) : (
                        msg.message
                      )}

                      <div className="text-[9px] text-indigo-200 text-right mt-1 flex items-center justify-end gap-1 font-sans">
                        <span>{formatTime(msg.createdAt)}</span>
                        <span className="text-emerald-300 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div key={msg._id} className="flex gap-2.5 max-w-[85%]">
                  <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-200 shrink-0">
                    <span className="text-sm">🤖</span>
                  </div>

                  <div>
                    <div className="bg-white text-slate-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 leading-relaxed font-medium">
                      {msg.messageType === "image" ? (
                        <a
                          href={msg.attachment?.url || msg.message}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={msg.attachment?.url || msg.message}
                            alt="chat attachment"
                            className="max-w-[180px] rounded-xl border border-slate-200"
                          />
                        </a>
                      ) : (
                        msg.message
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium ml-1 mt-1 block">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                </div>
              )
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 max-w-[95%] mx-auto">
              {quickButtons.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => sendMessage(label, key)}
                  disabled={uploading}
                  className="flex items-center gap-2 bg-white hover:bg-indigo-50/50 border border-indigo-100 text-indigo-600 px-3 py-2.5 rounded-xl font-bold transition-all shadow-sm group disabled:opacity-50"
                >
                  <Icon className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-50 shrink-0 space-y-3">
            <form onSubmit={handleSubmit}>
              <div className="relative flex items-center bg-slate-50 border border-slate-200/80 rounded-full px-4 py-1.5 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-inner">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    uploading ? "Uploading image..." : "Type your message..."
                  }
                  disabled={uploading}
                  className="w-full bg-transparent outline-none text-slate-700 placeholder-slate-400 text-xs font-medium py-1.5 pr-16 disabled:opacity-60"
                />

                <div className="absolute right-2 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file);
                      e.target.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-7 h-7 rounded-full bg-[#4f46e5] hover:bg-indigo-700 text-white flex items-center justify-center shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 tracking-wide pt-0.5">
              <Sparkles className="w-3 h-3 text-indigo-400 fill-current" />
              <span>
                Powered by <span className="text-slate-500">Nova AI</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}