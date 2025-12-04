import React, { useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  Cpu,
  MessageSquare,
  Wrench,
  X,
} from 'lucide-react';
import { useGetAgentMutation } from '../../../redux/services/agentServices';
import AgentTestTab from './AgentTestTab';

const AgentOverview = ({ agent: propAgent, onClose, isCreateMode = false }) => {
  // ──────────────────────────────────────── RTK Query
  const [getAgent, { data, isLoading, isError }] = useGetAgentMutation();

  // ──────────────────────────────────────── UI State
  const [activeTab, setActiveTab] = React.useState('overview');
  const [showTestPanel, setShowTestPanel] = React.useState(false);
  const [isTestExpanded, setIsTestExpanded] = React.useState(false);

  // ──────────────────────────────────────── Scroll Refs
  const sectionRefs = {
    overview: useRef(null),
    model: useRef(null),
    instructions: useRef(null),
    tools: useRef(null),
  };

  const scrollToSection = (id) => {
    const ref = sectionRefs[id];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTabClick = (id) => {
    setActiveTab(id);
    scrollToSection(id);
  };

  const agentId = propAgent?.id;
  const fetchedAgent = data?.data;
  const isCreating = isCreateMode || !agentId;

  // ──────────────────────────────────────── Fetch Agent
  useEffect(() => {
    if (agentId && !isCreateMode) {
      getAgent({ agentId }).unwrap();
    }
  }, [agentId, isCreateMode, getAgent]);

  // ──────────────────────────────────────── UI Helpers
  const iconBg = propAgent?.bg ?? 'bg-teal-600';
  const iconLetter = isCreating ? 'N' : (propAgent?.icon ?? 'A');

  // ──────────────────────────────────────── Tabs ( & Sections
  const tabs = [
    { id: 'overview',     label: 'Overview',     icon: FileText },
    { id: 'model',        label: 'Model',        icon: Cpu },
    { id: 'instructions', label: 'Instructions', icon: MessageSquare },
    { id: 'tools',        label: 'Tools',        icon: Wrench },
  ];

  // ──────────────────────────────────────── Render Tool Card
  const renderToolCard = (t) => (
    <div
      key={t.termId}
      className="p-4 border border-gray-200 rounded-lg flex items-start justify-between space-x-3"
    >
      <div className="flex items-start space-x-3">
        <Wrench className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <p className="font-medium text-sm">{t.label}</p>
          <p className="text-xs text-gray-600">{t.description}</p>
          <p className="text-xs text-gray-500">Service: {t.service}</p>
        </div>
      </div>
    </div>
  );

  // ──────────────────────────────────────── Loading / Error
  if (isLoading && !isCreating) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading agent…</div>
      </div>
    );
  }

  if ((isError || !fetchedAgent) && !isCreating) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Error loading agent.</div>
      </div>
    );
  }

  // ──────────────────────────────────────── MAIN RETURN
  return (
    <div className="bg-gray-50 h-screen flex flex-col">
      {/* ────────────────────── Top Nav ────────────────────── */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-900 flex items-center"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center text-white text-lg font-bold`}
              >
                {iconLetter}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  {fetchedAgent?.name || 'Agent'}
                </h1>
              </div>
            </div>
          </div>

          {/* <div className="flex items-center space-x-3">
            {!isCreating && (
              <button
                onClick={() => setShowTestPanel(true)}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center"
              >
                Test
              </button>
            )}
          </div> */}
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 px-6 border-t border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────── Scrollable Content ────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-5xl mx-auto p-6 space-y-8">

          {/* ───── 1. Overview ───── */}
          <div ref={sectionRefs.overview}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Details</h2>
              <div className="space-y-6">

                {/* Icon + Name */}
                <div className="flex items-start">
                  <div
                    className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4`}
                  >
                    {iconLetter}
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                    <p className="text-sm font-medium text-gray-800">
                      {fetchedAgent?.name || '—'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
                  <p className="text-sm text-gray-700">
                    {fetchedAgent?.description || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ───── 2. Model ───── */}
          <div ref={sectionRefs.model}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Agent's Model</h2>
              <p className="text-sm font-medium text-gray-800">
                {fetchedAgent?.model || "GPT-4o (default)"}
              </p>
            </div>
          </div>

          {/* ───── 3. Instructions ───── */}
          <div ref={sectionRefs.instructions}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Instructions</h2>
                <p className="text-sm text-gray-600">
                  Core identity that drives the agent's behaviour.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Role</label>
                  <p className="text-sm text-gray-700">{fetchedAgent?.role || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Goal</label>
                  <p className="text-sm text-gray-700">{fetchedAgent?.goal || '—'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Backstory</label>
                  <p className="text-sm text-gray-700">{fetchedAgent?.backstory || '—'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ───── 4. Tools ───── */}
          <div ref={sectionRefs.tools}>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Tools</h2>
                <p className="text-sm text-gray-600">Tools assigned to this agent.</p>
              </div>

              {fetchedAgent?.tools && fetchedAgent.tools.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {fetchedAgent.tools.map(t => ({
                    termId: t.id,
                    label: t.name,
                    description: t.description,
                    service: t.service,
                  })).map(renderToolCard)}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tools assigned.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ────────────────────── Test Panel (Right Side) ────────────────────── */}
      {showTestPanel && !isCreating && (
        <AgentTestTab
          agent={fetchedAgent}
          onClose={() => setShowTestPanel(false)}
          isExpanded={isTestExpanded}
          setIsExpanded={setIsTestExpanded}
        />
      )}
    </div>
  );
};

export default AgentOverview;