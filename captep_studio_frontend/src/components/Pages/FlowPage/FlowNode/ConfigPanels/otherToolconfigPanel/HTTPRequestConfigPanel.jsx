import React, { useState } from 'react';
import { X, Plus, Trash2, Globe, ChevronDown, Code, CheckCircle, Info, Search } from 'lucide-react';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const BODY_TYPES = ['none', 'form-data', 'raw'];

const COMMON_HEADERS = [
  {
    category: '⚙️ Basic API Communication',
    headers: [
      { key: 'Content-Type', value: 'application/json', description: 'Tells server what type of content is being sent' },
      { key: 'Accept', value: 'application/json', description: 'Ask server to send JSON response' },
      { key: 'Content-Length', value: 'auto', description: 'Auto-calculated by client' },
      { key: 'Host', value: 'localhost:8000', description: 'Auto-filled — request host' },
      { key: 'User-Agent', value: 'CustomClient/1.0', description: 'Identifies client making request' },
      { key: 'Connection', value: 'keep-alive', description: 'Keeps TCP connection open' },
      { key: 'Cache-Control', value: 'no-cache', description: 'Avoids caching old responses' },
      { key: 'Accept-Encoding', value: 'gzip, deflate, br', description: 'Compression type' },
      { key: 'Accept-Language', value: 'en-US,en;q=0.9', description: 'Language preferences' }
    ]
  },
  {
    category: '🔐 Authentication & Security',
    headers: [
      { key: 'Authorization', value: 'Bearer {{token}}', description: 'JWT or OAuth 2.0 bearer token' },
      { key: 'x-api-key', value: 'abcd1234', description: 'Custom API key for authentication' },
      { key: 'api-key', value: 'xyz-12345', description: 'Alternate naming for API key' },
      { key: 'X-Auth-Token', value: 'token_98765', description: 'Custom header token' },
      { key: 'X-Requested-With', value: 'XMLHttpRequest', description: 'Identifies AJAX request' }
    ]
  },
  {
    category: '💾 CORS Headers',
    headers: [
      { key: 'Origin', value: 'http://localhost:3000', description: 'Source of the request' },
      { key: 'Referer', value: 'http://localhost:3000/', description: 'Page where request came from' },
      { key: 'Access-Control-Allow-Origin', value: '*', description: 'Used in CORS setup' },
      { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization', description: 'Which headers allowed for CORS' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS', description: 'Allowed HTTP methods' }
    ]
  },
  {
    category: '🧰 Custom App Headers',
    headers: [
      { key: 'X-Client-Version', value: '1.0.0', description: 'Version of your frontend client' },
      { key: 'X-App-Name', value: 'AgenticAI', description: 'Identify which app making call' },
      { key: 'X-Env', value: 'development', description: 'Environment context' },
      { key: 'X-User-ID', value: '12345', description: 'Custom user id header' },
      { key: 'X-Session-ID', value: 'xyz789', description: 'Session tracking' }
    ]
  },
  {
    category: '🗄️ File Upload / Multipart',
    headers: [
      { key: 'Content-Type', value: 'multipart/form-data', description: 'Used when uploading files' },
      { key: 'Accept', value: '*/*', description: 'Accept any type of response' }
    ]
  }
];

