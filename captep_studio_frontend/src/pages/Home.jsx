import React from 'react';
import { Home, Plus, MoreHorizontal, Settings, HelpCircle } from 'lucide-react';

 <main className="flex-1 overflow-y-auto bg-white"></main>
const HomePage = () => {
  const recentAgents = [
    { name: 'Customer Service Agent', icon: '/', iconBg: 'bg-purple-500', type: 'Agent', lastModified: 'Merfantz Support · 8 days ago', lastPublished: 'Never', owner: 'Merfantz Support' },
    { name: 'CustomerServiceAgent', icon: '/', iconBg: 'bg-purple-500', type: 'Agent', lastModified: 'Merfantz Support · 11 days ago', lastPublished: 'Never', owner: 'Merfantz Support' },
    { name: 'RetailAssistantBot', icon: '/', iconBg: 'bg-pink-500', type: 'Agent', lastModified: 'Merfantz Support · 1 month ago', lastPublished: 'Never', owner: 'Merfantz Support' },
    { name: 'Contoso Helpdesk Agent', icon: '/', iconBg: 'bg-teal-500', type: 'Agent', lastModified: '# Microsoft Copilot Studio · 1 month ago', lastPublished: 'Never', owner: 'Merfantz Support' },
    { name: 'Safe Travels', icon: '/', iconBg: 'bg-purple-400', type: 'Agent', lastModified: '# Microsoft Copilot Studio · 1 month ago', lastPublished: 'Never', owner: 'Merfantz Support' }
  ];

  const templates = [
    { name: 'Website Q&A', icon: '?', iconBg: 'bg-orange-500', description: 'Instantly answer user questions using the content of your website or other knowledge.' },
    { name: 'Safe Travels', icon: '✈', iconBg: 'bg-purple-500', description: 'Provides answers to common travel questions and related health and safety guidelines.' },
    { name: 'Financial Insights', icon: '🏛', iconBg: 'bg-green-500', description: 'Help financial services professionals get quick and concise info from their org\'s financial documents and other available resources.' },
    { name: 'Benefits', icon: '💼', iconBg: 'bg-green-600', description: 'Benefits Agent provides personalized information on various benefits offered by the employer that are tailored to employee\'s unique circumstances.' },
    { name: 'IT Helpdesk', icon: '💻', iconBg: 'bg-teal-500', description: 'Empowers employees to resolve issues and effortlessly create/view support tickets.' },
    { name: 'Weather', icon: '☁', iconBg: 'bg-blue-400', description: 'Your go-to assistant for getting weather forecast.' }
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-white">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Agents</h2>
          <div className="flex items-center space-x-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              New agent
            </button>
            <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50">
              Import agent
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Recent</h3>
            <button className="text-blue-600 text-sm hover:underline">See more</button>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last modified</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last published</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Protection status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentAgents.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${agent.iconBg} rounded flex items-center justify-center mr-3 text-white font-bold text-lg`}>
                          {agent.icon}
                        </div>
                        <span className="text-sm text-gray-900">{agent.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.lastModified}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.lastPublished}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{agent.owner}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">--</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <button className="hover:bg-gray-100 p-1 rounded">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Explore agents</h3>
            <button className="text-blue-600 text-sm hover:underline">See more</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start mb-3">
                  <div className={`w-12 h-12 ${template.iconBg} rounded-lg flex items-center justify-center mr-3 text-white text-xl font-bold`}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-base mb-1">{template.name}</h4>
                    <span className="text-xs text-gray-500">Agent template</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Learning resources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {['Free Copilot Studio Workshop', 'Getting started with Copilot Studio', 'Quick start: Create and deploy an agent', 'Documentation', 'Security and Governance'].map((resource, idx) => (
              <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    {idx === 0 && <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>}
                    {idx === 1 && <><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></>}
                    {idx === 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>}
                    {idx === 3 && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>}
                    {idx === 4 && <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>}
                  </svg>
                  <span className="text-sm text-gray-700 font-medium">{resource}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;