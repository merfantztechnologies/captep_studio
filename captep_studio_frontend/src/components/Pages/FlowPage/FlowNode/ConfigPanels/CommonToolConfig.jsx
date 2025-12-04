// COMPLETE FIXED CommonToolConfig.jsx with DEBUGGING
import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';

import {
  useOAuthConnectorToolMutation,
  useCreateConnectorToolMutation,
} from '../../../../../redux/services/connectorToolsServices';

import ToolOverviewPanel from './ToolOverviewPanel';
import ToolAuthPanel from './ToolAuthPanel';
import ToolConfigPanel from './ToolConfigPanel';
import KnowledgeBaseConfigPanel from './otherToolconfigPanel/KnowledgeBaseConfigPanel';
import HTTPRequestConfigPanel from './otherToolconfigPanel/HTTPRequestConfigPanel';
import SerperSearchConfigPanel from './otherToolconfigPanel/SerperSearchConfigPanel';
import SentimentAnalysisConfigPanel from './otherToolconfigPanel/SentimentAnalysisConfigPanel';

import { useDispatch, useSelector } from 'react-redux';
import { useGetToolByIdMutation } from '../../../../../redux/services/toolServices';


export default function CommonToolConfig({ node, onClose, onUpdate }) {
  const [step, setStep] = useState('overview');
  const [connectionData, setConnectionData] = useState(null);
  const [oauthUrl, setOauthUrl] = useState('');
  const [connectionId, setConnectionId] = useState('');
  const [isOAuthWindowOpen, setIsOAuthWindowOpen] = useState(false);
  const [showSentimentPanel, setShowSentimentPanel] = useState(false);
  const dispatch = useDispatch();

  const userId = useSelector((state) => state.auth.user?.id);
  const toolConfigById = useSelector((state) => state.tool.toolByIdConfigData);
  
  const toolId = node?.data?.toolId;

  const [oauthMutation, { isLoading: isOAuthLoading }] = useOAuthConnectorToolMutation();
  const [createConnection, { isLoading: isCreating }] = useCreateConnectorToolMutation();

  const toolservice = node?.data?.service;
  const service = toolservice;
  const isKnowledgeBase = service === 'Knowledge';
  const isHttpRequest = service === 'HTTP Request';
  const showSerper = service === 'Serper';
  const isSentiment = service === 'Sentiment';

  // ✅ HANDLERS
  const handleConfigure = () => {
    console.log("📝 handleConfigure called - setting step to 'config'");
    setStep('config');
  };
   
  const handleAddConnection = () => {
    console.log("🔗 handleAddConnection called - setting step to 'auth'");
    setStep('auth');
  };
  const handleBack = () => {
    setStep('overview');
  };

  const initiateOAuth = async (connectionName) => {
    try {
      const result = await oauthMutation({
        platform: toolId,
      }).unwrap();

      console.log("result--->", result );
  
      const popup = window.open(
        result.authorizeUrl,
        "oauth",
        "width=600,height=700,scrollbars=yes,resizable=yes,status=yes"
      );
  
      const authPromise = new Promise((resolve, reject) => {
        const messageHandler = (event) => {
          const { status, message, data } = event.data;
          setConnectionId( data );
          resolve(data);
  
          if (status) {
           
           
            window.removeEventListener("message", messageHandler);
            if (popup) popup.close();
            
          } else {
            console.error("❌ OAuth failed:", message);
            window.removeEventListener("message", messageHandler);
            if (popup) popup.close();
            reject(new Error(message || "Authentication failed"));
          }
        };
  
        window.addEventListener("message", messageHandler);
      });
  
      const authData = await authPromise;
      finalizeConnection(connectionName , authData );
      
    } catch (error) {
      console.error("OAuth initiation failed:", error);
    }
  };

  // Step 2: Finalize connection with name
  const finalizeConnection = async (connectionName , ConnecId) => {
    try {

      console.log("connectionId--->>", ConnecId ,  connectionId);
      const payload = {
        id: ConnecId || connectionId ,
        name: connectionName,
        created_by: userId,
      };
      console.log(" create action payload---->>", payload);

      const result = await createConnection(payload).unwrap();
      console.log("result----->>>", result);
      setConnectionData(result);
      setStep('config');
    } catch (err) {
      console.error('Finalize failed:', err);
    }
  };

  const handleConnect = async (values, { setSubmitting }) => {
    setSubmitting(true);
    await initiateOAuth(values.connectionName);
    setSubmitting(false);
  };

  const getValidationSchema = () => {
    return Yup.object({
      connectionName: Yup.string()
        .required('Connection name is required')
        .max(64, 'Max 64 characters')
        .trim(),
    });
  };

  const initialValues = { connectionName: '' };

  // ========== SPECIAL CASES (NO OAUTH NEEDED) ==========
  
  if (isOAuthWindowOpen && oauthUrl) {
    console.log("🔄 Rendering OAuth loading state");
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-xl text-center">
          <h3 className="text-lg font-semibold mb-4">Connecting to {service}</h3>
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          </div>
          <p className="text-sm text-gray-600">Complete login in the popup window...</p>
          <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:text-gray-700">
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  if (isKnowledgeBase) {
    console.log("📚 Rendering KnowledgeBaseConfigPanel");
    return <KnowledgeBaseConfigPanel node={node} onClose={onClose} onUpdate={onUpdate} />;
  }
  
  if (isHttpRequest) {
    console.log("🌐 Rendering HTTPRequestConfigPanel");
    return <HTTPRequestConfigPanel node={node} onClose={onClose} onUpdate={onUpdate} />;
  }
  
  if (showSerper) {
    console.log("🔍 Rendering SerperSearchConfigPanel");
    return <SerperSearchConfigPanel node={node} onClose={onClose} onUpdate={onUpdate} />;
  }

  if (isSentiment) {
    console.log("😊 Rendering SentimentAnalysisConfigPanel");
    return (
      <SentimentAnalysisConfigPanel
        node={node}
        onClose={() => setShowSentimentPanel(false)}
        onUpdate={onUpdate}
      />
    );
  }
  
  // ========== STEP-BASED RENDERING FOR OAUTH TOOLS ==========
  
  if (step === 'overview') {
    console.log("📋 Rendering ToolOverviewPanel");
    return (
      <ToolOverviewPanel
        node={node}
        onClose={onClose}
        onConfigure={handleConfigure}
        onAddConnection={handleAddConnection}
      />
    );
  }

  if (step === 'auth') {
    console.log("🔐 Rendering ToolAuthPanel");
    return (
      <Formik
        initialValues={initialValues}
        validationSchema={getValidationSchema()}
        onSubmit={handleConnect}
      >
        {({ isSubmitting }) => (
          <Form>
            <ToolAuthPanel
              node={node}
              onClose={onClose}
              onBack={handleBack}
              isSubmitting={isSubmitting || isOAuthLoading}
              service={service}
            />
          </Form>
        )}
      </Formik>
    );
  }

  // ✅ DEFAULT: Config Panel (when step === 'config' or anything else)
   
  
  return (
    <ToolConfigPanel
      node={node}
      onClose={onClose}
      onUpdate={onUpdate}
      connectionData={connectionData}
      onAddConnection={handleAddConnection}
    />
  );
}