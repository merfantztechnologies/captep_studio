// src/components/Pages/FlowPage/FlowNode/ConfigPanelRouter.jsx
import React from 'react';
import CommonToolConfig from '../FlowNode/ConfigPanels/CommonToolConfig';
import GenericToolConfig from './GenericToolConfig';

export default function ConfigPanelRouter({ node, onClose, onUpdate }) {
  const service = node.data.service || 'generic';
  console.log("node data in ConfigPanelRouter: ---- ", node);
  console.log('ConfigPanelRouter service: ----', service);

  // All tools use CommonToolConfig
  const PanelComponent = service !== 'generic' ? CommonToolConfig : GenericToolConfig;

  return <PanelComponent node={node} onClose={onClose} onUpdate={onUpdate} />;
}