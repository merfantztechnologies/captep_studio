// src/components/Pages/Agents.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Plus, MoreHorizontal, Bot } from 'lucide-react';
import AgentOverview from '../components/Pages/AgentPage/AgentOverview';
import { formatDistanceToNow } from 'date-fns';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectAgents,
  selectSelectedAgent,
  selectAgentLoading,
  selectAgentError,
  setAgents,
  setSelectedAgent,
  setLoading,
  setError,
} from '../redux/slices/agentSlice';
import { useGetAllAgentsMutation } from '../redux/services/agentServices';

const RANDOM_COLORS = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-indigo-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-cyan-500',
  'bg-lime-500',
];

const AgentsPage = () => {
  const dispatch = useDispatch();

  // ---- Redux selectors -------------------------------------------------
  const agents = useSelector(selectAgents);
  const selectedAgent = useSelector(selectSelectedAgent);
  const isLoading = useSelector(selectAgentLoading);
  const error = useSelector(selectAgentError);
  const userId = "1899b1f7-e239-467a-98f1-fbc8fb9a50a2";

  const [getAllAgents] = useGetAllAgentsMutation();

  // Track if we're creating a new agent
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // ---- Search state ----------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('');

  // ---- Filter agents (memoised – runs only when agents or searchTerm change)
  const filteredAgents = useMemo(() => {
    if (!searchTerm.trim()) return agents;
    const lower = searchTerm.toLowerCase();
    return agents.filter(a => a.name.toLowerCase().includes(lower));
  }, [agents, searchTerm]);

  // ---- Fetch agents ----------------------------------------------------
  const fetchAgents = () => {
    if (!userId) return;

    dispatch(setLoading(true));

    getAllAgents({ userId })
      .unwrap()
      .then((res) => {
        if (res.status === 'success') {
          const mapped = res.data.map((a, idx) => {
            const bg = RANDOM_COLORS[idx % RANDOM_COLORS.length];
            return {
              id: a.id,
              name: a.name,
              created_at: a.created_at,
              updated_at: a.updated_at,
              owner: a.created_by || 'Unknown',
              task: a.task || '—',           // ← NEW: task name
              workflow: a.workflow || '—',   // ← NEW: workflow name
              icon: <Bot />,
              bg,
            };
          });
          dispatch(setAgents(mapped));
        } else {
          dispatch(setError(res.message || 'Unknown error'));
        }
      })
      .catch((err) => {
        console.error(err);
        dispatch(setError(err?.data?.message || err.message || 'Network error'));
      })
      .finally(() => dispatch(setLoading(false)));
  };

  console.log("fetchAgents --->>", fetchAgents)

  useEffect(() => {
    fetchAgents();
  }, [userId]);

  // ---- Handlers --------------------------------------------------------
  const openAgentOverview = (agent) => {
    setIsCreatingNew(false);
    dispatch(setSelectedAgent(agent));
  };

  const handleNewAgent = () => {
    setIsCreatingNew(true);
    dispatch(setSelectedAgent(null));
  };

  const closeAgentOverview = () => {
    setIsCreatingNew(false);
    dispatch(setSelectedAgent(null));
    fetchAgents(); // refresh list after edit/create
  };

  // ----------------------------------------------------------------------
  return (
    <main className="flex-1 overflow-y-auto bg-white">
      {/* Loading / Error UI */}
      {isLoading && !selectedAgent && !isCreatingNew && (
        <div className="p-6 text-center">Loading agents…</div>
      )}
      {error && !selectedAgent && !isCreatingNew && (
        <div className="p-6 text-red-600">
          Error loading agents: {error}
        </div>
      )}

      {/* Show AgentOverview if creating new or editing existing */}
      {(isCreatingNew || selectedAgent) ? (
        <AgentOverview
          agent={selectedAgent}
          onClose={closeAgentOverview}
          isCreateMode={isCreatingNew}
        />
      ) : (
        /* Main list view */
        <>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Agents</h2>
              <div className="flex items-center space-x-3">
                {/* Uncomment when you want the New agent button back
                <button
                  onClick={handleNewAgent}
                  className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New agent
                </button>
                */}
              </div>
            </div>

            {/* Search Box */}
            <div className="mb-6 flex">
              <div className="relative w-100">
                <svg
                  className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search agents"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 text-sm w-full focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>
            </div>

            {/* All Agents Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Workflow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last modified
                    </th>
                    

                    {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last published
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAgents.length > 0 ? (
                    filteredAgents.map((agent) => {
                      const modified = agent.updated_at || agent.created_at;
                      const timeAgo = modified
                        ? formatDistanceToNow(new Date(modified), { addSuffix: true })
                        : '';

                      return (
                        <tr
                          key={agent.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => openAgentOverview(agent)}
                        >
                          {/* Icon + Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div
                                className={`w-10 h-10 ${agent.bg} rounded-lg flex items-center justify-center mr-3 text-white font-bold text-lg`}
                              >
                                {agent.icon}
                              </div>
                              <span className="text-sm text-gray-900">{agent.name}</span>
                            </div>
                          </td>
                            {/* Task */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700 font-medium">
                              {agent.task}
                            </span>
                          </td>
                          {/* Workflow */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {agent.workflow}
                            </span>
                          </td>

                          {/* Last modified */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {modified && (
                              <>
                                <span className="font-medium">{agent.owner}</span>{' '}
                                {timeAgo}
                              </>
                            )}
                          </td>

                          {/* Last published – not in DB yet
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Never
                          </td> */}

                          {/* Owner */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {agent.owner}
                          </td>

                          {/* More */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            <button className="hover:bg-gray-100 p-1 rounded">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        {searchTerm ? 'No agents match your search.' : 'No agents found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
};

export default AgentsPage;