import React, { useCallback, useState, useMemo } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeToolbar ,
  ViewportPortal,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, MessageSquare, Clock, Webhook, FileText, Zap, Globe, Edit, Wrench, GitBranch, Code, Users, Trash2 } from 'lucide-react';

// === BaseHandle ===
const BaseHandle = ({ position, children, ...props }) => (
  <Handle
    type="source"
    position={position}
    {...props}
    className="w-3 h-3 bg-white border-2 border-gray-400 rounded-full shadow-md"
  >
    {children}
  </Handle>
);

// === ButtonHandle ===
const wrapperClassNames = {
  [Position.Right]: 'top-1/2 -translate-y-1/2 translate-x-[10px]',
};

const ButtonHandle = ({
  showButton = true,
  position = Position.Right,
  children,
  connectingHandleId = null,
  nodeId,
  onClick,
  ...props
}) => {
  const wrapperClassName = wrapperClassNames[position];
  const isThisHandleConnecting = connectingHandleId === `${nodeId}-${props.id}`;

  return (
    <BaseHandle position={position} id={props.id} {...props}>
      {showButton && !isThisHandleConnecting && (
        <div className={`absolute flex items-center ${wrapperClassName} pointer-events-none`}>
          <div className="bg-gray-300 h-[1px] w-10" />
          <div className="nodrag nopan pointer-events-auto" onClick={onClick}>
            {children}
          </div>
        </div>
      )}
    </BaseHandle>
  );
};

// === Placeholder Node ===
const PlaceholderNode = ({ data }) => (
  <div 
    onClick={data.onClick}
    className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition text-center"
  >
    <Plus className="w-4 h-4 mx-auto mb-3 text-gray-400" />
    <NodeToolbar isVisible={true} position={Position.Bottom} >
          <div className="text-gray-600 font-medium">Add first step...</div>
        
      
    </NodeToolbar>
  </div>
);

