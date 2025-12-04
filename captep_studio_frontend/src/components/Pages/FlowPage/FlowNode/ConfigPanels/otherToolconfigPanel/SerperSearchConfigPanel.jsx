// src/components/Pages/FlowPage/FlowNode/ConfigPanels/otherToolconfigPanel/SerperSearchConfigPanel.jsx
import React, { useState } from 'react';
import { X, Search, CheckCircle, KeyRound, Info } from 'lucide-react';

export default function SerperSearchConfigPanel({ node, onUpdate, onClose }) {
  const [toolName, setToolName] = useState(node?.data?.toolName || 'Google Search');
  const [description, setDescription] = useState(node?.data?.description || 'Search the web using Google Search API');
  const [apiKey, setApiKey] = useState(node?.data?.serperApiKey || ''); // ← Correct key
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSave = () => {
    onUpdate({
      toolName: toolName.trim() || 'Google Search',
      description: description.trim() || 'Search the web using Google Search API',
      serperApiKey: apiKey.trim(), // ← Store in correct field
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Serper Search Tool</h2>
                <p className="text-sm text-gray-600">Configure Google Search API</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">About Serper Search</h3>
                <p className="text-xs text-blue-700">
                  Get your free API key from{' '}
                  <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    serper.dev
                  </a>{' '}
                  (2,500 free searches)
                </p>
              </div>
            </div>
          </div>

          {/* Tool Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool Name</label>
            <input
              type="text"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              placeholder="e.g. Google Search"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <KeyRound className="w-4 h-4" />
              Serper API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-2.5 pr-20 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-gray-200 rounded"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button onClick={onClose} className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}