export default function HTTPRequestConfigPanel({ node, onUpdate, onClose }) {
  const [toolName, setToolName] = useState(node?.data?.toolName || '');
  const [description, setDescription] = useState(node?.data?.description || '');
  const [method, setMethod] = useState(node?.data?.method || 'GET');
  const [url, setUrl] = useState(node?.data?.url || '');
  const [bodyType, setBodyType] = useState(node?.data?.bodyType || 'none');
  const [jsonBody, setJsonBody] = useState(node?.data?.jsonBody || '{\n  "key": "value"\n}');
  const [headers, setHeaders] = useState(node?.data?.headers || []);
  const [formData, setFormData] = useState(node?.data?.formData || []);
  const [showHeaderList, setShowHeaderList] = useState(false);
  const [searchHeader, setSearchHeader] = useState('');

  const addHeader = (preset) => {
    setHeaders([...headers, { enabled: true, ...preset }]);
  };

  const removeHeader = (idx) => {
    setHeaders(headers.filter((_, i) => i !== idx));
  };

  const updateHeader = (idx, field, value) => {
    const updated = [...headers];
    updated[idx][field] = value;
    setHeaders(updated);
  };

  const addFormField = () => {
    setFormData([...formData, { enabled: true, key: '', value: '', description: '' }]);
  };

  const removeFormField = (idx) => {
    setFormData(formData.filter((_, i) => i !== idx));
  };

  const updateFormField = (idx, field, value) => {
    const updated = [...formData];
    updated[idx][field] = value;
    setFormData(updated);
  };

  const handleSave = () => {
    onUpdate({
      toolName: toolName.trim() || 'HTTP Request',
      description: description.trim(),
      method,
      url,
      headers: headers.filter(h => h.key.trim()),
      bodyType,
      jsonBody: bodyType === 'raw' ? jsonBody : null,
      formData: bodyType === 'form-data' ? formData.filter(f => f.key.trim()) : null,
    });
    onClose();
  };

  const filteredHeaders = COMMON_HEADERS.map(cat => ({
    ...cat,
    headers: cat.headers.filter(h => 
      h.key.toLowerCase().includes(searchHeader.toLowerCase()) ||
      h.description.toLowerCase().includes(searchHeader.toLowerCase())
    )
  })).filter(cat => cat.headers.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">HTTP Request</h2>
                <p className="text-sm text-gray-600">Configure API endpoint</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tool Name & Description */}
          <div className=" flex flex-col  gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tool Name
              </label>
              <input
                type="text"
                value={toolName}
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g. Fetch Users API"
                className="w-full px-4 py-2 border text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                type="text"
                value={description}
                rows={2}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Get user list from API"
                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300"
              />
            </div>
          </div>

          {/* Method + URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="px-4 py-2.5 rounded-lg font-medium text-sm text-gray-700 bg-white border-2 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none pr-10 cursor-pointer transition"
                >
                  {METHODS.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://api.example.com/users"
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300"
              />
            </div>
          </div>

          {/* Headers Section */}
          <div className=" pt-5">
            <div className="flex flex-col items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Request Headers</h3>
              <button
                onClick={() => setShowHeaderList(!showHeaderList)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all"
              >
                <Info className="w-4 h-4" /> Common Headers
              </button>
            </div>

            {/* Common Headers Modal */}
            {showHeaderList && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Choose Common Headers</h3>
                      <button
                        onClick={() => setShowHeaderList(false)}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                      >
                        <X className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <Search className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={searchHeader}
                        onChange={(e) => setSearchHeader(e.target.value)}
                        placeholder="Search headers..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none hover:border-blue-300 transition"
                      />
                    </div>

                    <div className="overflow-y-auto max-h-[calc(80vh-180px)]">
                      {filteredHeaders.map((cat, idx) => (
                        <div key={idx} className="mb-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                            {cat.category}
                          </h4>
                          <div className="space-y-1.5">
                            {cat.headers.map((h, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  addHeader(h);
                                  setShowHeaderList(false);
                                  setSearchHeader('');
                                }}
                                className="w-full text-left p-3 rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-2 border-transparent hover:border-blue-300 transition-all group"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm font-semibold text-gray-800">{h.key}</span>
                                      <span className="text-xs text-gray-400">→</span>
                                      <span className="text-xs text-blue-600 font-mono truncate">{h.value}</span>
                                    </div>
                                    <p className="text-xs text-gray-600">{h.description}</p>
                                  </div>
                                  <Plus className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Headers */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {headers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No headers selected</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Common Headers" to choose from the list</p>
                </div>
              ) : (
                headers.map((header, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col gap-2 p-3 rounded-lg border-2 transition-all ${
                      header.enabled 
                        ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-300' 
                        : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-2 items-start">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) => updateHeader(idx, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
                      />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                          placeholder="Key"
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                        />
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                          placeholder="Value (use {{variable}})"
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                        />
                      </div>
                      <button
                        onClick={() => removeHeader(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition mt-0.5"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={header.description || ''}
                      onChange={(e) => updateHeader(idx, 'description', e.target.value)}
                      placeholder="Description (optional)"
                      className="ml-6 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Body Section */}
          <div className="border-t pt-5">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Request Body</h3>
            <div className="flex gap-2 flex-wrap mb-4">
              {BODY_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setBodyType(type)}
                  className={`px-5 py-2.5 text-sm rounded-lg font-medium transition-all border-2 ${
                    bodyType === type
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {type === 'none' ? 'None' : type === 'form-data' ? 'Form Data' : 'RAW (JSON)'}
                </button>
              ))}
            </div>

            {/* Form Data */}
            {bodyType === 'form-data' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-semibold text-gray-700">Form Data Fields</h4>
                  <button
                    onClick={addFormField}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Plus className="w-4 h-4" /> Add Field
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {formData.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Code className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No form fields added</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add Field" to get started</p>
                    </div>
                  ) : (
                    formData.map((field, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col gap-2 p-3 rounded-lg border-2 transition-all ${
                          field.enabled 
                            ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-300' 
                            : 'border-gray-200 bg-gray-50 opacity-60 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex gap-2 items-start">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => updateFormField(idx, 'enabled', e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded cursor-pointer mt-1"
                          />
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateFormField(idx, 'key', e.target.value)}
                              placeholder="Key"
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                            />
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => updateFormField(idx, 'value', e.target.value)}
                              placeholder="Value (use {{variable}})"
                              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                            />
                          </div>
                          <button
                            onClick={() => removeFormField(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition mt-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={field.description || ''}
                          onChange={(e) => updateFormField(idx, 'description', e.target.value)}
                          placeholder="Description (optional)"
                          className="ml-6 px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition hover:border-blue-300 bg-white"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* JSON Body */}
            {bodyType === 'raw' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">RAW JSON Body</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Use <code className="bg-gray-100 px-2 py-0.5 rounded text-blue-600 font-mono">{'{{variable}}'}</code> for dynamic values
                  </span>
                </div>
                <textarea
                  value={jsonBody}
                  onChange={(e) => setJsonBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-3 bg-gray-900 text-gray-100 font-mono text-sm rounded-lg border-2 border-gray-700 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none resize-none hover:border-blue-500 transition"
                  spellCheck={false}
                />
              </div>
            )}

            {bodyType === 'none' && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-500">No request body will be sent</p>
                <p className="text-xs text-gray-400 mt-1">Select Form Data or RAW (JSON) to add body content</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Auto-saved
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
                disabled={!url.trim()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium shadow-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
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