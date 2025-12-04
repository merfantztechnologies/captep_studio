// src/components/Pages/FlowPage/FlowNode/ConfigPanels/KnowledgeBaseConfigPanel.jsx
import React, { useState } from 'react';
import { X, Upload, FileText, Trash2, CheckCircle, Edit2 } from 'lucide-react';

const ACCEPTED = ['.pdf', '.txt', '.docx', '.md'];

export default function KnowledgeBaseConfigPanel({ node, onUpdate, onClose }) {
  const [kbName, setKbName] = useState(node.data.kbName || '');
  const [kbDescription, setKbDescription] = useState(node.data.kbDescription || '');
  const [files, setFiles] = useState(node.data.files || []);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (e) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    const newFiles = [];

    for (let item of items) {
      const entry = item.webkitGetAsEntry();
      if (entry?.isFile) {
        const file = await getFile(entry);
        if (ACCEPTED.includes('.' + file.name.split('.').pop().toLowerCase())) {
          newFiles.push(file);
        }
      }
    }
    processFiles(newFiles);
  };

  const getFile = (entry) => {
    return new Promise((resolve) => {
      entry.file(resolve);
    });
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
  };

  const processFiles = async (fileList) => {
    if (fileList.length === 0) return;
    setUploading(true);
    const processed = await Promise.all(
      fileList.map(async (file) => {
        const text = await file.text();
        return {
          name: file.name,
          size: file.size,
          preview: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
          uploadedAt: new Date().toISOString(),
        };
      })
    );
    setFiles((prev) => [...prev, ...processed]);
    setUploading(false);
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onUpdate({
      kbName: kbName.trim() || `Knowledge Base ${new Date().toLocaleDateString()}`,
      kbDescription: kbDescription.trim(),
      files,
      vectorStore: files.length > 0 ? 'local_embedded' : null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Configure Knowledge Base</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Name Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <Edit2 className="w-4 h-4" />
              Knowledge Base Name
            </label>
            <input
              type="text"
              value={kbName}
              onChange={(e) => setKbName(e.target.value)}
              placeholder="e.g. Company Policies, Product Docs"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4" />
              Description (Optional)
            </label>
            <textarea
              value={kbDescription}
              onChange={(e) => setKbDescription(e.target.value)}
              placeholder="Briefly describe what this knowledge base contains..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-all"
          >
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.md"
              onChange={handleFileChange}
              className="hidden"
              id="kb-file-input"
            />
            <label htmlFor="kb-file-input" className="block">
              <Upload className="w-14 h-14 text-teal-500 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700">
                Drop files here or <span className="text-teal-600 underline">click to upload</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">Supported: PDF, TXT, DOCX, MD</p>
            </label>
          </div>

          {/* Uploading Indicator */}
          {uploading && (
            <div className="flex items-center gap-3 text-sm text-teal-600">
              <div className="animate-spin w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full" />
              Processing uploaded files...
            </div>
          )}

          {/* File List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No files uploaded yet.</p>
            ) : (
              files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-teal-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-600">
                        {(file.size / 1024).toFixed(1)} KB • Uploaded{' '}
                        {new Date(file.uploadedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Success Message */}
          {files.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
              <CheckCircle className="w-5 h-5" />
              <strong>{files.length}</strong> file{files.length > 1 ? 's' : ''} ready for embedding
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={files.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg font-medium shadow-md hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save & Embed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}