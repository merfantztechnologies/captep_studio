// src/components/Pages/FlowPage/FlowNode/ConfigPanels/otherToolconfigPanel/TaskConfigPanel.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TaskConfigPanel({ node, onClose, onUpdate }) {
  // -----------------------------------------------------------------
  // 1. Initialise with the full schema (including the new fields)
  // -----------------------------------------------------------------
  const initialTask = node.data.task || {
    name: 'Task 1',
    description:
      'Conduct a thorough research about {topic}. Make sure you find any interesting and relevant information given. the current year is 2025.',
    expected_output:
      'A list with 10 bullet points of the most relevant information about {topic}',
    agent: '',
    async_execution: false,
    human_input: false,
    markdown: false,
    guardrail_max_retries: 3,
  };

  const [task, setTask] = useState(initialTask);

  // -----------------------------------------------------------------
  // 2. Generic change handler (works for text, textarea, checkbox, select)
  // -----------------------------------------------------------------
  const handleChange = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setTask((prev) => ({ ...prev, [field]: value }));
  };

  // -----------------------------------------------------------------
  // 3. Save → update parent → close
  // -----------------------------------------------------------------
  const handleSave = () => {
    onUpdate({ task });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[620px] max-h-[85vh] overflow-y-auto p-6">
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-800">
            Task Configuration
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* ---------- Form ---------- */}
        <div className="space-y-5">

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={task.name}
              onChange={handleChange('name')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={task.description}
              onChange={handleChange('description')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Expected Output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Output
            </label>
            <textarea
              rows={6}
              value={task.expected_output}
              onChange={handleChange('expected_output')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
          {/* Async Execution */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="async_execution"
              checked={task.async_execution}
              onChange={handleChange('async_execution')}
              className="w-4 h-4 accent-teal-600 cursor-pointer"
            />
            <label htmlFor="async_execution" className="text-sm text-gray-700">
              Async Execution
            </label>
          </div>

          {/* Human Input */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="human_input"
              checked={task.human_input}
              onChange={handleChange('human_input')}
              className="w-4 h-4 accent-teal-600 cursor-pointer"
            />
            <label htmlFor="human_input" className="text-sm text-gray-700">
              Human Input Required
            </label>
          </div>

          {/* Markdown */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="markdown"
              checked={task.markdown}
              onChange={handleChange('markdown')}
              className="w-4 h-4 accent-teal-600 cursor-pointer"
            />
            <label htmlFor="markdown" className="text-sm text-gray-700">
              Render as Markdown
            </label>
          </div>

          {/* Guardrail Max Retries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardrail Max Retries
            </label>
            <input
              type="number"
              min="0"
              value={task.guardrail_max_retries}
              onChange={handleChange('guardrail_max_retries')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* ---------- Footer ---------- */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}