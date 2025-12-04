// src/components/Pages/FlowPage/AgentPicker.jsx
import React from 'react';
import { ChevronRight, Brain, Bot, Sparkles } from 'lucide-react';

const options = [
  { type: 'sequential', title: 'Sequential Agent', desc: 'Step-by-step linear execution', icon: ChevronRight, gradient: 'from-blue-500 to-cyan-500' },
  { type: 'react', title: 'ReAct Agent', desc: 'Reasoning and acting in cycles', icon: Brain, gradient: 'from-purple-500 to-pink-500' },
  { type: 'multi', title: 'Multi-Agent', desc: 'Collaborative agent network', icon: Bot, gradient: 'from-orange-500 to-red-500' },
];

export default function AgentPicker({ onSelect }) {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create New Workflow</h1>
            <p className="text-xs text-gray-500">Choose your agent architecture</p>
          </div>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {options.map(opt => {
            const Icon = opt.icon;
            return (
              <button key={opt.type} onClick={() => onSelect(opt.type)} className="p-6 bg-white border-2 border-gray-200 rounded-2xl transition-all text-left group hover:scale-105 hover:border-blue-300 hover:shadow-xl">
                <div className={`w-14 h-14 bg-gradient-to-br ${opt.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{opt.title}</h3>
                <p className="text-sm text-gray-600">{opt.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}