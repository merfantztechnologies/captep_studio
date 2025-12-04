import React, { useEffect, useState } from "react";
import { Plus, MoreHorizontal, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useGetCreatedToolsMutation } from "../redux/services/toolServices";
import { useSelector } from "react-redux";
// modal import
import ToolBaseSelectorModal from '../components/Pages/ToolPage/ToolBaseSelectorModal';
import ToolConfigPanel from '../components/Pages/FlowPage/FlowNode/ConfigPanels/ToolConfigPanel';

import { SiSalesforce, SiQuickbooks } from "react-icons/si";
import { FaSlack } from "react-icons/fa";
import { SiGooglecalendar } from "react-icons/si";
import { BiLogoPostgresql } from "react-icons/bi";
import { GiSurferVan } from "react-icons/gi";
import { MdEmail, MdOutlineSentimentVerySatisfied } from "react-icons/md";
import { FileText, Globe, Wrench } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Helper: decide icon + bg colour from `type`                        */
/* ------------------------------------------------------------------ */
const serviceIconMap = {
  salesforce: { Icon: SiSalesforce, color: "text-blue-600" },
  quickbook: { Icon: SiQuickbooks, color: "text-green-600" },
  gmail: { Icon: MdEmail, color: "text-red-700" },
  googlecalendar: { Icon: SiGooglecalendar, color: "text-blue-600" },
  slack: { Icon: FaSlack, color: "text-purple-600" },
  knowledge: { Icon: FileText, color: "text-gray-600" },
  "http request": { Icon: Globe, color: "text-indigo-600" },
  "postgres sql": { Icon: BiLogoPostgresql, color: "text-cyan-700" },
  serper: { Icon: GiSurferVan, color: "text-teal-600" },
  sentiment: { Icon: MdOutlineSentimentVerySatisfied, color: "text-pink-600" },
  default: { Icon: Wrench, color: "text-gray-600" },
};

/* ------------------------------------------------------------------ */
const ToolsPage = () => {
  const [getCreatedTools, { data: apiResponse, isLoading, isError, error }] =
    useGetCreatedToolsMutation();
  const [isToolModalOpen, setToolModalOpen] = useState(false);
  const [showToolConfig, setShowToolConfig] = useState(false);
  const [selectedToolNode, setSelectedToolNode] = useState(null);
  const handleSelectToolBase = (tool, category) => {
    setSelectedToolNode({
      data: {
        toolId: tool.termId,
        service: tool.service,
        label: tool.label,
        description: tool.description,
        icon: tool.toolIcon,
      },
    });
    setShowToolConfig(true);
    setToolModalOpen(false);
  }

  useEffect(() => {
    getCreatedTools({
      created_by: "1899b1f7-e239-467a-98f1-fbc8fb9a50a2",
    }); 
  }, [getCreatedTools]);

  /* Transform DB → UI objects */
  const tools =
    apiResponse?.data?.map((item) => {
      const typeKey = (item.type || "").toLowerCase().trim();
      const { Icon: ServiceIcon, color} = serviceIconMap[typeKey] || serviceIconMap.default;
      const displayName = item.name ?? "Untitled Tool";
      const displayType =
        typeKey === "quickbook"
        ? "Custom Connector"
        : typeKey === "slack"
        ? "Slack"
        : typeKey === "salesforce"
        ? "Salesforce"
        : typeKey === "gmail"
        ? "Gmail"
        : typeKey === "googlecalendar"
        ? "Google Calendar"
        : typeKey === "postgres sql"
        ? "Postgres SQL"
        : typeKey === "serper"
        ? "Serper Search"
        : typeKey === "sentiment"
        ? "Sentiment Analysis"
        : "Prompt Tool";

      const lastModified = formatDistanceToNow(new Date(item.updated_at), {
        addSuffix: true,
      });

      return {
        id: item.id ?? `${item.created_at}`,
        name: displayName,
        type: displayType,
        description: item.description?.trim() || "",
        Icon: ServiceIcon,
        iconBg: "bg-gray-100",
        iconColor: color,
        createdBy: item.created_by?.name || "Unknown",
        lastModified: `${item.created_by?.name || "User"} · ${lastModified}`,
      };
    }) ?? [];

  return (
    <main className="flex-1 overflow-y-auto bg-white">
      <div className="p-6">
        {/* ---------- Header ---------- */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Tools</h2>
          {/* <button
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center"
            onClick={() => setToolModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New tool
          </button> */}
        </div>
        {/* modal - TOOLS BASE TERM LIST */}
        <ToolBaseSelectorModal
          open={isToolModalOpen}
          onClose={() => setToolModalOpen(false)}
          onSelect={handleSelectToolBase}
        />
        {/* Tool Config Modal */}
        {showToolConfig && selectedToolNode && (
          <ToolConfigPanel
            node={selectedToolNode}
            onClose={() => {
              setShowToolConfig(false);
              setSelectedToolNode(null);
            }}
            onUpdate={() => {
              setShowToolConfig(false);
              setSelectedToolNode(null);
            }}
          />
        )}

        {/* ---------- Filters ---------- */}
        <div className="mb-4 flex items-center space-x-2">
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-600">
            All
          </button>
          <button className="px-3 py-1.5 text-gray-600 rounded-full text-sm hover:bg-gray-100 flex items-center border border-gray-300">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z" />
            </svg>
            Custom Connector
          </button>
          <button className="px-3 py-1.5 text-gray-600 rounded-full text-sm hover:bg-gray-100 flex items-center border border-gray-300">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10h5l-6 8v-5H7l6-8z" />
            </svg>
            Prompt
          </button>
        </div>

        {/* ---------- Loading / Error ---------- */}
        {isLoading && (
          <div className="text-center py-8 text-gray-500">Loading tools…</div>
        )}
        {isError && (
          <div className="text-center py-8 text-red-600">
            Error: {error?.data?.message ?? "Failed to load tools"}
          </div>
        )}

        {/* ---------- Table ---------- */}
        {!isLoading && !isError && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created by
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last modified ↓
                  </th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tools.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No tools found.
                    </td>
                  </tr>
                ) : (
                  tools.map((tool) => (
                    <tr key={tool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 ${tool.iconBg} rounded-lg flex items-center justify-center mr-3`}>
                            <tool.Icon className={`w-6 h-6 ${tool.iconColor}`} />
                          </div>
                          <span className="text-sm text-gray-900">
                            {tool.name}
                          </span>
                        </div>
                      </td>

                      {/* New Description Column */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div 
                          className="max-w-[250px] truncate" 
                          title={tool.description || "No description"} // Full text on hover
                        >
                          {tool.description || (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tool.type}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tool.createdBy}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {tool.lastModified}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="hover:bg-gray-100 p-1 rounded">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
};

export default ToolsPage;