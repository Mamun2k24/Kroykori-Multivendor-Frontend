import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Send, RefreshCcw, XCircle, MessageCircle } from "lucide-react";
import { useUser } from "../../hooks/userContext";

const API_BASE = import.meta.env.VITE_APP_SERVER_URL?.replace(/\/$/, "");

const socket = io(API_BASE, {
  transports: ["websocket"],
  withCredentials: true,
});

const formatTime = (date) =>
  new Date(date).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminChatInbox() {
  const { user } = useUser() || {};

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/chat/conversations`);
      const data = await res.json();
      setConversations(data?.conversations || []);

      if (!activeConv && data?.conversations?.length > 0) {
        setActiveConv(data.conversations[0]);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/api/chat/messages/${conversationId}`);
      const data = await res.json();

      setMessages(data?.messages || []);
      socket.emit("joinConversation", conversationId);

      await fetch(`${API_BASE}/api/chat/read/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reader: "admin" }),
      });
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    socket.emit("joinAdminRoom");

    socket.on("adminNewMessage", () => {
      fetchConversations();
    });

    socket.on("receiveMessage", (msg) => {
      if (String(msg.conversation) === String(activeConv?._id)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      fetchConversations();
    });

    return () => {
      socket.off("adminNewMessage");
      socket.off("receiveMessage");
    };
  }, [activeConv?._id]);

  useEffect(() => {
    if (activeConv?._id) fetchMessages(activeConv._id);
  }, [activeConv?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendAdminReply = async (e) => {
    e.preventDefault();

    if (!activeConv?._id || !reply.trim()) return;

    const text = reply.trim();
    setReply("");

    try {
      await fetch(`${API_BASE}/api/chat/message/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConv._id,
          message: text,
          adminId: user?.id || null,
        }),
      });

      fetchConversations();
    } catch (error) {
      console.error("Send admin reply error:", error);
    }
  };

  const closeConversation = async () => {
    if (!activeConv?._id) return;

    try {
      await fetch(`${API_BASE}/api/chat/close/${activeConv._id}`, {
        method: "PATCH",
      });

      setActiveConv(null);
      setMessages([]);
      fetchConversations();
    } catch (error) {
      console.error("Close conversation error:", error);
    }
  };

  const quickReply = (text) => {
    setReply(text);
  };
  
  const deleteConversation = async () => {
  if (!activeConv?._id) return;
  if (!confirm("Delete this chat permanently?")) return;

  await fetch(`${API_BASE}/api/chat/conversation/${activeConv._id}`, {
    method: "DELETE",
  });

  setActiveConv(null);
  setMessages([]);
  fetchConversations();
};

  return (
    <div className="p-3 md:p-5 h-[calc(100vh-80px)] overflow-hidden">
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">
            Customer Chat
          </h1>
          <p className="text-sm text-slate-500">
            Live support, quick replies and customer messages
          </p>
        </div>

        <button
          onClick={fetchConversations}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          <RefreshCcw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100%-76px)] min-h-0">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="p-4 border-b border-slate-100 shrink-0">
            <h2 className="font-bold text-slate-800">Inbox</h2>
            <p className="text-xs text-slate-500">
              {conversations.length} conversation
            </p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No conversation found
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-4 border-b border-slate-100 hover:bg-indigo-50/50 transition ${
                    activeConv?._id === conv._id ? "bg-indigo-50" : "bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">
                        {conv?.user?.name || conv.customerName || "Guest User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.customerMobile ||
                          conv?.user?.mobile ||
                          conv.customerEmail ||
                          conv?.user?.email ||
                          conv.guestId}
                      </p>
                    </div>

                    {conv.unreadForAdmin > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold">
                        {conv.unreadForAdmin}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 truncate">
                    {conv.lastMessage || "No message yet"}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span
                      className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        conv.status === "closed"
                          ? "bg-slate-100 text-slate-500"
                          : conv.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {conv.status}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {formatTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
          {!activeConv ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-14 h-14 rounded-full bg-indigo-50 mx-auto flex items-center justify-center text-indigo-600">
                  <MessageCircle />
                </div>
                <h3 className="mt-3 font-bold text-slate-800">
                  Select a conversation
                </h3>
                <p className="text-sm text-slate-500">
                  Choose a customer from inbox to start replying
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-800 truncate">
                    {activeConv?.user?.name ||
                      activeConv.customerName ||
                      "Guest User"}
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    {activeConv.customerMobile ||
                      activeConv?.user?.mobile ||
                      activeConv.customerEmail ||
                      activeConv?.user?.email ||
                      "No contact info"}
                  </p>
                </div>

              <div className="flex items-center gap-2 shrink-0">
  <button
    onClick={deleteConversation}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
  >
    Delete
  </button>

  <button
    onClick={closeConversation}
    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100"
  >
    <XCircle size={16} />
    Close
  </button>
</div>
              </div>

              <div className="flex-1 min-h-0 p-4 bg-slate-50 overflow-y-auto space-y-3">
                {loading ? (
                  <p className="text-center text-sm text-slate-400">
                    Loading messages...
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === "admin";
                    const isUser = msg.sender === "user";

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${
                          isAdmin ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed break-words ${
                            isAdmin
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : isUser
                              ? "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                              : "bg-amber-50 text-slate-800 border border-amber-100 rounded-tl-none"
                          }`}
                        >
                          {msg.messageType === "image" ? (
                            <a
                              href={msg.attachment?.url || msg.message}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={msg.attachment?.url || msg.message}
                                alt="chat attachment"
                                className="max-w-[220px] max-h-[260px] object-cover rounded-xl border border-slate-200"
                              />
                            </a>
                          ) : (
                            <p>{msg.message}</p>
                          )}

                          <p
                            className={`text-[10px] mt-1 ${
                              isAdmin ? "text-indigo-100" : "text-slate-400"
                            }`}
                          >
                            {msg.sender} • {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                <div className="flex flex-wrap gap-2 mb-3 max-h-[74px] overflow-y-auto pr-1">
                  {[
                    "আপনার order ID দিন।",
                    "আপনার সমস্যাটি একটু বিস্তারিত বলুন।",
                    "আমরা বিষয়টি check করে জানাচ্ছি।",
                    "ধন্যবাদ, আপনার সমস্যাটি resolve করা হয়েছে।",
                  ].map((text) => (
                    <button
                      key={text}
                      onClick={() => quickReply(text)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 text-xs font-semibold text-slate-600 hover:text-indigo-700"
                    >
                      {text}
                    </button>
                  ))}
                </div>

                <form onSubmit={sendAdminReply} className="flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type reply..."
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shrink-0"
                  >
                    <Send size={16} />
                    Send
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}