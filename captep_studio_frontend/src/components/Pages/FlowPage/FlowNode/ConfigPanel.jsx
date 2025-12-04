// src/components/Pages/FlowPage/ConfigPanel.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  X,
  Bot,
  Terminal,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Settings,
  Clock,
  Code,
  Calendar,
  Brain,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useGetModelsMutation } from '../../../../redux/services/agentServices';

// ────── Validation Schema ──────
const validationSchema = Yup.object().shape({
  name: Yup.string().required('Agent Name is required'),
  role: Yup.string().required('Role is required'),
  goal: Yup.string().required('Goal is required'),
  model: Yup.string().required('Model is required'),
  provider: Yup.string().test(
    'provider-required',
    'Provider is required when a model is selected',
    function (value) {
      const { model } = this.parent;
      return !model || !!value;
    }
  ),
  apiKey: Yup.string().required('API Key is required'),
  // Optional fields
  description: Yup.string(),
  backstory: Yup.string(),
  interaction: Yup.string(),
  memory: Yup.boolean(),
  temperature: Yup.number().min(0).max(2),
  maxTokens: Yup.number().min(100).max(4000),
  topP: Yup.number().min(0).max(1),
  llm: Yup.string(),
  function_calling_llm: Yup.string(),
  verbose: Yup.boolean(),
  allow_delegation: Yup.boolean(),
  max_iter: Yup.number().min(1),
  max_rpm: Yup.string(),
  max_execution_time: Yup.string(),
  max_retry_limit: Yup.number().min(0),
  allow_code_execution: Yup.boolean(),
  code_execution_mode: Yup.string(),
  respect_context_window: Yup.boolean(),
  use_system_prompt: Yup.boolean(),
  multimodal: Yup.boolean(),
  inject_date: Yup.boolean(),
  date_format: Yup.string(),
  reasoning: Yup.boolean(),
  max_reasoning_attempts: Yup.string(),
  knowledge_sources: Yup.string(),
  embedder: Yup.string(),
  system_template: Yup.string(),
  prompt_template: Yup.string(),
  response_template: Yup.string(),
});

