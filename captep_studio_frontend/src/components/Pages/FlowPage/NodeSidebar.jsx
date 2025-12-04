// src/components/Pages/FlowPage/NodeSidebar.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Plus, X, Wrench, Bot, Zap, GitBranch, Terminal, FileText, Globe } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useGetToolsQuery } from "../../../redux/services/toolServices";
import { setTools } from "../../../redux/slices/toolSlice";

import { SiSalesforce, SiQuickbooks } from "react-icons/si";
import { FaSlack } from "react-icons/fa";
import { SiGooglecalendar } from "react-icons/si";
import { BiLogoPostgresql } from "react-icons/bi";
import { GiSurferVan } from "react-icons/gi";
import { MdEmail } from "react-icons/md";
import { MdOutlineSentimentVerySatisfied } from "react-icons/md";

// Helper: Generate unique ID
const generateId = (prefix = "node") => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export default function NodeSidebar({ onAddNode, onClose }) {
  const [activeTab, setActiveTab] = useState("nodes");
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();

  const { data, isLoading, error } = useGetToolsQuery();
  const { tools } = useSelector((state) => state.tool);
  const apiNodes = useMemo(() => data?.data?.node || [], [data]);
  const apiTools = useMemo(() => data?.data?.tool || [], [data]);

  useEffect(() => {
     
    if (data?.data?.tool) {
      dispatch(setTools(data?.data?.tool));
    } 
  }, []);

  

  // Icon Maps
  const serviceIconMap = {
    Salesforce: { Icon: SiSalesforce },
    Quickbook: { Icon: SiQuickbooks },
    Gmail: { Icon: MdEmail },
    GoogleCalendar: { Icon: SiGooglecalendar },
    Slack: { Icon: FaSlack },
    Knowledge: { Icon: FileText },
    "HTTP Request": { Icon: Globe },
    "Postgres SQL" :{Icon: BiLogoPostgresql },
    "Serper" :{Icon: GiSurferVan },
    "Sentiment" :{Icon: MdOutlineSentimentVerySatisfied },

    default: { Icon: Wrench },
  };

  const nodeTypeIcon = {
    agent: { Icon: Bot, bg: "from-purple-500 to-indigo-600" },
    task: { Icon: Zap, bg: "from-teal-400 to-emerald-600" },
    condition: { Icon: GitBranch, bg: "from-yellow-400 to-orange-600" },
    term: { Icon: Terminal, bg: "from-pink-500 to-rose-600" },
  };

  const filterItems = (items, key = "name") => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i[key]?.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q) ||
        i.sname?.toLowerCase().includes(q)
    );
  };

  // Add Node with Unique ID
  const handleAddNode = (nodeData) => {
    const id = generateId(nodeData.type); // e.g., "tool-1700001234567"
    onAddNode({ ...nodeData, id });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex flex-col shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Components</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("nodes")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === "nodes"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Nodes
        </button>
        <button
          onClick={() => setActiveTab("tools")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === "tools"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Tools
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {isLoading && <p className="text-center text-gray-500">Loading...</p>}
        {error && <p className="text-center text-red-500">Failed to load</p>}

        {/* NODES TAB */}
        {activeTab === "nodes" && !isLoading && (
          <>
            {apiNodes.map((category) => {
              const filtered = filterItems(category.list, "name");
              if (!filtered.length) return null;

              return (
                <div key={category.name}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {filtered.map((node) => {
                      const { Icon, bg } = nodeTypeIcon[node.type] || { Icon: Wrench, bg: "from-gray-400 to-gray-600" };

                      return (
                        <button
                          key={node.id}
                          onClick={() =>{
                            let agentService = undefined;
                            if (node.name === 'AI Agent') {
                              agentService = 'supervisor agent';
                            } else if (node.name === 'Assistant Agent') {
                              agentService = 'assistant agent';
                            }

                            const nodeData = {
                              type: node.type,
                              label: node.name,
                              description: node.description,
                              icon: Icon,
                              iconBg: bg,
                              ...(node.type === 'agent' && { service: agentService }), // Conditionally add service for agent nodes
                            };
                            console.log("NodeSidebar passing nodeData: ", nodeData);
                            handleAddNode(nodeData);
                          }}
                          className="w-full flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:border-blue-400 hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shadow-sm">
                            <Icon className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 text-left ml-3">
                            <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                              {node.name}
                            </div>
                            <div className="text-xs text-gray-500">{node.description}</div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* TOOLS TAB */}
        {activeTab === "tools" && !isLoading && (
          <>
            {apiTools.map((category) => {
              const filtered = filterItems(category.tools_list, "sname");
              if (!filtered.length) return null;

              return (
                <div key={category.name}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 tracking-wide">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {filtered.map((tool) => {
                      const sname = tool.sname;
                      const { Icon: ToolIcon } = serviceIconMap[sname] || serviceIconMap.default;

                      return (
                        <button
                          key={tool.id}
                          onClick={() =>
                            handleAddNode({
                              type: "tool",
                              label: sname,
                              description: tool.description || "No description",
                              service: sname,
                              toolId: tool.id, // API tool ID
                              icon: ToolIcon,
                            })
                          }
                          className="w-full flex items-center p-3 border border-gray-200 rounded-lg bg-white hover:border-blue-400 hover:shadow-md hover:bg-gradient-to-r hover:from-blue-50 hover:to-white transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ToolIcon className="w-6 h-6 text-gray-500" />
                          </div>
                          <div className="flex-1 text-left ml-3">
                            <div className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                              {sname}
                            </div>
                            <div className="text-xs text-gray-500">
                              {tool.description || "No description"}
                            </div>
                          </div>
                          <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}