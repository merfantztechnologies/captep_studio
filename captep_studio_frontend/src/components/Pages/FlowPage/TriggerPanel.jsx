// src/components/Pages/FlowPage/TriggerPanel.jsx
import React from 'react';
import { X } from 'lucide-react';
import { triggerOptions } from './FlowNode/FlowNodes';

export default function TriggerPanel({ startNodeId, nodes, setNodes, initialMessage, setInitialMessage, onClose }) {
  const selected = nodes.find(n => n.id === startNodeId)?.data.triggerLabel;
  const selectedTrigger = triggerOptions.find(t => t.name === selected);

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l border-gray-200">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Configure Trigger</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
      </div>
      <div className="p-6 space-y-4 overflow-y-auto h-[calc(100%-140px)]">
        {triggerOptions.map(trig => {
          const Icon = trig.icon;
          const isSel = selected === trig.name;
          return (
            <button key={trig.type} onClick={() => setNodes(nds => nds.map(n => n.id === startNodeId ? { ...n, data: { ...n.data, triggerLabel: trig.name } } : n))} className={`w-full flex items-center p-4 border-2 rounded-xl transition-all group ${isSel ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 bg-white'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-transform group-hover:scale-110 ${isSel ? 'bg-emerald-500 shadow-lg' : 'bg-gray-100'}`}>
                <Icon className={`w-6 h-6 ${isSel ? 'text-white' : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{trig.name}</div>
                <div className="text-sm text-gray-600 mt-0.5">{trig.description}</div>
              </div>
              {isSel && <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold">Check</div>}
            </button>
          );
        })}
        {selectedTrigger?.type === 'chat' && (
          <div className="mt-5 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Initial Message</label>
            <textarea value={initialMessage} onChange={e => setInitialMessage(e.target.value)} rows={4} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Enter greeting message..." />
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
        <button onClick={onClose} className="px-5 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
        <button onClick={onClose} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-medium shadow-lg">Done</button>
      </div>
    </div>
  );
}