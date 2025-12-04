// src/components/Pages/FlowPage/CreateFlow.jsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Play, Settings, Plus } from 'lucide-react';
import { TbArrowBackUp } from "react-icons/tb";
import { FaArrowLeft } from "react-icons/fa6"; // Import FaArrowLeft
import { useFormik } from 'formik';
import { toast } from 'react-hot-toast';
import TestTab from './TestTab';

import { nodeTypes } from './FlowNode/FlowNodes';
import AgentPicker from './AgentPicker';
import NodeSidebar from './NodeSidebar';
import TriggerPanel from './TriggerPanel';
import ConfigPanel from './FlowNode/ConfigPanel';
import TaskConfigPanel from './FlowNode/ConfigPanels/otherToolconfigPanel/TaskConfigPanel';
import ToolConfigPanel from './FlowNode/ConfigPanels/ToolConfigPanel';
import { useSelector } from 'react-redux';

import ConfigPanelRouter from './FlowNode/ConfigPanelRouter';
import Header from '../../common/Header';
import {
  useCreateWorkflowMutation,
  useUpdateWorkflowMutation,
  useTriggerAgentSetupMutation,
  useRunAgentQueryMutation,
  useGetWorkflowByIdQuery
} from '../../../redux/services/workflowServices';


export default function CreateFlow({ closeModal, onSaveFlow, initialFlow }) {
  /* ------------------- REDUX MUTATIONS ------------------- */
  const [createWorkflow, { isLoading: isCreating }] = useCreateWorkflowMutation();
  const [updateWorkflow, { isLoading: isUpdating }] = useUpdateWorkflowMutation();
  const [triggerAgentSetup] = useTriggerAgentSetupMutation();
  const [runAgentQuery] = useRunAgentQueryMutation();

  /* ------------------- STATE ------------------- */
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [showPicker, setShowPicker] = useState(!initialFlow?.id);

  const [agentType, setAgentType] = useState(initialFlow?.agentType || null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTrigger, setShowTrigger] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configNodeId, setConfigNodeId] = useState(null);
  const [initialMsg, setInitialMsg] = useState(
    initialFlow?.initialMessage ||
    'Hi there!\nMy name is Nathan. How can I assist you today?'
  );
  const [currentWorkflowId, setCurrentWorkflowId] = useState(initialFlow?.id || "");
  const userId = useSelector((state) => state?.auth?.user?.id);

  // Fetch workflow data if initialFlow has an ID
  const { data: workflowData, isLoading: isLoadingWorkflow, isError: isWorkflowError } = useGetWorkflowByIdQuery(
    { id: initialFlow?.id },
    { skip: !initialFlow?.id } // Skip query if no ID
  );
  const startId = 'start-1';
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  useEffect(() => {
    if (!initialFlow?.id) {
      setNodes([
        {
          id: startId,
          type: 'start',
          position: { x: 250, y: 100 },
          data: {
            triggerLabel: null,
            onConfigure: () => setShowTrigger(true),
          },
        },
      ]);
    }
  }, []);

  /* ------------------- LOAD WORKFLOW DATA ------------------- */
  useEffect(() => {
    if (workflowData?.success && workflowData?.data) {
      const flowData = workflowData.data;
      console.log("By Id base  Workflow data --->>", flowData);

      // Set agent type
      if (flowData.agentType) {
        setAgentType(flowData.agentType);
      }

      // Transform nodes from API response to ReactFlow format (initial pass)
      let transformedNodes = flowData.nodes.map((node) => {
        const baseNode = {
          id: node.id,
          position: node.position || { x: 0, y: 0 },
          data: {
            ...node.data,
            onConfigure: () => {
              setConfigNodeId(node.id);
              setShowConfig(true);
            },
            onDelete: () => {
              setNodes((nds) => nds.filter((n) => n.id !== node.id));
              setEdges((eds) =>
                eds.filter((e) => e.source !== node.id && e.target !== node.id)
              );
            },
          },
        };

        // Determine node type from nodeType field
        if (node.nodeType === 'agent node') {
          baseNode.type = 'agent';
          baseNode.data.label = node.data.name || 'Agent';
          baseNode.data.description = node.data.description || 'Intelligent AI assistant';
          baseNode.data.service = node.data.service; // Explicitly assign service
          console.log("Loaded Agent Node Service:", node.data.service, "for node ID:", node.id);
        } else if (node.nodeType === 'task node') {
          baseNode.type = 'task';
          baseNode.data.label = node.data.task?.name || 'Task';
          baseNode.data.description = node.data.task?.description || 'Click to configure';
        } else if (node.nodeType === 'tool node') {
          baseNode.type = 'tool';
          const resolvedToolName = node.data.toolName || node.data.label || 'Tool';
          baseNode.data.label = resolvedToolName;
          baseNode.data.description = node.data.description || 'Click to configure';
          // Temporarily set connected to false, will be updated in second pass
          baseNode.data.connected = false;
          // Map backend configOauth to frontend connectionData format
          if (node.data.configOauth) {
            baseNode.data.connection = {
              connectionId: node.data.configOauth.oauth_id,
              connectionName: node.data.configOauth.oauth_connecname,
            };
          }
          baseNode.data.toolName = resolvedToolName;
        } else if (node.nodeType === 'term node') {
          baseNode.type = 'term';
          baseNode.data.label = 'Termination';
          baseNode.data.description = node.data.description || 'Final response';
        } else if (node.nodeType === 'start node') {
          baseNode.type = 'start';
          baseNode.data.label = 'Start';
          baseNode.data.description = flowData.description || 'Click to set trigger';
          baseNode.data.onConfigure = () => setShowTrigger(true);
        }

        return baseNode;
      });

      // Add start node if not present before determining connected status
      const hasStartNode = transformedNodes.some(n => n.type === 'start');
      if (!hasStartNode) {
        transformedNodes.unshift({
          id: startId,
          type: 'start',
          position: { x: 250, y: 100 },
          data: {
            triggerLabel: flowData.triggerLabel || null,
            onConfigure: () => setShowTrigger(true),
          },
        });
      }

      // Second pass: Update connected status for tool nodes based on actual transformedNodes
      transformedNodes = transformedNodes.map(node => {
        if (node.type === 'tool') {
          const isConnected = flowData.edges.some(
            (edge) => edge.target === node.id &&
              transformedNodes.find(n => n.id === edge.source)?.type === 'agent'
          );
          return { ...node, data: { ...node.data, connected: isConnected } };
        }
        return node;
      });

      // Transform edges from API response to ReactFlow format
      const transformedEdges = flowData.edges.map((edge) => {
        const sourceNode = transformedNodes.find(n => n.id === edge.source);
        const targetNode = transformedNodes.find(n => n.id === edge.target);
        const isAgentToTool = sourceNode?.type === 'agent' && targetNode?.type === 'tool';

        return {
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || 'output',
          targetHandle: edge.targetHandle || 'input',
          type: 'dataEdge',
          animated: isAgentToTool,
          style: { strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
          },
        };
      });

      // Set nodes and edges
      setNodes(transformedNodes);
      setEdges(transformedEdges);

      // Set initial message if available
      if (flowData.initialMessage) {
        setInitialMsg(flowData.initialMessage);
      }

      // Set workflow ID
      setCurrentWorkflowId(flowData.id);

      toast.success('Workflow loaded successfully!');
    }
  }, [workflowData, setNodes, setEdges]);

  /* ------------------- FORMIK SETUP ------------------- */
  const formik = useFormik({
    initialValues: {
      name: initialFlow?.name || workflowData?.data?.name || 'Untitled Workflow',
      memoryEnabled: initialFlow?.memoryEnabled || workflowData?.data?.memoryEnabled || false,
      agentType: initialFlow?.agentType || workflowData?.data?.agentType || null,
      nodes: [],
      edges: [],
      initialMessage: initialFlow?.initialMessage || workflowData?.data?.initialMessage || 'Hi there!\nMy name is Nathan. How can I assist you today?',
    },
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        const payload = generatePayload();
        if (currentWorkflowId) {
          console.log("currentWorkflowId--->>",currentWorkflowId);
          console.log("update to payload--->>>", payload);
          console.log("userId--->>",userId);
          const res = await updateWorkflow({ workflow_id: currentWorkflowId, payload, updated_by: userId }).unwrap();
          onSaveFlow(); 
          if (!res?.status === "error") {
            console.log("successfully updated");
          }
          else {
            console.log("error");
          }
        } else {
          console.log("payload---->>", payload)
          const result = await createWorkflow({ "created_by": userId, "payload": payload }).unwrap();

          console.log("flow Created successfully ----->>>", result)
          setCurrentWorkflowId(result?.workflow_id);
          onSaveFlow(); 

        }
        
        closeModal?.();
      } catch (error) {
        console.error('Failed to save workflow:', error);
        toast.error(error?.data?.message || 'Failed to save workflow');
      }
    },
  });

  // Sync local state → Formik
  useEffect(() => {
    formik.setFieldValue('agentType', agentType);
    formik.setFieldValue('nodes', nodes);
    formik.setFieldValue('edges', edges);
    formik.setFieldValue('initialMessage', initialMsg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, agentType, initialMsg]);

  /* ------------------- HELPERS ------------------- */
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      const isAgentToTool = sourceNode?.type === 'agent' && targetNode?.type === 'tool';

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'dataEdge',
            animated: isAgentToTool,
            style: { strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
            sourceHandle: params.sourceHandle || 'output',
            targetHandle: params.targetHandle || 'input',
          },
          eds
        )
      );

      // If an agent node is connecting to a tool node, update the tool node's connected status
      if (isAgentToTool) {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === targetNode.id
              ? { ...n, data: { ...n.data, connected: true } }
              : n
          )
        );
      }
    },
    [setEdges, setNodes, nodes] // Added setNodes to the dependency array
  );

  const addNode = useCallback(
    (tpl) => {
      console.log("addNode received tpl: ", tpl);
      const id = `${tpl.type}-${Date.now()}`;
      const isTool = tpl.type === 'tool';

      const newNode = {
        id,
        type: tpl.type,
        position: { x: Math.random() * 400 + 300, y: Math.random() * 300 + 200 },
        data: {
          label: tpl.label,
          description: tpl.description,
          icon: tpl.toolIcon || tpl.actionIcon || tpl.icon,
          service: tpl.service || 'generic',
          // Agent defaults
          ...(tpl.type === 'agent' && {
            name: tpl.label,
            description: tpl.description,
            service: tpl.service,
            model: 'gpt-4o',
            provider: 'openai',
            apiKey: '',
            temperature: 0.7,
            maxTokens: 1000,
            topP: 1.0,
            memory: false,
            tools: [],
            role: '',
            goal: '',
            backstory: '',
            interaction: '',
            llm: 'google/gemini-2.5-flash',
            function_calling_llm: 'None',
            verbose: false,
            allow_delegation: false,
            max_iter: 20,
            max_rpm: '',
            max_execution_time: '',
            max_retry_limit: 2,
            allow_code_execution: false,
            code_execution_mode: 'safe',
            respect_context_window: true,
            use_system_prompt: true,
            multimodal: true,
            inject_date: true,
            date_format: '%Y-%m-%d',
            reasoning: false,
            max_reasoning_attempts: '',
            knowledge_sources: '',
            embedder: '',
            system_template: '',
            prompt_template: '',
            response_template: '',
          }),
          ...(tpl.service === 'knowledge_base' && {
            files: [],
            filePreviews: [],
            vectorStore: null,
          }),
          // Tool defaults
          ...(isTool && !tpl.service?.includes('knowledge') && {
            toolId: tpl.toolId || '',
            service: tpl.service || 'generic',
            icon_path: tpl.icon_path || '',
            connected: false,
            action: 'create',
            selectedObject: '',
            toolAction: '',
            inputFields: [],
            icon: tpl.icon,
            toolName: tpl.label || '', 
          }),
          ...(tpl.service === 'Serper' && {
            toolName: 'Google Search',
            description: 'Search the web using Google Search API',
            serperApiKey: '',
          }),
          ...(tpl.service === 'Sentiment' && {
            toolName: 'Sentiment Analysis',
            description: 'Analyze the sentiment of text using Sentiment Analysis API',
          }),
          ...(tpl.type === 'term' && {
            thankYouMessage: '',
            nextSteps: [],
            discountCode: '',
            followUpEmail: false,
            ctaButton: { text: '', url: '' },
            metadata: {
              flowId: '',
              trigger: 'chat',
              timestamp: '{{now}}'
            },
          }),
          ...(tpl.type === 'task' && {
            task: {
              name:tpl.label || 'Task 1',
              description: 'Research about {topic} with 2025 insights.',
              expected_output: 'Key findings summary.',
              async_execution: false,
              human_input: false,
              markdown: false,
              guardrail_max_retries: 3,
            },
          }),
          onConfigure: () => {
            setConfigNodeId(id);
            setShowConfig(true);
          },
          onDelete: () => {
            setNodes((nds) => nds.filter((n) => n.id !== id));
            setEdges((eds) =>
              eds.filter((e) => e.source !== id && e.target !== id)
            );
          },
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, setEdges]
  );

  const onNodeClick = useCallback(
    (_, node) => {
      if (node.type === 'start') {
        node.data.onConfigure?.();
      }
      else if (node.type === 'task') {
        setConfigNodeId(node.id);
        setShowConfig(true); // This will open TaskConfigPanel only
      }
      else if (['agent', 'term', 'tool'].includes(node.type)) {
        setConfigNodeId(node.id);
        setShowConfig(true);
      }
    },
    []
  );

  const updateNode = useCallback(
    (updatedData) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === configNodeId) {
            let newData = { ...n.data, ...updatedData };

            // Specifically for task nodes, update label and description from task.name and task.description
            if (n.type === 'task' && updatedData.task) {
              newData.label = updatedData.task.name || n.data.task?.name || 'Task';
              newData.description = updatedData.task.description || n.data.task?.description || 'Click to configure';
            }
            if (n.type === 'tool') {
              const updatedName = updatedData.toolName || updatedData.label;
              if (updatedName) {
                newData.toolName = updatedName;
                newData.label = updatedName;
              }
            }
            return { ...n, data: newData };
          }
          return n;
        })
      );
      setShowConfig(false);
      setConfigNodeId(null);
    },
    [configNodeId, setNodes]
  );

  /* ------------------- PAYLOAD GENERATOR ------------------- */
  /* ------------------- PAYLOAD GENERATOR (FIXED) ------------------- */
  const generatePayload = () => {
    const startNode = nodes.find((n) => n.type === 'start');

    const transformedNodes = nodes.map((node) => {
      const base = {
        id: node.id,
        nodeType:
          node.type === 'start' ? 'start node' :
            node.type === 'agent' ? 'agent node' :
              node.type === 'tool' ? 'tool node' :
                node.type === 'term' ? 'term node' :
                  node.type === 'task' ? 'task node' : 'unknown node',
        position: node.position,
        data: {},
      };

      // === START NODE ===
      if (node.type === 'start') {
        base.data = {
          triggerLabel: node.data.triggerLabel || null,
        };
        if (base.data.triggerLabel === 'Chat Message') {
          base.data.initialMessage = initialMsg;
        }
      }

      // === AGENT NODE (FIXED) ===
      else if (node.type === 'agent') {
        const { onConfigure, onDelete, icon, label, ...cleanData } = node.data;
        base.data = {
          name: cleanData.name || label || 'Agent',
          description: cleanData.description || '',
          provider: cleanData.provider || 'openai',
          model: cleanData.model || 'gpt-4o',
          service: cleanData.service || '',
          apiKey: cleanData.apiKey || '',
          temperature: cleanData.temperature ?? 0.7,
          maxTokens: cleanData.maxTokens ?? 1000,
          topP: cleanData.topP ?? 1.0,
          memory: cleanData.memory ?? false,
          tools: Array.isArray(cleanData.tools) ? cleanData.tools : [],
          role: cleanData.role || '',
          goal: cleanData.goal || '',
          backstory: cleanData.backstory || '',
          interaction: cleanData.interaction || '',
          llm: cleanData.llm || 'google/gemini-2.5-flash',
          function_calling_llm: cleanData.function_calling_llm || 'None',
          verbose: cleanData.verbose ?? false,
          allow_delegation: cleanData.allow_delegation ?? false,
          max_iter: cleanData.max_iter ?? 20,
          max_rpm: cleanData.max_rpm || '',
          max_execution_time: cleanData.max_execution_time || '',
          max_retry_limit: cleanData.max_retry_limit ?? 2,
          allow_code_execution: cleanData.allow_code_execution ?? false,
          code_execution_mode: cleanData.code_execution_mode || 'safe',
          respect_context_window: cleanData.respect_context_window ?? true,
          use_system_prompt: cleanData.use_system_prompt ?? true,
          multimodal: cleanData.multimodal ?? true,
          inject_date: cleanData.inject_date ?? true,
          date_format: cleanData.date_format || '%Y-%m-%d',
          reasoning: cleanData.reasoning ?? false,
          max_reasoning_attempts: cleanData.max_reasoning_attempts || '',
          knowledge_sources: cleanData.knowledge_sources || '',
          embedder: cleanData.embedder || '',
          system_template: cleanData.system_template || '',
          prompt_template: cleanData.prompt_template || '',
          response_template: cleanData.response_template || '',
        };
      }

      // === TOOL NODE ===
      else if (node.type === 'tool') {
        const { onConfigure, onDelete, icon, label, ...cleanData } = node.data;
        base.data = {
          service: cleanData.service || 'generic',
          connected: cleanData.connected || false,
          action: cleanData.action || 'create',
          toolId: cleanData.toolId || '',
          selectedObject: cleanData.selectedObject || '',
          toolAction: cleanData.toolAction || '',
          inputFields: Array.isArray(cleanData.inputFields)
            ? cleanData.inputFields.map(field => ({
              name: field.name,
              fillUsing: field.fillUsing,
              value: typeof field.value === 'object' && field.value !== null
                ? { name: field.value.name || '', description: field.value.description || '' }
                : field.value || ''
            }))
            : [],
          toolName: cleanData.toolName || cleanData.label || '', 
          description: cleanData.description || '',
          serperApiKey: cleanData.serperApiKey || '',
          configOauth: cleanData.configOauth ? {
            oauth_connecname: cleanData.configOauth.oauth_connecname || '',
            oauth_id: cleanData.configOauth.oauth_id || '',
          } : null,
        };
      }

      // === TASK NODE ===
      else if (node.type === 'task') {
        const { onConfigure, onDelete, icon, label, ...cleanData } = node.data;
        base.data = {
          task: {
            name: cleanData.task?.name || 'Task',
            description: cleanData.task?.description || '',
            expected_output: cleanData.task?.expected_output || '',
            // agent: cleanData.task?.agent || '',
            async_execution: cleanData.task?.async_execution ?? false,
            human_input: cleanData.task?.human_input ?? false,
            markdown: cleanData.task?.markdown ?? false,
            guardrail_max_retries: cleanData.task?.guardrail_max_retries ?? 3,
          },
        };
      }

      // === TERM NODE ===
      else if (node.type === 'term') {
        const {
          onConfigure, onDelete, icon, description, label,
          thankYouMessage, nextSteps, discountCode, followUpEmail, ctaButton, metadata,
          ...restData
        } = node.data;
        base.data = {
          thankYouMessage: thankYouMessage || '',
          nextSteps: Array.isArray(nextSteps) ? nextSteps : [],
          discountCode: discountCode || '',
          followUpEmail: followUpEmail || false,
          ctaButton: ctaButton || { text: '', url: '' },
          metadata: metadata || { flowId: '', trigger: 'chat', timestamp: '{{now}}' },
          ...restData,
        };
      }

      // === OTHER NODES ===
      else {
        const { onConfigure, onDelete, icon, ...cleanData } = node.data;
        base.data = cleanData;
      }

      return base;
    });

    const transformedEdges = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || 'output',
      targetHandle: edge.targetHandle || 'input',
      type: 'smoothstep',
      animated: true,
      markerEnd: { type: 'arrowclosed', width: 20, height: 20 },
      style: { strokeWidth: 2, stroke: '#94A3B8' },
    }));

    const payload = {
      name: formik.values.name,
      memoryEnabled: formik.values.memoryEnabled,
      agentType: agentType,
      nodes: transformedNodes,
      edges: transformedEdges,
    };

    if (startNode?.data.triggerLabel) {
      payload.triggerLabel = startNode.data.triggerLabel;
      if (startNode.data.triggerLabel === 'Chat Message') {
        payload.initialMessage = initialMsg;
      }
    }

    return payload;
  };

  const save = () => {
    formik.handleSubmit();
  };

  /* ------------------- RENDER ------------------- */
  if (isLoadingWorkflow) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (isWorkflowError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-4">Failed to load workflow</p>
          <button
            onClick={closeModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (showPicker) {
    return <AgentPicker onSelect={(t) => { setAgentType(t); setShowPicker(false); }} />;
  }

  const configNode = configNodeId ? nodes.find((n) => n.id === configNodeId) : null;
  const isSaving = isCreating || isUpdating;



  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      {/* <Header /> */}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden bg-gray-900">
        {/* Sidebar */}
        {showSidebar && <NodeSidebar onAddNode={addNode} onClose={() => setShowSidebar(false)} />}

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col relative">
          <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Back to Flows"
              >
                <TbArrowBackUp className="w-5 h-5 text-gray-600" />
              </button>
              {!showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Plus className="w-5 h-5 text-gray-600" />
                </button>
              )}
              {/* <button
                onClick={() => setShowTrigger(true)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button> */}
              <input
                type="text"
                value={formik.values.name}
                onChange={(e) => formik.setFieldValue('name', e.target.value)}
                className="text-lg font-semibold text-gray-900 border-none focus:outline-none bg-transparent px-2 min-w-[200px]"
                placeholder="Untitled Workflow"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 ml-4">
                Memory Enable
                <input
                  type="checkbox"
                  checked={formik.values.memoryEnabled}
                  onChange={(e) => formik.setFieldValue('memoryEnabled', e.target.checked)}
                  className="w-4 h-4 accent-purple-600 cursor-pointer"
                />
              </label>
              <button
                onClick={save}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setShowTestPanel(true)}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded hover:bg-teal-700 flex items-center"
              >
                <Play className="w-4 h-4 mr-2" />
                Test
              </button>
            </div>
          </header>

          <div className="flex-1 bg-gray-50">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
              minZoom={0.5}
              maxZoom={2}
              className="bg-gray-50"
            >
              <Background color="#d1d5db" gap={16} size={1} />
              <Controls className="!bg-white !border-gray-300 !shadow-lg !rounded-lg" />

              <MiniMap
                pannable
                zoomable
                nodeColor={(n) => {
                  const colors = {
                    start: '#10b981',
                    agent: '#a855f7',
                    action: '#3b82f6',
                    condition: '#f59e0b',
                    term: '#ef4444',
                    tool: '#6366f1',
                    task: '#f97316',
                  };
                  return colors[n.type] || '#e5e7eb';
                }}
                className="!bg-white !border-gray-300 !shadow-lg !rounded-lg"
                maskColor="rgba(0,0,0,0.05)"
              />
              <Panel position="top-center" className="bg-white border border-gray-200 rounded-lg shadow-md px-4 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="font-medium text-gray-700">{nodes.length} nodes</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{edges.length} connections</span>
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </div>

        {/* Task Config Panel */}
        {showConfig && configNode && configNode.type === 'task' && (
          <TaskConfigPanel
            node={configNode}
            onClose={() => {
              setShowConfig(false);
              setConfigNodeId(null);
            }}
            onUpdate={updateNode}
          />
        )}

        {/* Trigger Panel */}
        {showTrigger && (

          <TriggerPanel
            startNodeId={startId}
            nodes={nodes}
            setNodes={setNodes}
            initialMessage={initialMsg}
            setInitialMessage={setInitialMsg}
            onClose={() => setShowTrigger(false)}
          />
        )}

        {/* Test Panel */}
        {showTestPanel && (
          <TestTab
            onClose={() => setShowTestPanel(false)}
            workflowId={currentWorkflowId}
            useTriggerAgentSetupMutation={useTriggerAgentSetupMutation}
            useRunAgentQueryMutation={useRunAgentQueryMutation}
          />
        )}

        {showConfig && configNode && configNode.type === 'tool' && (
          <ToolConfigPanel
            key={configNode.id}
            node={configNode}
            onClose={() => {
              setShowConfig(false);
              setConfigNodeId(null);
            }}
            onUpdate={updateNode}
            connectionData={configNode.data.connection || null}
          />
        )}

        {/* Config Panel */}
        {showConfig && configNode && configNode.type !== 'task' && (
          <>
            {configNode.type === 'agent' && (
              <ConfigPanel
                node={configNode}
                onClose={() => {
                  setShowConfig(false);
                  setConfigNodeId(null);
                }}
                onUpdate={updateNode}
              />

            )}

            {showConfig && configNode && configNode.type === 'tool' && (
              <>
                {/* If tool is NOT connected yet, show ConfigPanelRouter for initial setup */}
                {!configNode.data.connected && configNode.type === 'tool' && (
                  <ConfigPanelRouter
                    node={configNode}
                    onClose={() => {
                      setShowConfig(false);
                      setConfigNodeId(null);
                    }}
                    onUpdate={updateNode}
                  />
                )}

                {/* If tool IS connected, show ToolConfigPanel for editing */}
                {configNode.data.connected && configNode.type === 'tool' && (
                  <>
                  <ToolConfigPanel
                    key={configNode.id}
                    node={configNode}
                    onClose={() => {
                      setShowConfig(false);
                      setConfigNodeId(null);
                    }}
                    onUpdate={updateNode}
                    connectionData={configNode.data.connection || null}
                  />
                  </>
                )}
              </>
            )}
          </>
        )}


      </div>
    </div>
  );
}