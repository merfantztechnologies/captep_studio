// src/components/Pages/FlowPage/FlowNodes.jsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  PlayCircle, Bot, Send, GitBranch, Trash2, Database,
  MessageSquare, Globe, Calendar, FormInput, Mail, Code,
  X, Wrench, CheckCheck, Cpu, Terminal, Users, FileText, MailOpen, CalendarDays, Share2, Link, Phone, Zap, Cloud, MessageCircle, AtSign, CheckSquare,
} from 'lucide-react';
import { SiSalesforce , SiQuickbooks } from "react-icons/si";

import { FaSlack } from "react-icons/fa";
import { SiGooglecalendar } from "react-icons/si";
import { BiBorderRadius } from 'react-icons/bi';
import { MdTask, MdEmail } from "react-icons/md";

import { BrainCog } from 'lucide-react'; // Import for Sentiment


/* ==================== CUSTOM NODES ==================== */

export const StartNode = ({ data, selected }) => {
  const trigger = data.triggerLabel;
  const triggerIconMap = {
    'Manual Trigger': PlayCircle,
    'Chat Message': MessageSquare,
    'Webhook': Globe,
    'Schedule': Calendar,
    'Form Submit': FormInput,
  };
  const TriggerIcon = triggerIconMap[trigger] || PlayCircle;

  return (
    <div
      className={`bg-white border-2 ${selected ? 'border-gray-300 border-6 shadow-md' : 'border-gray-400 border-3'
        } rounded-xl p-4 transition-all cursor-pointer min-w-[200px]`}
      onClick={(e) => {
        e.stopPropagation();
        data.onConfigure?.();
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${selected ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-emerald-500'
            }`}
        >
          <TriggerIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm truncate max-w-[120px]">
            {trigger || 'Start'}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">
            {trigger ? 'Trigger configured' : 'Click to set trigger'}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400"
      />
    </div>
  );
};

export const TaskNode = ({ data, selected }) => {
  return (
    <div
      className={`bg-white border-3 ${
        selected ? 'border-gray-300 border-6  ' : 'border-gray-400'
      } rounded-xl p-5 min-w-[280px] transition-all hover:shadow-lg relative cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        data.onConfigure?.();
      }}
    >
      {/* INPUT */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="!w-4 !h-2 !bg-gray-400 !border-2 !border-gray-400 shadow-md" style={{ borderRadius: "0px" }}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-md" >
            <MdTask className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]">
              {data.label || 'Task'}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[180px]">
              {data.description || 'Click to configure'}
            </div>
          </div>
        </div>
        

        {/* DELETE BUTTON */}
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* OUTPUT */}
      {/* <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400 shadow-md"
      /> */}
    </div>
  );
};



export const AgentNode = ({ data, selected }) => (
  <div
    className={`bg-white border-3  ${selected ? 'border-gray-300 border-6 ' : 'border-gray-400 '} rounded-xl p-5 min-w-[300px]  relative `}
    onClick={(e) => { e.stopPropagation(); data.onConfigure?.(); }}
  >
    <Handle type="target" position={Position.Left} id="input" className="!w-3 !h-4 !bg-gray-400 !border-2 !border-gray-400 !rounded-0 " style={{ borderRadius: "0px" }}/>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]">{data.label || 'AI Agent'}</div>
          <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[180px]">{data.description || 'Click to configure'}</div>
        </div>
      </div>
      {data.onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>

    <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
        <CheckCheck className="w-4 h-4 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">Task</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
        <Cpu className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">Assistant Agent</span>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg">
        <Wrench className="w-4 h-4 text-orange-600" />
        <span className="text-xs font-medium text-orange-700"> Tools</span>
      </div>
    </div>

    <div className="flex justify-between mt-4">
      <Handle type="source" position={Position.Bottom} id="output" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400" style={{ left: '10.66%' }} />
      <Handle type="source" position={Position.Bottom} id="tool" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400" style={{ left: '60%' }} />
      <Handle type="source" position={Position.Bottom} id="memory" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400" style={{ left: '80.33%' }} />
    </div>
  </div>
);