export default function ConfigPanel({ node, onClose, onUpdate }) {
  const isTerm = node.type === 'term';

  // ────── Fetch Models ──────
  const [getModels, { data: modelsData, isLoading: isModelsLoading, isError: isModelsError }] =
    useGetModelsMutation();
  const [fetchedModels, setFetchedModels] = React.useState(null);

  useEffect(() => {
    const fetchModels = async () => {
      if (!fetchedModels && !isModelsLoading && !isModelsError) {
        try {
          const response = await getModels({}).unwrap();
          setFetchedModels(response);
        } catch (error) {
          console.error("Error fetching models ---->>>", error);
        }
      }
    };
    fetchModels();
  }, [getModels, fetchedModels, isModelsLoading, isModelsError]);

  // ────── Provider & Model Extraction ──────
  const { providerList, modelMap, allModels } = useMemo(() => {
    const raw = modelsData || fetchedModels;
    if (!raw?.data) {
      return { providerList: [], modelMap: {}, allModels: [] };
    }

    const data = raw.data;
    const providers = [];
    const map = {};
    const all = [];

    data.forEach((prov) => {
      if (prov.provider && Array.isArray(prov.models)) {
        providers.push(prov.provider);
        const names = prov.models
        .map((m) => ({
          name: m.name,
          value: m.model_name,
        }))
        .filter(Boolean);
  
      map[prov.provider] = names.sort((a, b) =>
        a.name.localeCompare(b.name)
      );
  
      all.push(...names);
      }
    });
    console.log("name--->",providers,map)
    return {
      providerList: providers,
      modelMap: map,
      allModels: [...new Set(all)].sort(),
    };
  }, [modelsData, fetchedModels]);

  // ────── Initial Values ──────
  const initialValues = isTerm
    ? {
      name: node.data.label || '',
      description: node.data.description || '',
      outputPreview: node.data.outputPreview || 'Thank you!',
    }
    : {
      name: node.data.label || '',
      description: node.data.description || '',
      role: node.data.role || '',
      goal: node.data.goal || '',
      backstory: node.data.backstory || '',
      interaction: node.data.interaction || '',
      memory: node.data.memory ?? false,

      provider: node.data.provider || '',
      model: node.data.model || 'gpt-4o',
      apiKey: node.data.apiKey || '',
      temperature: node.data.temperature ?? 0.7,
      maxTokens: node.data.maxTokens ?? 1000,
      topP: node.data.topP ?? 1.0,

      llm: node.data.llm || 'google/gemini-2.5-flash',
      function_calling_llm: node.data.function_calling_llm || 'None',
      verbose: node.data.verbose === 'True',
      allow_delegation: node.data.allow_delegation === 'True',
      max_iter: node.data.max_iter ?? 20,
      max_rpm: node.data.max_rpm ?? '',
      max_execution_time: node.data.max_execution_time ?? '',
      max_retry_limit: node.data.max_retry_limit ?? 2,
      allow_code_execution: node.data.allow_code_execution === 'True',
      code_execution_mode: node.data.code_execution_mode || 'safe',
      respect_context_window: node.data.respect_context_window === 'True',
      use_system_prompt: node.data.use_system_prompt === 'True',
      multimodal: node.data.multimodal === 'True',
      inject_date: node.data.inject_date === 'True',
      date_format: node.data.date_format || '%Y-%m-%d',
      reasoning: node.data.reasoning === 'True',
      max_reasoning_attempts: node.data.max_reasoning_attempts ?? '',
      knowledge_sources: node.data.knowledge_sources ?? '',
      embedder: node.data.embedder ?? '',
      system_template: node.data.system_template ?? '',
      prompt_template: node.data.prompt_template ?? '',
      response_template: node.data.response_template ?? '',
    };

  // ────── Model Info ──────
  const modelInfo = {
    'gpt-4o': 'Best for reasoning + coding + agents. Fast & capable.',
    'gpt-4o-mini': 'Super fast + cheap. Great for lightweight agents.',
    'gpt-4': 'Strong reasoning, slightly slower.',
    'llama-3.2': 'Open-source, high flexibility. Self-hosted or via API.',
    'claude-3.7': 'Very good writing + analysis. Strong safety.',
    'google/gemini-2.0-flash': 'Fast multimodal AI by Google. Great for text + vision.',
    'google/gemini-2.5-flash': 'Latest Gemini flash – ultra-fast & cheap.',
  };

  const [tab, setTab] = React.useState('agent');

  // ────── Accordion Component ──────
  const Accordion = ({ title, icon: Icon, children, defaultOpen = false }) => {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-800">{title}</span>
          </div>
          {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
        {open && <div className="p-4 bg-white space-y-4">{children}</div>}
      </div>
    );
  };

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200">
      {/* ────── HEADER ────── */}
      <div className="p-5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${isTerm
                ? 'bg-gradient-to-br from-red-500 to-rose-600'
                : 'bg-gradient-to-br from-purple-400 to-purple-600'
              }`}
          >
            {isTerm ? <Terminal className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
          </div>
          <h3 className="font-semibold text-gray-900">
            {isTerm ? 'Configure Output' : 'Configure Agent'}
          </h3>
        </div>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ────── TABS ────── */}
      {!isTerm && (
        <div className="flex border-b border-gray-200">
          {[
            { id: 'agent', label: 'Agent', icon: Bot },
            { id: 'model', label: 'Model', icon: HardDrive },
            { id: 'advanced', label: 'Advanced', icon: Settings },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all ${tab === t.id
                    ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ────── FORM ────── */}
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        enableReinitialize={true}
        onSubmit={(values) => {
          const updated = {
            label: values.name,
            name: values.name,
            description: values.description,
          };

          if (isTerm) {
            updated.outputPreview = values.outputPreview;
          } else {
            Object.assign(updated, {
              provider: values.provider,
              model: values.model,
              apiKey: values.apiKey,
              temperature: values.temperature,
              maxTokens: values.maxTokens,
              topP: values.topP,
              role: values.role,
              goal: values.goal,
              backstory: values.backstory,
              interaction: values.interaction,
              memory: values.memory,
              llm: values.llm,
              function_calling_llm: values.function_calling_llm,
              verbose: values.verbose,
              allow_delegation: values.allow_delegation,
              max_iter: values.max_iter,
              max_rpm: values.max_rpm,
              max_execution_time: values.max_execution_time,
              max_retry_limit: values.max_retry_limit,
              allow_code_execution: values.allow_code_execution,
              code_execution_mode: values.code_execution_mode,
              respect_context_window: values.respect_context_window,
              use_system_prompt: values.use_system_prompt,
              multimodal: values.multimodal,
              inject_date: values.inject_date,
              date_format: values.date_format,
              reasoning: values.reasoning,
              max_reasoning_attempts: values.max_reasoning_attempts,
              knowledge_sources: values.knowledge_sources,
              embedder: values.embedder,
              system_template: values.system_template,
              prompt_template: values.prompt_template,
              response_template: values.response_template,
            });
          }

          onUpdate(updated);
          onClose();
        }}
      >
        {({ values, setFieldValue, isValid, dirty }) => {
          // Auto-select provider if model is known
          useEffect(() => {
            if (values.model && !values.provider && modelMap) {
              const found = Object.entries(modelMap).find(([_, models]) =>
                models.includes(values.model)
              );
              if (found) {
                setFieldValue('provider', found[0]);
              }
            }
          }, [values.model, values.provider, modelMap, setFieldValue]);

          const filteredModels = values.provider ? modelMap[values.provider] || [] : [];

          return (
            <Form className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* ────── TERM CONFIG ────── */}
                {isTerm && (
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Output Name</label>
                      <Field
                        name="name"
                        type="text"
                        placeholder="e.g. Final Response"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                      <Field
                        name="description"
                        as="textarea"
                        rows={2}
                        placeholder="What is this output?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Final Message</label>
                      <Field
                        name="outputPreview"
                        as="textarea"
                        rows={8}
                        placeholder="Thank you!"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none font-mono text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* ────── AGENT TAB ────── */}
                {!isTerm && tab === 'agent' && (
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Agent Name</label>
                      <Field
                        name="name"
                        type="text"
                        placeholder="e.g. Customer Support"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                      <Field
                        name="description"
                        as="textarea"
                        rows={2}
                        placeholder="What does this agent do?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                      <Field
                        name="role"
                        type="text"
                        placeholder="e.g. Support Specialist"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <ErrorMessage name="role" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Goal</label>
                      <Field
                        name="goal"
                        type="text"
                        placeholder="e.g. Resolve 90% of tickets"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <ErrorMessage name="goal" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Backstory</label>
                      <Field
                        name="backstory"
                        as="textarea"
                        rows={5}
                        placeholder="A brief history..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    {/* <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Interaction Prompt</label>
                      <Field
                        name="interaction"
                        as="textarea"
                        rows={5}
                        placeholder="How should the agent talk to the user?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer p-4 border-2 border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all">
                      <Field type="checkbox" name="memory" className="w-5 h-5 text-green-600 rounded focus:ring-green-500" />
                      <div>
                        <div className="text-sm font-semibold text-gray-800">Enable Long-Term Memory</div>
                        <div className="text-xs text-gray-500 mt-1">Remembers past conversations across sessions</div>
                      </div>
                    </label> */}
                  </div>
                )}

                {/* ────── MODEL TAB ────── */}
                {!isTerm && tab === 'model' && (
                  <div className="p-6 space-y-6">
                    {/* Provider Select */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Provider
                      </label>
                      {isModelsLoading && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading providers...
                        </div>
                      )}
                      {isModelsError && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          Failed to load providers
                        </div>
                      )}
                      <Field
                        as="select"
                        name="provider"
                        disabled={isModelsLoading || isModelsError || providerList.length === 0}
                        onChange={(e) => {
                          const prov = e.target.value;
                          setFieldValue('provider', prov);
                          setFieldValue('model', ''); // reset model
                        }}
                        className="mt-1 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white disabled:opacity-50"
                      >
                        <option value="">-- Select Provider --</option>
                        {providerList.map((p) => (
                          <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1).replace(/_/g, ' ')}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="provider" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    {/* Model Select */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Model
                      </label>
                      {isModelsLoading && !values.provider && (
                        <div className="text-sm text-gray-500">Select a provider first</div>
                      )}
                      <Field
                        as="select"
                        name="model"
                        disabled={
                          isModelsLoading ||
                          isModelsError ||
                          !values.provider ||
                          filteredModels.length === 0
                        }
                        className="mt-1 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white disabled:opacity-50"
                      >
                        {values.model && !filteredModels.includes(values.model) && (
                          <option value={ values.model}>{values.model} (current)</option>
                        )}
                        {filteredModels.map((m) => (
                          <option key={m} value={m.value}>
                            {m?.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="model" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                      <Field
                        name="apiKey"
                        type="password"
                        placeholder="Enter your API key"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <ErrorMessage name="apiKey" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Temperature: {values.temperature}
                      </label>
                      <Field
                        name="temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Precise (0)</span>
                        <span>Balanced (1)</span>
                        <span>Creative (2)</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Max Completion Tokens</label>
                      <Field
                        name="maxTokens"
                        type="number"
                        min="100"
                        max="4000"
                        step="100"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                      <p className="text-xs text-gray-500 mt-1">Maximum length of generated response</p>
                    </div>

                    {/* Top P */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Top P: {values.topP}
                      </label>
                      <Field
                        name="topP"
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Focused (0)</span>
                        <span>Diverse (1)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ────── ADVANCED TAB ────── */}
                {!isTerm && tab === 'advanced' && (
                  <div className="p-6 space-y-4">
                    {/* LLM Selection */}
                    <Accordion title="LLM Settings" icon={Brain} defaultOpen>
                      {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">LLM</label>
                        <Field
                          as="select"
                          name="llm"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash</option>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                          <option value="claude-3.7">Claude 3.7</option>
                        </Field>
                      </div> */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Function-Calling LLM
                        </label>
                        <Field
                          name="function_calling_llm"
                          type="text"
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <label className="flex items-center gap-2 mt-3">
                        <Field type="checkbox" name="verbose" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Verbose</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <Field type="checkbox" name="allow_delegation" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Allow Delegation</span>
                      </label>
                    </Accordion>

                    {/* Execution Limits */}
                    <Accordion title="Execution Limits" icon={Clock}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Iterations
                          </label>
                          <Field
                            name="max_iter"
                            type="number"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max RPM
                          </label>
                          <Field
                            name="max_rpm"
                            type="text"
                            placeholder="None"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Execution Time (s)
                          </label>
                          <Field
                            name="max_execution_time"
                            type="text"
                            placeholder="None"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Max Retry Limit
                          </label>
                          <Field
                            name="max_retry_limit"
                            type="number"
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    </Accordion>

                    {/* Code Execution */}
                    <Accordion title="Code Execution" icon={Code}>
                      <label className="flex items-center gap-2">
                        <Field type="checkbox" name="allow_code_execution" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Allow Code Execution</span>
                      </label>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Execution Mode
                        </label>
                        <Field
                          as="select"
                          name="code_execution_mode"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="safe">Safe</option>
                          <option value="None">None</option>
                        </Field>
                      </div>
                    </Accordion>

                    {/* Context & Prompting */}
                    <Accordion title="Context & Prompting" icon={FileText}>
                      <label className="flex items-center gap-2">
                        <Field type="checkbox" name="respect_context_window" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Respect Context Window</span>
                      </label>

                      <label className="flex items-center gap-2 mt-2">
                        <Field type="checkbox" name="use_system_prompt" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Use System Prompt</span>
                      </label>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          System Template
                        </label>
                        <Field
                          name="system_template"
                          as="textarea"
                          rows={3}
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prompt Template
                        </label>
                        <Field
                          name="prompt_template"
                          as="textarea"
                          rows={3}
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Response Template
                        </label>
                        <Field
                          name="response_template"
                          as="textarea"
                          rows={3}
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                        />
                      </div>
                    </Accordion>

                    {/* Multimodal & Date */}
                    <Accordion title="Multimodal & Date" icon={Calendar}>
                      <label className="flex items-center gap-2">
                        <Field type="checkbox" name="multimodal" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Multimodal</span>
                      </label>

                      <label className="flex items-center gap-2 mt-2">
                        <Field type="checkbox" name="inject_date" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Inject Date</span>
                      </label>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date Format
                        </label>
                        <Field
                          name="date_format"
                          type="text"
                          placeholder="%Y-%m-%d"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </Accordion>

                    {/* Reasoning & Knowledge */}
                    <Accordion title="Reasoning & Knowledge" icon={Brain}>
                      <label className="flex items-center gap-2">
                        <Field type="checkbox" name="reasoning" className="w-4 h-4 text-purple-600 rounded" />
                        <span className="text-sm text-gray-700">Enable Reasoning</span>
                      </label>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Reasoning Attempts
                        </label>
                        <Field
                          name="max_reasoning_attempts"
                          type="text"
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Knowledge Sources
                        </label>
                        <Field
                          name="knowledge_sources"
                          type="text"
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Embedder
                        </label>
                        <Field
                          name="embedder"
                          type="text"
                          placeholder="None"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </Accordion>
                  </div>
                )}
              </div>

              {/* ────── FOOTER ────── */}
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-white font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isValid || !dirty}
                  className={`px-5 py-2 text-white rounded-lg font-medium shadow-md hover:scale-105 transition-all ${isTerm
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:opacity-50'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50'
                    }`}
                >
                  {isTerm ? 'Save Output' : 'Save Agent'}
                </button>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
}