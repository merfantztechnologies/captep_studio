import React, { useState, useEffect, useCallback } from "react";
import {
  Home,
  Plus,
  MoreHorizontal,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import Modal from "react-modal";
import CreateFlow from "../components/Pages/FlowPage/CreateFlow";
import { useGetAllWorkflowsQuery } from "../redux/services/workflowServices";
import { useSelector, useDispatch } from 'react-redux';
import { setWorkflows } from '../redux/slices/workflowSlice';
import { formatDistanceToNow } from "date-fns";


Modal.setAppElement("#root");

const FlowsPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userId = useSelector((state) => state?.auth?.user?.id);
  const dispatch = useDispatch();
  const { data, isLoading, isError, refetch } = useGetAllWorkflowsQuery({ "created_by": userId });
  useEffect(() => {
    if (data?.data) {
      console.log("dispatch board refetching ");
      dispatch(setWorkflows({ workflows: data.data }));
    }
  }, [data, dispatch]);
  const openModal = (flow = null) => {
    setSelectedFlow(flow);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFlow(null);
    setIsModalOpen(false);
  };
  const sortedFlows = useSelector((state) => state.workflow.workflows)
  ? [...useSelector((state) => state.workflow.workflows)].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
  : [];
   
  const handleSaveFlow = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await refetch();
      const latestWorkflows = refreshed?.data?.data;
      if (latestWorkflows) {
        dispatch(setWorkflows({ workflows: latestWorkflows }));
      }
    } catch (error) {
      console.error("Failed to refetch workflows after save:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, dispatch]);

  console.log("sortedFlows---->>>", sortedFlows);

  return (
    <div className="flex flex-col h-full">
  
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Agent Flows
        </h2>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative max-w-4xl mx-auto">
            <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-3 shadow-sm">
              <svg
                className="w-6 h-6 text-blue-500 mr-3"
                viewBox="0 0 24 24"
              >
                <circle cx="8" cy="8" r="2" fill="#FF6B6B" />
                <circle cx="16" cy="8" r="2" fill="#4ECDC4" />
                <circle cx="12" cy="16" r="2" fill="#FFE66D" />
                <path
                  d="M8 10v4M16 10v4M12 8v8"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
              <input
                type="text"
                placeholder="What would you like your flow to do?"
                className="flex-1 outline-none text-gray-700 placeholder-gray-400"
              />
              <button className="ml-3 text-blue-600 hover:text-blue-700">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* New Flow Button */}
        <div className="mb-6">
          <button
            onClick={() => openModal()}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Agent Flow
          </button>
        </div>

        {/* Saved Flows */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Saved Flows
          </h3>

          {/* 🌀 Loading / Error / Data states */}
          {isLoading && (
            <p className="text-gray-600 animate-pulse">Loading flows...</p>
          )}
          {isError && (
            <p className="text-red-600">
              Something went wrong. Please try again.
            </p>
          )}

          {!isLoading && data?.data?.length === 0 && (
            <p className="text-gray-600">No flows created yet.</p>
          )}

          {isRefreshing && (
            <p className="flex items-center gap-2 text-sm text-blue-600 mb-2">
              <span className="w-3 h-3 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
              Refreshing latest flows...
            </p>
          )}

          {!isLoading && data?.data?.length > 0 && (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Modified
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedFlows.map((flow) => {
                  const lastModified = formatDistanceToNow(
                    new Date(flow.updated_at),
                    { addSuffix: true }
                  );

                  return (
                    <tr
                      key={flow.id}
                      onClick={() => openModal(flow)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {/* Name */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3 text-white font-bold text-sm">
                            F
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {flow.name}
                          </span>
                        </div>
                      </td>

                      {/* Created By */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flow.created_by?.name || "Unknown"}
                      </td>

                      {/* Last Modified → "5 minutes ago" */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {lastModified}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Add more actions later
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for CreateFlow */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={closeModal}
          className="fixed inset-0 bg-gray-50 m-0 p-0 overflow-hidden"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
          style={{
            content: {
              top: "0",
              left: "0",
              right: "0",
              bottom: "0",
              border: "none",
              borderRadius: "0",
            },
          }}
        >
          <CreateFlow
            closeModal={closeModal}
            initialFlow={selectedFlow}
            // flowId={selectedFlow?.id}
            onSaveFlow={handleSaveFlow} // Call refetch + store sync when flow is saved
          />
        </Modal>
        </div>
      </main>
    </div>
  );
};

export default FlowsPage;
