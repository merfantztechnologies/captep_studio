import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Link, ChevronDown, Plus, Upload, Database } from 'lucide-react';
import { useGetIntegrationToolsMutation } from '../../../../../redux/services/toolServices';
import { setListToolOauthCollection } from '../../../../../redux/slices/toolSlice';

const TOOL_ICONS = {
  Salesforce: {
    type: 'image',
    url: 'https://login.salesforce.com/img/logo214.svg',
    color: 'teal',
  },
  Quickbook: {
    type: 'image',
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/quickbooks.svg',
    color: 'teal',
  },
  Slack: {
    type: 'image',
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
    color: 'teal',
  },
  Gmail: {
    type: 'image',
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
    color: 'teal',
  },
  GoogleCalendar: {
    type: 'image',
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlecalendar.svg',
    color: 'teal',
  },
  Knowledge: {
    type: 'icon',
    component: Database,
    color: 'cyan',
  },
  default: {
    type: 'icon',
    component: Database,
    color: 'cyan',
  },
};

export default function ToolOverviewPanel({ node, onClose, onConfigure, onAddConnection }) {
  const service = node.data.service || 'generic';
  const toolName = node.data.label || 'Tool';
  const isKnowledgeBase = service === 'knowledge_base';
  const toolId = node?.data?.toolId;

  const dispatch = useDispatch();
  const userId = useSelector((state) => state?.auth?.user?.id);
  const listToolOauthCollection = useSelector((state) => state.tool.listToolOauthCollection);

  const [getIntegrationTools, { isLoading: isIntegrationToolsLoading }] = useGetIntegrationToolsMutation();

  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // 🔥 Fetch API + Store in Redux
  useEffect(() => {
    const fetchIntegrationTools = async () => {
      if (toolId && userId) {
        try {
          const result = await getIntegrationTools({ tool_id: toolId, created_by: userId }).unwrap();
          dispatch(setListToolOauthCollection(result.data || []));
          if (result.data?.length > 0) setSelectedConnection(result.data[0]);
        } catch (error) {
          console.error("❌ Error fetching integration tools:", error);
        }
      }
    };
    fetchIntegrationTools();
  }, [toolId, userId, dispatch, getIntegrationTools]);

  // 🌈 Icon Logic
  const hasDynamicIcon = node?.data?.icon_path || "";
  const iconConfig = hasDynamicIcon
    ? { type: "image", url: node?.data?.icon_path, color: "teal" }
    : TOOL_ICONS?.[service] || TOOL_ICONS.default;

  const colorMap = {
    teal: 'from-teal-400 to-teal-600',
    cyan: 'from-cyan-400 to-cyan-600'
  };

  const filterMap = {
    teal: 'invert(53%) sepia(98%) saturate(2841%) hue-rotate(178deg) brightness(101%) contrast(101%)',
    cyan: 'invert(35%) sepia(98%) saturate(2841%) hue-rotate(160deg) brightness(95%) contrast(101%)'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-xl shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Add Tool</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tool Info */}
        <div className="text-center py-10">
          <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center">
            {iconConfig?.type === 'image' ? (
              <img
                src={iconConfig.url}
                
                alt={service}
                className="w-20 h-20"
                style={{ filter: filterMap[iconConfig.color || 'cyan'] }}
              />
            ) : (
              <div className={`w-20 h-20 bg-gradient-to-br ${colorMap[iconConfig.color || 'cyan']} rounded-xl flex items-center justify-center shadow-md`}>
                {React.createElement(iconConfig.component, { className: "w-10 h-10 text-white" })}
              </div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{toolName}</h3>
          <p className="text-sm text-gray-600 capitalize">{service.replace('_', ' ')}</p>
        </div>

        {/* Connection Section */}
        {!isKnowledgeBase && (
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Connection</span>
              <div className="relative  ">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Link className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {selectedConnection ? selectedConnection.name : "Select Connection"}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z- 20 max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {listToolOauthCollection?.length > 0 ? (
                        listToolOauthCollection.map((conn) => (
                          <button
                            key={conn.id}
                            onClick={() => {
                              setSelectedConnection(conn);
                              setShowDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedConnection?.id === conn.id ? 'bg-teal-50 text-teal-700' : ''
                              }`}
                          >
                            <span>{conn.name}</span>
                            {selectedConnection?.id === conn.id && (
                              <span className="text-xs text-teal-600">Selected</span>
                            )}
                          </button>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 px-3 py-2">No connections found</p>
                      )}

                      <div className="mt-2 pt-2 border-t">
                        <button
                          onClick={() => onAddConnection()}
                          className="w-full text-left px-3 py-2 text-sm text-teal-600 hover:bg-teal-50 rounded-md flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Create new connection
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 mt-6">
          {!isKnowledgeBase && (
            <button
              onClick={() => onConfigure(selectedConnection?.id)}
              className="px-6 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm"
            >
              Add and Configure
            </button>
          )}
          {isKnowledgeBase && (
            <button
              onClick={() => onConfigure(selectedConnection?.id)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
