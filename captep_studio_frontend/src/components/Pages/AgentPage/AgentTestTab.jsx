import React, { useState } from "react";
import {
    X,
    Send,
    Maximize2,
    Minimize2,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    MoreHorizontal,
    Paperclip,
} from "lucide-react";

const AgentTestTab = ({ agent, onClose, isExpanded, setIsExpanded }) => {
    const [testInput, setTestInput] = useState("");
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            type: "bot",
            text: `👋 Hi! I'm ${agent?.name || "Agent"}. You can ask me anything. I might use AI to help answer your questions.`,
            time: "Today",
        },
    ]);
    const [loading, setLoading] = useState(false);

    // 🧠 Send message to backend
    const handleSendMessage = async () => {
        if (!testInput.trim()) return;

        const userMsg = {
            id: chatMessages.length + 1,
            type: "user",
            text: testInput,
            time: new Date().toLocaleTimeString(),
        };
        setChatMessages((prev) => [...prev, userMsg]);
        setTestInput("");
        setLoading(true);

        try {
            const res = await fetch("http://Aakash:5000/agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: testInput }),
            });
            console.log("Response status:   ------- >>>> ", res);

            const data = await res.json();
            console.log("Response data:   ------- >>>> ", data);

            const botReply = {
                id: chatMessages.length + 2,
                type: "bot",
                text: data?.response|| "🤖 No response received.",
                time: new Date().toLocaleTimeString(),
            };
            setChatMessages((prev) => [...prev, botReply]);
        } catch (err) {
            console.error("Error sending message:", err);
            setChatMessages((prev) => [
                ...prev,
                {
                    id: chatMessages.length + 2,
                    type: "bot",
                    text: "⚠️ Server not reachable. Try again later.",
                    time: new Date().toLocaleTimeString(),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shadow-md ${isExpanded ? "w-[40vw]" : "w-[28rem]"
                }`}
        >
            {/* 🔹 Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
                <h3 className="text-sm font-semibold text-gray-900">
                    Test your agent
                </h3>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => setChatMessages([chatMessages[0]])}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded"
                        title="Reset chat"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded"
                        title="More options"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded"
                        title={isExpanded ? "Minimize" : "Maximize"}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Maximize2 className="w-4 h-4" />
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* 🔹 Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="space-y-4">
                    {chatMessages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex flex-col ${msg.type === "user" ? "items-end" : "items-start"
                                }`}
                        >
                            <div
                                className={`rounded-lg p-3 shadow-sm max-w-[80%] ${msg.type === "user"
                                        ? "bg-blue-600 text-white"
                                        : "bg-white border border-gray-100 text-gray-800"
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                {msg.type === "bot" && (
                                    <div className="flex items-center space-x-2 mt-2">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <ThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-start">
                            <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm text-sm text-gray-400 italic">
                                Agent is typing...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 🔹 Input Field */}
            <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        placeholder="Ask a question..."
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded"
                        title="Attach file"
                    >
                        <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSendMessage}
                        disabled={!testInput.trim() || loading}
                        className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        title="Send message"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AgentTestTab;
