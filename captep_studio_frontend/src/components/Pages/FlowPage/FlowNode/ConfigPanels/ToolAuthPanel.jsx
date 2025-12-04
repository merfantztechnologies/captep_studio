// src/components/Pages/FlowPage/FlowNode/ConfigPanels/ToolAuthPanel.jsx
import React, { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Field, ErrorMessage } from 'formik';
import { useGetIntegrationToolsMutation } from '../../../../../redux/services/toolServices';
import { useSelector } from 'react-redux';

const TOOL_ICONS = {
  salesforce: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/salesforce.svg',
  quickbooks: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/quickbooks.svg',
  slack: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
  gmail: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/gmail.svg',
  googlecalendar: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/googlecalendar.svg',
  hubspot: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/hubspot.svg',
  notion: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
  // Add more as needed — fully dynamic!
};

const SERVICE_TO_NAME = {
  salesforce: 'Salesforce',
  gmail: 'Gmail',
  quickbooks: 'QuickBooks',
  googlecalendar: 'Google Calendar',
  slack: 'Slack',
  hubspot: 'HubSpot',
  notion: 'Notion',
  serper: ''
  // Add any new tool here — auto works!
};

export default function ToolAuthPanel({ node, onClose, onBack, isSubmitting = false }) {
  const toolId = node?.data?.toolId || node?.id;
  const service = node?.data?.service?.toLowerCase() || 'generic';
  const displayName = SERVICE_TO_NAME[service] || service.charAt(0).toUpperCase() + service.slice(1);
  const icon = TOOL_ICONS[service];

  const [getIntegrationTools] = useGetIntegrationToolsMutation();
  const userId = useSelector((state) => state?.auth?.user?.id);

  // Optional: Fetch existing connections (if needed)
  useEffect(() => {
    if (!toolId || !userId) return;

    const fetchConnections = async () => {
      try {
        await getIntegrationTools({
          tool_id: toolId,
          created_by: userId,
        }).unwrap();
      } catch (error) {
        console.error('Failed to fetch connections:', error);
      }
    };

    fetchConnections();
  }, [toolId, userId, getIntegrationTools]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-xl">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            {icon ? (
              <img
                src={icon}
                alt={service}
                className="w-8 h-8"
                style={{ filter: 'invert(53%) sepia(98%) saturate(2841%) hue-rotate(178deg) brightness(101%) contrast(101%)' }}
              />
            ) : (
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                {displayName[0]}
              </div>
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              Connect to {displayName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Connection Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connection Name <span className="text-red-500">*</span>
            </label>
            <Field
              name="connectionName"
              type="text"
              placeholder={`e.g. My ${displayName} Account`}
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50 transition-colors"
            />
            <ErrorMessage name="connectionName" component="p" className="text-xs text-red-600 mt-1" />
          </div>

          {/* Authentication Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Authentication Type
            </label>
            <Field
              as="select"
              name="authType"
              disabled={isSubmitting}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
            >
              <option value="oauth2">Login with {displayName}</option>
              {service === 'salesforce' && <option value="jwt">OAuth2 JWT</option>}
            </Field>
          </div>

          {/* Salesforce Specific Fields */}
          {service === 'salesforce' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Environment</label>
                <Field
                  as="select"
                  name="environment"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                >
                  <option>Production</option>
                  <option>Sandbox</option>
                </Field>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Version</label>
                <Field
                  as="select"
                  name="apiVersion"
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-50"
                >
                  <option>v58.0</option>
                  <option>v57.0</option>
                  <option>v56.0</option>
                </Field>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Back
          </button>

          <button
            type="submit"
       
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow-md'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}