import React, { useState, useEffect, useRef } from 'react';
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
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

import { useCancelAgentSetupMutation } from '../../../redux/services/workflowServices'

const TestTab = ({
  onClose,
  workflowId,
  useTriggerAgentSetupMutation,
  useRunAgentQueryMutation,
}) => {
  const [triggerSetup, { isLoading: isSetupLoading }] = useTriggerAgentSetupMutation();
  const [runQuery, { isLoading: isQueryLoading }] = useRunAgentQueryMutation();
  const [cancelSetup, { isLoading: isCancelLoading }] = useCancelAgentSetupMutation();


  const [isExpanded, setIsExpanded] = useState(false);
  const [testInput, setTestInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatQureyPort, setchatQureyPort] = useState()
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('idle');
  const chatEndRef = useRef(null);

  // ✅ FIX: Prevent duplicate calls using ref
  const setupTriggeredRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ✅ FIX: Only trigger setup once
  useEffect(() => {
    if (!setupTriggeredRef.current) {
      setupTriggeredRef.current = true;
      handleTriggerSetup();
    }
  }, []); // Empty dependency array

  const handleTriggerSetup = async () => {
    try {
      setCurrentStatus('setup');
      setSetupError(null);
      setChatMessages([]);

      console.log('🔄 Triggering setup for workflow:', workflowId);

      const response = await triggerSetup({ id: workflowId }).unwrap();

      console.log("Test Processing Response----->", response);

      if (response?.data?.port) {
        setchatQureyPort(response?.data?.port);
        console.log("chat Qurey port---->>", chatQureyPort);
      }


      setSetupComplete(true);
      setCurrentStatus('ready');

      setChatMessages([
        {
          id: 1,
          type: 'bot',
          text: '👋 Hi! I\'m your AI Agent. Before you ask me anything, please provide your Email Id 📥📥📥',
          time: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error('❌ Setup failed:', error);
      setSetupError(error?.data?.message || 'Failed to setup agent');
      setCurrentStatus('idle');
      setupTriggeredRef.current = false; // Allow retry

      setChatMessages([
        {
          id: 1,
          type: 'error',
          text: `⚠️ Setup failed: ${error?.data?.message || 'Unknown error'}. Please try again.`,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!testInput.trim() || !setupComplete) return;

    const userMsg = {
      id: chatMessages.length + 1,
      type: 'user',
      text: testInput,
      time: new Date().toLocaleTimeString(),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setTestInput('');
    setCurrentStatus('querying');

    console.log("run Qurey data--->", "port:", chatQureyPort,
      "query:", testInput)

      const cleanMarkdown = (text = "") => {
        return text
          .replace(/\*\*(.*?)\*\*/g, "$1") // remove **bold**
          .replace(/#+\s?(.*)/g, "$1") // remove headings
          .replace(/-{3,}/g, "") // remove ---
          .replace(/\*(.*?)\*/g, "$1") // remove *italic*
          .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // remove inline code
          .replace(/\n{2,}/g, "\n") // limit line breaks
          .trim();
      };

      try {
        const rawReply = await runQuery({
          port: chatQureyPort,
          query: testInput,
        }).unwrap();
    
        console.log('✅ Query Response:', rawReply);
    
        // If you want clean text without **markdown**, use:
        const botReply = {
          id: chatMessages.length + 2,
          type: 'bot',
          text: cleanMarkdown(rawReply?.data?.result|| '🤖 Response received.'),
          time: new Date().toLocaleTimeString(),
        };
        
      setChatMessages((prev) => [...prev, botReply]);
      setCurrentStatus('ready');
    } catch (error) {
      console.error('❌ Query failed:', error);

      const errorMsg = {
        id: chatMessages.length + 2,
        type: 'error',
        text: `⚠️ Error: ${error?.data?.message || 'Failed to process your query. Please try again.'}`,
        time: new Date().toLocaleTimeString(),
      };

      setChatMessages((prev) => [...prev, errorMsg]);
      setCurrentStatus('ready');
    }
  };

  const handleReset = () => {
    setChatMessages([
      {
        id: 1,
        type: 'bot',
        text: '👋 Hi! I\'m your AI Agent. Before you ask me anything, please provide your Email Id 📥📥📥',
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // ✅ FIX: Manual retry resets the ref
  const handleRetrySetup = () => {
    setupTriggeredRef.current = false;
    handleTriggerSetup();
  };

  const handleCloseTestPanel = async () => {
    console.log("closing Test Tab");
    setCurrentStatus("closing");

    try {
      console.log("starting agent  clear!..")
      const response = await cancelSetup({ id: workflowId }).unwrap();
      console.log("Cancel Agent Response ---->> ", response);

      setCurrentStatus("closed");
      onClose();

    } catch (error) {
      console.error("❌ Cancel Agent Setup failed:", error);

      // ⚠️ reset status if error occurs
      setCurrentStatus("ready");
    }
  };

  return (
    <div
      className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 shadow-md ${isExpanded ? 'w-[40vw]' : 'w-[28rem]'
        }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-gray-900">Test your agent</h3>
          <div className="flex items-center gap-2 text-xs mt-1">
            {currentStatus === 'setup' && (
              <>
                <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                <span className="text-blue-600">Setting up agent...</span>
              </>
            )}
            {currentStatus === 'closing' && (
              <>
                <Loader2 className="w-3 h-3 text-gray-600 animate-spin" />
                <span className="text-gray-600">Closing test panel...</span>
              </>
            )}
            {currentStatus === 'ready' && (
              <>
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span className="text-green-600">Agent ready</span>
              </>
            )}
            {currentStatus === 'querying' && (
              <>
                <Loader2 className="w-3 h-3 text-purple-600 animate-spin" />
                <span className="text-purple-600">Processing...</span>
              </>
            )}
            {setupError && (
              <>
                <AlertCircle className="w-3 h-3 text-red-600" />
                <span className="text-red-600">Setup failed</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleReset}
            disabled={!setupComplete}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleCloseTestPanel}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflow ID Info */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <p className="text-xs text-gray-500">
          Workflow ID: <span className="font-mono">{workflowId.substring(0, 25)}...</span>
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {currentStatus === 'setup' && chatMessages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Initializing agent...</p>
                <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          )}

          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`rounded-lg p-3 shadow-sm max-w-[80%] ${msg.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.type === 'error'
                    ? 'bg-red-50 border border-red-200 text-red-800'
                    : 'bg-white border border-gray-100 text-gray-800'
                  }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                {msg.type === 'bot' && (
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

          {isQueryLoading && (
            <div className="flex items-start">
              <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="italic">Agent is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Retry Setup Button */}
      {setupError && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <button
            onClick={handleRetrySetup}
            disabled={isSetupLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            {isSetupLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Retry Setup
              </>
            )}
          </button>
        </div>
      )}

      {/* Input Field */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={
              setupComplete
                ? 'Ask a question...'
                : 'Waiting for agent setup...'
            }
            disabled={!setupComplete || isQueryLoading}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
            disabled={!setupComplete}
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!testInput.trim() || isQueryLoading || !setupComplete}
            className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            {isQueryLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default TestTab;
