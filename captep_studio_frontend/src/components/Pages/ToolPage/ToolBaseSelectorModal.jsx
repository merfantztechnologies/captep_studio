// src/components/Pages/ToolPage/ToolBaseSelectorModal.jsx
import React, { useEffect, useMemo } from "react";
import { X } from "lucide-react";
import Modal from "react-modal";
import { useSelector, useDispatch } from "react-redux";
import {
  SiSalesforce,
  SiQuickbooks,
  SiGooglecalendar,
} from "react-icons/si";
import { FaSlack } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FileText, Database } from "lucide-react";
import { useGetToolsQuery } from "../../../redux/services/toolServices";
import { setTools } from '../../../redux/slices/toolSlice';

/* -------------------------------------------------
   Icon map – same keys you use in NodeSidebar
   ------------------------------------------------- */
const serviceIconMap = {
  salesforce: SiSalesforce,
  quickbooks: SiQuickbooks,
  gmail: MdEmail,
  googlecalendar: SiGooglecalendar,
  slack: FaSlack,
  knowledge_base: Database,
  default: FileText,
};

/* -------------------------------------------------
   Gradient map – keep the same colours you had
   ------------------------------------------------- */
const gradientMap = {
  salesforce: "from-blue-400 to-blue-600",
  quickbooks: "from-green-400 to-green-600",
  gmail: "from-red-400 to-red-600",
  googlecalendar: "from-blue-400 to-blue-600",
  slack: "from-purple-400 to-purple-600",
  knowledge_base: "from-cyan-400 to-cyan-600",
  default: "from-indigo-400 to-indigo-600",
};

/* -------------------------------------------------
   Transform a tool term into a modal-presentable object
   ------------------------------------------------- */
const termToTool = (term) => {
  const service = (term.sname || "").toLowerCase().replace(/\s+/g, "_");
  const Icon = serviceIconMap[service] ?? serviceIconMap.default;
  const bg = gradientMap[service] ?? gradientMap.default;
  return {
    type: "tool",
    label: term.sname,
    description: term.description || "No description",
    iconBg: bg,
    toolIcon: <Icon className="w-5 h-5 text-white" />,
    service,
    termId: term.id,
  };
};

export default function ToolBaseSelectorModal({ open, onClose, onSelect }) {
  const dispatch = useDispatch();
  const { data: toolsApiData, isLoading, error } = useGetToolsQuery();
  const tools = useSelector((state) => state.tool.tools);
  console.log("Tools data --->>", tools)

  useEffect(() => {
    if (toolsApiData?.data?.tool) {
      dispatch(setTools(toolsApiData.data.tool));
    }
  }, [toolsApiData, dispatch]);

  // Prepare tool terms grouped by category
  const grouped = useMemo(() => {
    if (!Array.isArray(tools)) return [];
    const map = new Map();
    tools.forEach((cat) => {
      const categoryName = cat.name || "Other";
      const list = Array.isArray(cat.tools_list) ? cat.tools_list.map(termToTool) : [];
      map.set(categoryName, list);
    });
    return Array.from(map.entries()).map(([category, tools]) => ({ category, tools }));
  }, [tools]);

  return (
    <Modal
      isOpen={open}
      onRequestClose={onClose}
      ariaHideApp={false}
      className="fixed inset-0 flex items-center justify-center z-50 p-2"
      overlayClassName="fixed inset-0 bg-black/50 z-40"
    >
      <div className="bg-white w-full max-w-2xl rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-lg mb-4 font-bold text-gray-800">
          New Tool
        </h3>
        {isLoading && <div className="py-10 text-center text-gray-500">Loading tool types…</div>}
        {error && <div className="py-10 text-center text-red-500">Error loading. Please try again.</div>}
        {!isLoading && !error && (
          grouped.length === 0 ? (
            <div className="text-gray-500 text-center">No tool terms found.</div>
          ) : (
            grouped.map(({ category, tools }) => (
              <div key={category} className="mb-6">
                <div className="mb-2 text-xs text-gray-600 font-semibold uppercase tracking-wide">
                  {category}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tools.map((tool, idx) => (
                    <button
                      key={`${tool.label}-${idx}`}
                      onClick={() => onSelect?.(tool, { category })}
                      className="flex items-center border border-gray-200 rounded-lg p-3 hover:bg-blue-50 transition group w-full text-left"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${tool.iconBg} flex items-center justify-center shadow mr-3`}>
                        {tool.toolIcon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 mb-0.5">
                          {tool.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {tool.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )
        )}
      </div>
    </Modal>
  );
}