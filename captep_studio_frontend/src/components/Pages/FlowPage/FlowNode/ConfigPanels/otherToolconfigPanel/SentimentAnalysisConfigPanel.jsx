import React, { useState } from 'react';
import { X, Heart, CheckCircle, Smile, Meh, Frown } from 'lucide-react';

export default function SentimentAnalysisConfigPanel({ node, onUpdate, onClose }) {
  const [toolName, setToolName] = useState(node?.data?.toolName || '');
  const [description, setDescription] = useState(node?.data?.description || '');

  const handleSave = () => {
    onUpdate({
      toolName: toolName.trim() || 'Sentiment Analysis',
      description: description.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          
          {/* Header */}
          <div className="flex justify-between items-center pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Heart className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Sentiment Analysis Tool</h2>
                <p className="text-sm text-gray-600">Analyze emotional tone of text</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tool Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tool Name
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="e.g. Sentiment Analysis, Emotion Detector"
              className="w-full px-4 py-2.5  text-sm border-1 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition hover:border-purple-300"
            />
            <p className="text-xs text-gray-500 mt-1">A descriptive name for this sentiment analysis tool</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Analyze the emotional tone and sentiment of text to determine if it's positive, neutral, or negative..."
              rows={2}
              className="w-full px-4 py-2.5 text-sm  border-1 border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 outline-none transition hover:border-purple-300"
            />
            <p className="text-xs text-gray-500 mt-1">Explain what this tool does and when the agent should use it</p>
          </div>

          {/* Explanation */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">How It Works</h3>
            <p className="text-xs text-purple-700 mb-4 leading-relaxed">
              This tool analyzes the emotional tone of any text. When a user sends a query, the agent automatically understands the request, performs sentiment analysis, and returns one of three emotional states to help understand the mood of the content.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                <Smile className="w-7 h-7 text-green-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-green-700 mb-1">Positive</p>
                <p className="text-xs text-green-600">Happy, optimistic</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-gray-200">
                <Meh className="w-7 h-7 text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-gray-700 mb-1">Neutral</p>
                <p className="text-xs text-gray-600">Balanced, factual</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                <Frown className="w-7 h-7 text-red-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-red-700 mb-1">Negative</p>
                <p className="text-xs text-red-600">Sad, frustrated</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${toolName.trim() ? 'bg-purple-500 animate-pulse' : 'bg-gray-400'}`} />
              {toolName.trim() ? 'Ready to configure' : 'Tool name required'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!toolName.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium shadow-md hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}