export const ActionNode = ({ data, selected }) => (
  <div className={`bg-white border-2 ${selected ? 'border-blue-500 shadow-2xl' : 'border-gray-300'} rounded-xl p-5 min-w-[240px] transition-all hover:shadow-lg`}>
    <Handle type="target" position={Position.Top} id="input" className="w-4 h-4 !bg-blue-500 !border-2 !border-white shadow-md" />
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
          {data.icon || <Send className="w-6 h-6 text-white" />}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]">{data.label || 'Action'}</div>
          <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[180px]">{data.description || 'Configure action'}</div>
        </div>
      </div>
      {data.onDelete && (
        <button onClick={() => data.onDelete()} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-4 h-4 !bg-blue-500 !border-2 !border-white shadow-md" />
  </div>
);

export const ConditionNode = ({ data, selected }) => (
  <div className={`bg-white border-3 ${selected ? 'border-amber-500 shadow-2xl' : 'border-gray-400'} rounded-xl p-5 min-w-[240px] transition-all hover:shadow-lg`}>
    <Handle type="target" position={Position.Top} id="input" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400"  style={{borderRadius:"0px"}}/>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
          <GitBranch className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-base truncate max-w-[140px]">Condition</div>
          <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[140px]">If/Else logic</div>
        </div>
      </div>
      {data.onDelete && (
        <button onClick={() => data.onDelete()} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
    <div className="flex justify-between text-sm font-medium border-t border-gray-100 pt-4">
      <span className="text-emerald-600">True</span>
      <span className="text-rose-600">False</span>
    </div>
    <Handle type="source" position={Position.Bottom} id="true" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400" style={{ left: '30%' }} />
    <Handle type="source" position={Position.Bottom} id="false" className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400" style={{ left: '70%' }} />
  </div>
);

export const TermNode = ({ data, selected }) => (
  <div
    className={`bg-white border-3 ${selected ? 'border-red-500 shadow-2xl' : 'border-gray-400'} rounded-xl p-5 min-w-[260px] transition-all hover:shadow-lg cursor-pointer relative`}
    onClick={(e) => { e.stopPropagation(); data.onConfigure?.(); }}
  >
    <Handle type="target" position={Position.Top} id="input" className="w-4 h-4 !bg-red-500 !border-2 !border-white shadow-md" />
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
          <Terminal className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]">{data.label || 'Terminal Output'}</div>
          <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[180px]">{data.description || 'Final response'}</div>
        </div>
      </div>
      {data.onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onDelete(); }}
          className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </div>
    {data.outputPreview && (
      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 font-mono truncate">
        {data.outputPreview}
      </div>
    )}
  </div>
);

export const ToolNode = ({ data, selected }) => {
  // Map for service-specific icons
  const serviceIconMap = {
    knowledge_base: Database,
    salesforce: SiSalesforce,
    quickbooks: SiQuickbooks,
    gmail: MdEmail,
    googlecalendar: SiGooglecalendar,
    slack: FaSlack,
    serper: Globe, // Assuming Globe for Serper, adjust if a more specific icon exists
    Sentiment: BrainCog, // Using BrainCog for Sentiment, adjust if needed
    // Add other services and their icons here
  };

  // Safe Icon Renderer
  const renderIcon = () => {
    const icon = data.icon;
    const service = data.service;

    // Case 1: Service-specific icon from map
    if (service && serviceIconMap[service]) {
      const ServiceIcon = serviceIconMap[service];
      return <ServiceIcon className="w-6 h-6 text-white" />;
    }

    // Case 2: SVG URL (string)
    if (typeof icon === 'string' && icon.startsWith('http')) {
      return (
        <img
          src={icon}
          alt={data.label}
          className="w-6 h-6 text-white object-contain"
        />
      );
    }

    // Case 3: React Component (function like SiSalesforce, Globe)
    if (typeof icon === 'function') {
      const Icon = icon;
      return <Icon className="w-6 h-6 text-white" />;
    }

    // Case 4: Already rendered JSX (like <Mail />)
    if (React.isValidElement(icon)) {
      return icon;
    }

    // Case 5: Fallback
    return <Zap className="w-6 h-6 text-white" />;
  };

  return (
    <div
      className={`bg-white border-3 ${
        selected ? 'border-indigo-500 shadow-2xl' : 'border-gray-400'
      } rounded-xl p-5 min-w-[280px] transition-all hover:shadow-lg relative cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        data.onConfigure?.();
      }}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        isConnectable={true}
        position={Position.Top}
        id="input"
        className="!w-4 !h-2 !bg-gray-400 !border !border-gray-400"
        style={{ borderRadius: '0px' }}
      />

      {/* Main Content */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Icon Container */}
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            {renderIcon()}
          </div>

          {/* Label & Description */}
          <div>
            <div className="font-semibold text-gray-900 text-base truncate max-w-[180px]">
              {data.label || 'Tool'}
            </div>
            <div className="text-sm text-gray-500 mt-0.5 truncate max-w-[180px]">
              {data.description || 'Click to configure'}
            </div>
          </div>
        </div>

        {/* Delete Button */}
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
            }}
            className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Output Handle */}
      {/* <Handle
        type="source"
        isConnectable={true}
        position={Position.Bottom}
        id="output"
        className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-400 !rounded-full"
        style={{ borderRadius: '0px' }}
      /> */}
    </div>
  );
};

/* ==================== EXPORTS ==================== */
export const nodeTypes = {
  start: StartNode,
  agent: AgentNode,
  action: ActionNode,
  condition: ConditionNode,
  term: TermNode,
  tool: ToolNode,
  task: TaskNode,
};

export const nodeTemplates = [
  {
    category: 'Core', nodes: [
      { type: 'agent', label: 'AI Agent', icon: Bot, description: 'Intelligent AI assistant', iconBg: 'from-purple-400 to-purple-600', service: 'supervisor agent' },
      { type: 'agent', label: 'Assistant Agent', icon: Bot, description: 'Sub intelligent AI assistant', iconBg: 'from-purple-400 to-purple-600', service: 'assistant agent' },
      { type: 'task', label: 'Agent Task', icon: Zap, description: 'Define a research / execution task', iconBg: 'from-teal-400 to-teal-600' },
      // { type: 'action', label: 'Send Email', icon: Mail, description: 'Email notification', iconBg: 'from-blue-400 to-blue-600', actionIcon: <Mail className="w-5 h-5 text-white" /> },
      // { type: 'action', label: 'Send Message', icon: MessageSquare, description: 'Chat message', iconBg: 'from-blue-400 to-blue-600', actionIcon: <MessageSquare className="w-5 h-5 text-white" /> },
    ]
  },
  {
    category: 'Actions', nodes: [
      { type: 'action', label: 'API Request', icon: Globe, description: 'HTTP API call', iconBg: 'from-blue-400 to-blue-600', actionIcon: <Globe className="w-5 h-5 text-white" /> },
      { type: 'action', label: 'Run Code', icon: Code, description: 'Execute JavaScript', iconBg: 'from-blue-400 to-blue-600', actionIcon: <Code className="w-5 h-5 text-white" /> },
      // { type: 'action', label: 'Agent Task', icon: Zap, description: 'Assistant agent task execution', iconBg: 'from-blue-400 to-blue-600', actionIcon: <Zap className="w-5 h-5 text-white" /> },

    ]
  },
  {
    category: 'Logic', nodes: [
      { type: 'condition', label: 'If Condition', icon: GitBranch, description: 'Branch workflow', iconBg: 'from-amber-400 to-amber-600' },
    ]
  },
  {
    category: 'Output', nodes: [
      { type: 'term', label: 'Terminal Output', description: 'Final response or log', icon: Terminal, iconBg: 'from-red-500 to-rose-600' },
    ]
  },
];

export const toolTemplates = [
  {
    category: 'CRM',
    tools: [
      // { type: 'tool', label: 'Create Contact', icon: Users, description: 'Add new contact in CRM', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <Users className="w-5 h-5 text-white" /> },
      // { type: 'tool', label: 'Update Deal', icon: FileText, description: 'Modify deal stage', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <FileText className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Salesforce CRM', icon: SiSalesforce, description: 'Connect to Salesforce for leads & accounts', iconBg: 'from-blue-400 to-blue-600', toolIcon: <SiSalesforce className="w-6 h-6 text-white" />, service: 'salesforce' },
      { type: 'tool', label: 'QuickBooks', icon: SiQuickbooks, description: 'Manage invoices, payments & accounting', iconBg: 'from-green-400 to-green-600', toolIcon: <SiQuickbooks className="w-5 h-5 text-white" />, service: 'quickbooks' },
    ],
  },
  {
    category: 'SendMail',
    tools: [
      // { type: 'tool', label: 'Send Campaign', icon: MailOpen, description: 'Bulk email campaign', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <MailOpen className="w-5 h-5 text-white" /> },
      // { type: 'tool', label: 'Send Reminder', icon: CalendarDays, description: 'Automated reminder', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <CalendarDays className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Gmail Send', icon: MdEmail, description: 'Send emails via Gmail', iconBg: 'from-red-400 to-red-600', toolIcon: <MdEmail className="w-5 h-5 text-white" />, service: 'gmail' },
      { type: 'tool', label: 'Google Calendar', icon: SiGooglecalendar, description: 'Manage Google Calendar events', iconBg: 'from-blue-400 to-blue-600', toolIcon: <SiGooglecalendar className="w-5 h-5 text-white" />, service: 'googlecalendar' },
    ],
  },
  {
    category: 'Social Media',
    tools: [
      { type: 'tool', label: 'Slack Notify', icon: FaSlack, description: 'Send notifications to Slack', iconBg: 'from-purple-400 to-purple-600', toolIcon: <FaSlack className="w-5 h-5 text-white" />, service: 'slack' },
      { type: 'tool', label: 'Post Tweet', icon: Share2, description: 'Publish tweet', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <Share2 className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Schedule FB Post', icon: Link, description: 'Schedule Facebook post', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <Link className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Reply DM', icon: MessageSquare, description: 'Auto-reply direct messages', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <MessageSquare className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Call API', icon: Phone, description: 'Call external social API', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <Phone className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Analytics Pull', icon: FileText, description: 'Pull social analytics', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <FileText className="w-5 h-5 text-white" /> },
      { type: 'tool', label: 'Generate Image', icon: Zap, description: 'AI image for post', iconBg: 'from-indigo-400 to-indigo-600', toolIcon: <Zap className="w-5 h-5 text-white" /> },

    ],
  },
  {
    category: 'Knowledge',
    tools: [
      {
        type: 'tool',
        label: 'Knowledge Base',
        icon: Database,
        description: 'Upload local files (PDF, TXT, DOCX) for agent to use',
        iconBg: 'from-cyan-400 to-cyan-600',
        toolIcon: <Database className="w-5 h-5 text-white" />,
        service: 'knowledge_base',
      },
    ],
  },
];

export const triggerOptions = [
  { name: 'Manual Trigger', description: 'Start manually', icon: PlayCircle, type: 'manual' },
  { name: 'Chat Message', description: 'When message received', icon: MessageSquare, type: 'chat' },
  { name: 'Webhook', description: 'HTTP webhook', icon: Globe, type: 'webhook' },
  { name: 'Schedule', description: 'Time-based cron', icon: Calendar, type: 'schedule' },
  { name: 'Form Submit', description: 'Form submission', icon: FormInput, type: 'form' },
];