// === Trigger Node ===
const TriggerNode = ({ data, id, connectingHandleId }) => (
  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 min-w-[200px] relative group">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-red-50 rounded">
        <Zap className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-1">Trigger</div>
        <div className="font-semibold text-gray-800">{data.label}</div>
      </div>
    </div>
    {data.onDelete && (
      <button
        onClick={() => data.onDelete(id)}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
    <ButtonHandle 
      position={Position.Right} 
      id="right" 
      connectingHandleId={connectingHandleId} 
      nodeId={id}
      onClick={data.onPlusClick}
      showButton={!data.hasConnection}
    >
      <button className="w-8 h-8 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </button>
    </ButtonHandle>
  </div>
);

// === Action Node ===
const ActionNode = ({ data, id, connectingHandleId }) => (
  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 min-w-[200px] relative group">
    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-50 rounded">
        {data.icon || <Code className="w-5 h-5 text-blue-500" />}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-500 mb-1">Action</div>
        <div className="font-semibold text-gray-800">{data.label}</div>
      </div>
    </div>
    
    {/* Sub-items for AI Agent */}
    {data.subItems && (
      <div className="mt-4 flex items-center justify-around gap-2 pt-3 border-t border-gray-200">
        {data.subItems.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="text-xs text-gray-500">{item.label}</div>
            {item.required && <div className="text-xs text-red-500">*</div>}
            <button
              onClick={item.onClick}
              className="w-6 h-6 border-2 border-blue-400 border-dashed text-blue-500 rounded hover:bg-blue-50 flex items-center justify-center"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    )}
    
    <button
      onClick={() => data.onDelete(id)}
      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
    >
      <Trash2 className="w-3 h-3" />
    </button>
    <ButtonHandle 
      position={Position.Right} 
      id="right" 
      connectingHandleId={connectingHandleId} 
      nodeId={id}
      onClick={data.onPlusClick}
      showButton={!data.hasConnection}
    >
      <button className="w-8 h-8 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 flex items-center justify-center">
        <Plus className="w-5 h-5" />
      </button>
    </ButtonHandle>
  </div>
);

// === Right Panel ===
const RightPanel = ({ type, onSelect, onClose }) => {
  const triggers = [
    { id: 'schedule', icon: <Clock className="w-5 h-5" />, label: 'On a schedule', desc: 'Runs the flow every day, hour, or custom interval' },
    { id: 'webhook', icon: <Webhook className="w-5 h-5" />, label: 'On webhook call', desc: 'Runs the flow on receiving an HTTP request' },
    { id: 'form', icon: <FileText className="w-5 h-5" />, label: 'On form submission', desc: 'Generate webforms in n8n and pass their data to the workflow' },
    { id: 'chat', icon: <MessageSquare className="w-5 h-5" />, label: 'On chat message', desc: 'Runs the flow when a user sends a chat message with AI nodes' },
  ];

  const actions = [
    { id: 'ai', icon: <Zap className="w-5 h-5" />, label: 'AI', desc: 'Build autonomous agents, generate documents, etc.' },
    { id: 'app', icon: <Globe className="w-5 h-5" />, label: 'Action in an app', desc: 'Do something in an app like Google Sheets, Telegram' },
    { id: 'transform', icon: <Edit className="w-5 h-5" />, label: 'Data transformation', desc: 'Manipulate, filter, or summarize your data' },
    { id: 'flow', icon: <GitBranch className="w-5 h-5" />, label: 'Flow', desc: 'Branch, merge or loop through the flow' },
    { id: 'core', icon: <Wrench className="w-5 h-5" />, label: 'Core', desc: 'Run code, make HTTP requests, etc.' },
    { id: 'human', icon: <Users className="w-5 h-5" />, label: 'Human in the loop', desc: 'Wait for approval or task completion before continuing' },
  ];

  const items = type === 'trigger' ? triggers : actions;
  const title = type === 'trigger' ? 'What triggers this workflow?' : 'What happens next?';
  const subtitle = type === 'trigger' ? 'A trigger is a step that starts your workflow' : '';

  return (
    <div className="fixed right-0 top-0 h-full w-[400px] bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <input 
          type="text" 
          placeholder="Search..." 
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.map(item => (
          <div
            key={item.id}
            onClick={() => onSelect(item)}
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer mb-2 border border-transparent hover:border-gray-200 transition"
          >
            <div className="p-2 bg-gray-100 rounded mt-1">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 mb-1">{item.label}</div>
              <div className="text-xs text-gray-500">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// === Main App ===
export default function App() {
  const [showPanel, setShowPanel] = useState(null);
  const [nodeCounter, setNodeCounter] = useState(1);
  const [connectingHandleId, setConnectingHandleId] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'placeholder',
      type: 'placeholder',
      position: { x: 250, y: 200 },
      data: { 
        label: 'Placeholder',
        onClick: () => setShowPanel('trigger')
      },
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Custom edge change handler to update node connections
  const handleEdgesChange = useCallback((changes) => {
    // Check if any edge is being removed
    changes.forEach(change => {
      if (change.type === 'remove') {
        const edgeToRemove = edges.find(e => e.id === change.id);
        if (edgeToRemove) {
          // Update the source node to show + button again
          setNodes(nodes => 
            nodes.map(node => 
              node.id === edgeToRemove.source 
                ? { ...node, data: { ...node.data, hasConnection: false } }
                : node
            )
          );
        }
      }
    });
    
    // Apply the changes
    onEdgesChange(changes);
  }, [edges, setNodes, onEdgesChange]);

  // Delete node handler
  const handleDeleteNode = useCallback((nodeId) => {
    // Find edges connected to this node
    const connectedEdges = edges.filter(edge => edge.target === nodeId);
    
    // Remove the node
    setNodes(nodes => nodes.filter(node => node.id !== nodeId));
    
    // Remove edges connected to this node
    setEdges(edges => edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    // If there was an edge to this node, show + button on source node
    if (connectedEdges.length > 0) {
      connectedEdges.forEach(edge => {
        setNodes(nodes => 
          nodes.map(node => 
            node.id === edge.source 
              ? { ...node, data: { ...node.data, hasConnection: false } }
              : node
          )
        );
      });
    }
  }, [edges, setNodes, setEdges]);

  const handleTriggerSelect = useCallback((trigger) => {
    setNodes([
      {
        id: '1',
        type: 'trigger',
        position: { x: 100, y: 200 },
        data: { 
          label: trigger.label,
          onPlusClick: () => setShowPanel('action'),
          hasConnection: false,
          onDelete: handleDeleteNode
        },
      },
    ]);
    setShowPanel(null);
  }, [setNodes, handleDeleteNode]);

  const handleActionSelect = useCallback((action) => {
    setNodes(prev => {
      const lastNode = prev[prev.length - 1];
      const newId = (nodeCounter + 1).toString();
      
      setEdges(edges => [...edges, {
        id: `e${lastNode.id}-${newId}`,
        source: lastNode.id,
        target: newId,
        animated: true,
      }]);

      setNodeCounter(c => c + 1);

      // Update the last node to hide its + button
      const updatedNodes = prev.map(node => 
        node.id === lastNode.id 
          ? { ...node, data: { ...node.data, hasConnection: true } }
          : node
      );

      return [...updatedNodes, {
        id: newId,
        type: 'action',
        position: { x: lastNode.position.x + 300, y: lastNode.position.y },
        data: { 
          label: action.label,
          icon: action.icon,
          onPlusClick: () => setShowPanel('action'),
          hasConnection: false,
          onDelete: handleDeleteNode
        },
      }];
    });
    
    setShowPanel(null);
  }, [nodeCounter, setNodes, setEdges, handleDeleteNode]);

  const onConnect = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
      setConnectingHandleId(null);
      
      // Hide + button on the source node when connection is made
      setNodes(nodes => 
        nodes.map(node => 
          node.id === params.source 
            ? { ...node, data: { ...node.data, hasConnection: true } }
            : node
        )
      );
    },
    [setEdges, setNodes]
  );

  const onConnectStart = useCallback((event, { nodeId, handleId }) => {
    setConnectingHandleId(`${nodeId}-${handleId}`);
  }, []);

  const onConnectEnd = useCallback(() => {
    setConnectingHandleId(null);
  }, []);

  // Memoize nodeTypes to prevent recreation
  const nodeTypes = useMemo(() => ({
    placeholder: PlaceholderNode,
    trigger: (props) => <TriggerNode {...props} connectingHandleId={connectingHandleId} />,
    action: (props) => <ActionNode {...props} connectingHandleId={connectingHandleId} />,
  }), [connectingHandleId]);

  return (
    <div className="w-screen h-screen bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls className="bg-white shadow-lg rounded-lg" />
        <Background color="#e5e7eb" gap={20} />
      </ReactFlow>

      {showPanel && (
        <RightPanel 
          type={showPanel} 
          onSelect={showPanel === 'trigger' ? handleTriggerSelect : handleActionSelect}
          onClose={() => setShowPanel(null)}
        />
      )}
    </div>
  );
}