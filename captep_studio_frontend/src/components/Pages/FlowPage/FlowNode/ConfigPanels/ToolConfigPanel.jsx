// src/components/Pages/FlowPage/FlowNode/ConfigPanels/ToolConfigPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ChevronDown, Info } from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa6";
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import { useGetToolByIdMutation } from '../../../../../redux/services/toolServices';
import { setToolByIdConfigData, clearToolByIdConfigData } from '../../../../../redux/slices/toolSlice';
import { useGetIntegrationToolsMutation } from '../../../../../redux/services/toolServices';
import { setListToolOauthCollection } from '../../../../../redux/slices/toolSlice';
import ToolAuthPanel from './ToolAuthPanel';
import { Formik } from 'formik';
import * as Yup from 'yup';

import {
  useOAuthConnectorToolMutation,
  useCreateConnectorToolMutation,
} from '../../../../../redux/services/connectorToolsServices';

export default function ToolConfigPanel({ node, onClose, onUpdate, connectionData }) {
  const dispatch = useDispatch();
  console.log("click on node--->>", node);
  const toolId = node?.data?.toolId || node?.data?.basetoolId;
  const service = node?.data?.service || 'unknown';

  // const toolConfigById = useSelector((state) => state.tool.toolByIdConfigData);

  const [getToolById, { isLoading }] = useGetToolByIdMutation();
  const [showAuthPanel, setShowAuthPanel] = useState(false);

  const userId = useSelector((state) => state?.auth?.user?.id);
  const listToolOauthCollection = useSelector((state) => state.tool.listToolOauthCollection);
  const [getIntegrationTools, { isLoading: isIntegrationToolsLoading }] = useGetIntegrationToolsMutation();

  const [toolConfigById, settoolConfigById] = useState(null);

  const [toolConfigArray, setToolConfigArray] = useState([]);
  const [optionalFields, setOptionalFields] = useState([]);

  const [selectedConnection, setSelectedConnection] = useState(null);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [showObjectDropdown, setShowObjectDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [expandedFieldIndex, setExpandedFieldIndex] = useState(null);

  const [oauthMutation, { isLoading: isOAuthLoading }] = useOAuthConnectorToolMutation();
  const [createConnection, { isLoading: isCreating }] = useCreateConnectorToolMutation();
  const [tempConnectionId, setTempConnectionId] = useState('');
  const savedFieldsRef = useRef(node?.data?.inputFields || []);

  // Formik Setup
  const formik = useFormik({
    initialValues: {
      name: node?.data?.label || node?.data?.name || `${service} Tool`,
      description: node?.data?.description || `Performs ${service} operation`,
      action: node?.data?.toolAction || node?.data?.action || '',
      selectedObject: node?.data?.selectedObject || '',
      inputFields: [],
    },
    enableReinitialize: true, // We control manually -> Changed to true
    onSubmit: (values) => {
      const sanitizedInputFields = values.inputFields.map(field => ({
        name: field.name,
        fillUsing: field.fillUsing === 'Dynamically fill with AI' ? 'Dynamic AI value' : 'Custom value',
        value: field.fillUsing === 'Dynamically fill with AI'
          ? { name: field.displayName || field.label, description: field.dynamicDescription || '' }
          : field.value || '',
        label: field.label,
        itemName: field.itemName,
        required: field.required,
        type: field.type,
      }));

      const updatedData = {
        label: values.name,
        name: values.name,
        description: values.description,
        service,
        toolId,
        action: values.action,
        selectedObject: values.selectedObject,
        toolAction: values.action,
        inputFields: sanitizedInputFields,
        connected: !!selectedConnection,
        configOauth: selectedConnection ? {
          oauth_id: selectedConnection.id,
          oauth_connecname: selectedConnection.name,
        } : null,
        toolName: values.name,
      };
      onUpdate(updatedData);
      onClose();
    },
  });

  // Fetch Tool Config
  useEffect(() => {
    let isCancelled = false;

    const fetchToolConfig = async () => {
      try {
        const res = await getToolById(toolId).unwrap();
        if (!isCancelled && Array.isArray(res.data)) {
          setToolConfigArray(res.data);                    // ← array ஆ store
          dispatch(setToolByIdConfigData(res.data));
        }
      } catch (error) {
        console.error('Failed to fetch tool config', error);
      }
    };

    if (toolId) fetchToolConfig();

    return () => {
      isCancelled = true;
      dispatch(clearToolByIdConfigData());
    };
  }, [toolId, getToolById, dispatch]);

  console.log("toolConfigById res-->", toolConfigById);
  useEffect(() => {
    if (toolId && userId) {
      getIntegrationTools({ tool_id: toolId, created_by: userId }).unwrap()
        .then(res => {
          const connections = res.data || [];
          dispatch(setListToolOauthCollection(connections));

          // Priority: node saved connection > connectionData prop > first available
          if (node?.data?.configOauth?.connectionId) {
            const saved = connections.find(c => c.id === node.data.configOauth.connectionId);
            setSelectedConnection(saved || null);
          } else if (connectionData?.connectionId) {
            const fromProp = connections.find(c => c.id === connectionData.connectionId);
            setSelectedConnection(fromProp || null);
          } else if (connections.length > 0) {
            setSelectedConnection(connections[0]);
          }
        })
        .catch(console.error);
    }
  }, [toolId, userId, getIntegrationTools, dispatch, connectionData, node?.data?.configOauth]);

  // Keep reference of saved fields for later merging
  useEffect(() => {
    if (node?.data?.inputFields?.length) {
      savedFieldsRef.current = node.data.inputFields;
    }
  }, [node?.data?.inputFields]);

  // Load saved input fields + connection (Only once when fully loaded)
  useEffect(() => {
    if (!isLoading && !isIntegrationToolsLoading && node?.data?.inputFields?.length > 0) {
      const loaded = node.data.inputFields.map(field => {
        const isDynamic = field.fillUsing === 'Dynamic AI value';
        const val = isDynamic && typeof field.value === 'object' ? field.value : {};

        return {
          name: field.name,
          label: field.label || field.name,
          itemName: field.itemName || field.name,
          fillUsing: isDynamic ? 'Dynamically fill with AI' : 'Custom value',
          value: isDynamic ? '' : (field.value || ''),
          displayName: isDynamic ? (val.name || '') : '',
          dynamicDescription: isDynamic ? (val.description || '') : '',
          required: field.required || false,
          type: field.type || 'text',
        };
      });
      formik.setValues(prev => ({ ...prev, inputFields: loaded }));
    }
  }, [isLoading, isIntegrationToolsLoading, node?.data?.inputFields]);

  // // Auto-add missing required fields when object changes (SAFE — no reset)
  // useEffect(() => {
  //   if (toolConfigById && formik.values.selectedObject) {
  //     const objectFields = toolConfigById.objectFields?.[formik.values.selectedObject] || [];
  //     const current = formik.values.inputFields;

  //     const missingRequired = objectFields
  //       .filter(f => f.required && !current.some(c => c.name === f.name))
  //       .map(f => ({
  //         name: f.name,
  //         label: f.label,
  //         itemName: f.itemName,
  //         fillUsing: 'Custom value',
  //         value: '',
  //         required: true,
  //         type: f.type || 'text',
  //         displayName: '',
  //         dynamicDescription: '',
  //       }));

  //     if (missingRequired.length > 0) {
  //       formik.setFieldValue('inputFields', [...current, ...missingRequired]);
  //     }
  //   }
  // }, [toolConfigById, formik.values.selectedObject]);

  const addInputField = (fieldDef) => {
    const newField = {
      name: fieldDef.name,
      label: fieldDef.label,
      itemName: fieldDef.itemName,
      fillUsing: 'Custom value',
      value: '',
      required: false,
      type: fieldDef.type || 'text',
      displayName: '',
      dynamicDescription: '',
    };
    formik.setFieldValue('inputFields', [...formik.values.inputFields, newField]);
    setShowAddDropdown(false);
  };

  const removeInputField = (index) => {
    formik.setFieldValue('inputFields', formik.values.inputFields.filter((_, i) => i !== index));
    if (expandedFieldIndex === index) setExpandedFieldIndex(null);
  };

  const updateInputField = (index, key, value) => {
    const updated = [...formik.values.inputFields];
    updated[index][key] = value;
    formik.setFieldValue('inputFields', updated);
  };

  const config = toolConfigById || { name: service, description: '', actions: [], objects: [], objectFields: {} };
  console.log("config configconfigconfig--->", config);

  const currentObjectConfig = toolConfigArray.find(
    obj => obj.SObjectName === formik.values.selectedObject
  );

  useEffect(() => {
    if (!toolConfigArray.length) return;

    const firstObject = toolConfigArray[0];

    if (!formik.values.selectedObject && firstObject?.SObjectName) {
      formik.setFieldValue('selectedObject', firstObject.SObjectName);
      const firstAction = firstObject.actions?.[0]?.action_name || '';
      formik.setFieldValue('action', firstAction);
      return;
    }

    if (
      formik.values.selectedObject &&
      !formik.values.action &&
      currentObjectConfig?.actions?.length
    ) {
      formik.setFieldValue('action', currentObjectConfig.actions[0].action_name);
    }
  }, [
    toolConfigArray,
    formik.values.selectedObject,
    formik.values.action,
    formik.setFieldValue,
    currentObjectConfig,
  ]);

  const mapFieldWithSavedValues = (fieldDef, savedField) => ({
    name: fieldDef?.name || savedField?.name || '',
    label: fieldDef?.label || savedField?.label || fieldDef?.name || 'Field',
    itemName: fieldDef?.itemName || savedField?.itemName || fieldDef?.name || '',
    type: fieldDef?.type || savedField?.type || 'text',
    required: savedField?.required ?? !!fieldDef?.required,
    fillUsing: savedField?.fillUsing || 'Custom value',
    value: savedField?.value || '',
    displayName: savedField?.displayName || '',
    dynamicDescription: savedField?.dynamicDescription || '',
  });

  // இந்த useEffect replace பண்ணுங்க (முன்பு இருந்த objectFields logic எல்லாம் delete பண்ணிடுங்க)
  useEffect(() => {
    if (!formik.values.action || !currentObjectConfig) return;

    const selectedAction = currentObjectConfig.actions.find(
      a => a.action_name === formik.values.action
    );
    if (!selectedAction) return;

    const allFields = selectedAction.input_fields || [];
    const savedFields = savedFieldsRef.current || [];

    const requiredFields = allFields
      .filter(f => f.required)
      .map(f => {
        const saved = savedFields.find(sf => sf.name === f.name);
        return mapFieldWithSavedValues(f, saved);
      });

    const optional = allFields
      .filter(f => !f.required)
      .map(f => ({
        name: f.name,
        label: f.label,
        itemName: f.itemName,
        type: f.type || 'text',
        required: false,
      }));

    const savedOptionalFields = savedFields
      .filter(sf => !allFields.some(af => af.name === sf.name && af.required))
      .map(sf => {
        const matchingDef = allFields.find(af => af.name === sf.name);
        return mapFieldWithSavedValues(matchingDef, sf);
      });

    formik.setFieldValue('inputFields', [...requiredFields, ...savedOptionalFields]);
    setOptionalFields(optional);
  }, [formik.values.action, formik.values.selectedObject, toolConfigArray]);



  const initiateOAuthInConfigPanel = async (connectionName) => {
    try {
      const result = await oauthMutation({ platform: toolId }).unwrap();
      const popup = window.open(result.authorizeUrl, "oauth", "width=600,height=700");

      const connectionId = await new Promise((resolve, reject) => {
        const handler = (e) => {
          if (e.data.status === true && e.data.data) {
            resolve(e.data.data);
            window.removeEventListener("message", handler);
            popup?.close();
          } else if (e.data.status === false) {
            reject(new Error(e.data.message));
          }
        };
        window.addEventListener("message", handler);
        setTimeout(() => reject(new Error("Timeout")), 5 * 60 * 1000);
      });

      setTempConnectionId(connectionId);
      const final = await createConnection({ id: connectionId, name: connectionName, created_by: userId }).unwrap();
      const newConn = final.data || final;
      setSelectedConnection(newConn);
      dispatch(setListToolOauthCollection([...listToolOauthCollection, newConn]));
      setShowAuthPanel(false);
    } catch (err) {
      console.error("OAuth failed:", err);
    }
  };

  if (isLoading || isIntegrationToolsLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-xl text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading tool configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pro-scroll">
          <form onSubmit={formik.handleSubmit} className="p-4">
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-start gap-2">
                  <FaArrowLeft className="w-5 h-5 text-teal-500 mt-0.5" />
                  <div>
                    <h2 className="font-medium text-gray-900">{config.name}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {config.description || 'Configure tool inputs and actions'}
                    </p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formik.values.name.length}/64
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className="text-right text-xs text-gray-500 mt-1">
                  {formik.values.description.length}/1024
                </div>
              </div>

              {/* Tool & Connection */}
              <div className="grid grid-cols-2 gap-8 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tool</label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-teal-500 rounded flex items-center justify-center">
                      {node?.data?.icon ? (
                        typeof node.data.icon === 'function' ? (
                          <node.data.icon className="w-5 h-5 text-white" />
                        ) : node.data.icon
                      ) : (
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.5 0C5.1 0 0 5.1 0 11.5S5.1 23 11.5 23 23 17.9 23 11.5 17.9 0 11.5 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{config.name}</div>
                      <div className="text-xs text-gray-600">
                        {config?.actions?.find(a => a.value === formik.values.action)?.label || 'Select action'}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Connection</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowConnectionDropdown(!showConnectionDropdown)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex justify-between items-center bg-white hover:border-gray-400 text-sm"
                    >
                      <span>{selectedConnection?.name || 'Select Connection'}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showConnectionDropdown ? 'rotate-180' : ''}`} />
                    </button>
                    {showConnectionDropdown && (
                      <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {listToolOauthCollection?.length > 0 ? (
                          listToolOauthCollection.map((conn) => (
                            <button
                              key={conn.id}
                              type="button"
                              onClick={() => {
                                setSelectedConnection(conn);
                                setShowConnectionDropdown(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${selectedConnection?.id === conn.id ? 'bg-teal-50 text-teal-700' : ''}`}
                            >
                              <span>{conn.name}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500">No connections found</div>
                        )}
                        <div className="mt-2 pt-2 border-t">
                          <button
                            type="button"
                            onClick={() => {
                              setShowConnectionDropdown(false);
                              setShowAuthPanel(true);   // ← Direct-a Auth Panel Open!
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-teal-600 flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create new connection
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              {/* Inputs Header */}
              <div className="flex items-start gap-2 mb-4">
                <Info className="w-5 h-5 text-teal-500 mt-0.5" />
                <div className="flex-1">
                  <h2 className="font-medium text-gray-900">Inputs</h2>
                  <p className="text-sm text-gray-600 mt-1">What the tool accepts in order to run.</p>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAddDropdown(!showAddDropdown)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-600 border border-teal-600 rounded hover:bg-teal-50"
                  >
                    <Plus className="w-4 h-4" /> Add input
                  </button>
                  {showAddDropdown && (
                    <div className="absolute right-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {!formik.values.action ? (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          Select an action to see optional fields
                        </div>
                      ) : optionalFields.length > 0 ? (
                        optionalFields
                          .filter(field => !formik.values.inputFields.some(i => i.name === field.name))
                          .map((field) => (
                            <button
                              key={field.name}
                              type="button"
                              onClick={() => addInputField(field)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                            >
                              {field.label}
                            </button>
                          ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">No optional fields</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action & Object */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Action Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="action"
                    value={formik.values.action}
                    onChange={formik.handleChange}
                    disabled={!formik.values.selectedObject}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select action</option>
                    {currentObjectConfig?.actions?.map(act => (
                      <option key={act.action_name} value={act.action_name}>
                        {act.action_name.charAt(0).toUpperCase() + act.action_name.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Object Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Object Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formik.values.selectedObject}
                    onChange={(e) => {
                      formik.setFieldValue('selectedObject', e.target.value);
                      formik.setFieldValue('action', '');
                      formik.setFieldValue('inputFields', []);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  >
                    <option value="">Select object</option>
                    {toolConfigArray.map(obj => (
                      <option key={obj.SObjectName} value={obj.SObjectName}>
                        {obj.SObjectName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fields Table */}
              <div className="space-y-1">
                <div className="grid grid-cols-[2fr_2fr_3fr_auto] gap-4 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600">
                  <div>Input name</div>
                  <div>Fill using</div>
                  <div>Value</div>
                  <div></div>
                </div>

                {formik.values.inputFields.map((field, index) => (
                  <div key={index}>
                    <div className="grid grid-cols-[2fr_2fr_3fr_auto] gap-4 px-3 py-3 items-center hover:bg-gray-50">
                      <div>
                        <div className="text-sm font-medium">
                          {field.label}{field.required && <span className="text-red-500 ml-1">*</span>}
                        </div>
                        <div className="text-xs text-gray-500">{field.itemName}</div>
                      </div>
                      <select
                        value={field.fillUsing}
                        onChange={(e) => updateInputField(index, 'fillUsing', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option>Custom value</option>
                        <option>Dynamically fill with AI</option>
                        <option>Variable</option>
                      </select>
                      <div className="flex items-center gap-2">
                        {field.fillUsing === 'Dynamically fill with AI' ? (
                          <button
                            type="button"
                            onClick={() => setExpandedFieldIndex(expandedFieldIndex === index ? null : index)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm text-left hover:bg-gray-50 flex items-center justify-between"
                          >
                            <span className="text-gray-500">Customize</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={field.value || ''}
                            onChange={(e) => updateInputField(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        )}
                      </div>
                      <div>
                        {!field.required && (
                          <button
                            type="button"
                            onClick={() => removeInputField(index)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {expandedFieldIndex === index && field.fillUsing === 'Dynamically fill with AI' && (
                      <div className="bg-gray-50 border-b px-6 py-4">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
                          <input
                            type="text"
                            value={field.displayName || ''}
                            onChange={(e) => updateInputField(index, 'displayName', e.target.value)}
                            placeholder={field.label}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={field.dynamicDescription || ''}
                            onChange={(e) => updateInputField(index, 'dynamicDescription', e.target.value)}
                            placeholder="Help AI understand what to fill"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                          {field.dynamicDescription === '' && (
                            <p className="text-xs text-red-500 mt-1">Add description for better AI filling</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      </div>
      {showAuthPanel && (
        <Formik
          initialValues={{ connectionName: '' }}
          validationSchema={Yup.object({
            connectionName: Yup.string()
              .required('Connection name is required')
              .max(64, 'Max 64 characters')
              .trim(),
          })}
          onSubmit={(values, { setSubmitting }) => {
            setSubmitting(true);
            initiateOAuthInConfigPanel(values.connectionName).finally(() => {
              setSubmitting(false);
            });
          }}
        >
          {({ isSubmitting, handleSubmit }) => (
            <form onSubmit={handleSubmit}>   {/* ← THIS IS THE MISSING KEY! */}
              <ToolAuthPanel
                node={node}
                onClose={() => setShowAuthPanel(false)}
                onBack={() => setShowAuthPanel(false)}
                isSubmitting={isSubmitting || isOAuthLoading || isCreating}
                service={service}
              />
            </form>
          )}
        </Formik>
      )}
    </>
  );
}