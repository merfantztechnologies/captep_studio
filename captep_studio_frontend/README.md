# Agent Build UI Frontend

This repository contains the frontend application for the Agent Build UI, a platform for visually designing and managing AI workflows. Users can create, edit, and test complex AI agent-based flows using a drag-and-drop interface.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Key Components & Concepts](#key-components--concepts)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Interactions](#api-interactions)
- [Styling](#styling)
- [Known Issues & Enhancements](#known-issues--enhancements)

## Features

- **Drag-and-Drop Workflow Editor**: Build AI workflows visually using React Flow.
- **Node Management**: Add, configure, and connect various node types (Agent, Tool, Task, Start, Termination).
- **Agent Configuration**: Define agent properties like name, description, model, provider, and more.
- **Tool Integration**: Configure external tools with OAuth connections, actions, and input fields.
- **Task Definition**: Specify tasks for agents with detailed descriptions and expected outputs.
- **Workflow Persistence**: Create and update workflows, with automatic saving and loading.
- **Real-time Updates**: Flow list automatically refreshes after creating or updating a workflow.
- **Interactive Configuration Panels**: Dynamic panels for configuring node-specific properties.

## Tech Stack

- **React**: Frontend JavaScript library for building user interfaces.
- **Vite**: Fast development build tool.
- **React Flow (`@xyflow/react`)**: Library for building node-based editors.
- **Redux Toolkit Query (RTK Query)**: For efficient data fetching, caching, and state management (e.g., `workflowServices.js`).
- **Formik & Yup**: For form management and validation.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **Lucide React & React Icons**: Icon libraries.
- **`react-hot-toast`**: For elegant notifications.

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/             # Reusable UI components (e.g., Header)
│   │   ├── Pages/
│   │   │   ├── FlowPage/       # Core workflow editor components
│   │   │   │   ├── CreateFlow.jsx      # Main workflow creation/editing component
│   │   │   │   ├── NodeSidebar.jsx     # Sidebar for dragging nodes
│   │   │   │   ├── AgentPicker.jsx     # Agent type selection
│   │   │   │   ├── TestTab.jsx         # Workflow testing panel
│   │   │   │   ├── TriggerPanel.jsx    # Start node trigger configuration
│   │   │   │   └── FlowNode/
│   │   │   │       ├── ConfigPanel.jsx           # Generic config panel for agents
│   │   │   │       ├── ConfigPanelRouter.jsx     # Routes to appropriate tool config
│   │   │   │       ├── FlowNodes.jsx             # Defines node templates and types
│   │   │   │       └── ConfigPanels/             # Specific node configuration panels
│   │   │   │           ├── ToolConfigPanel.jsx
│   │   │   │           └── otherToolconfigPanel/
│   │   │   │               └── TaskConfigPanel.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── redux/
│   │   ├── services/           # RTK Query API slices
│   │   │   ├── agentServices.js
│   │   │   ├── authServices.js
│   │   │   ├── connectorToolsServices.js
│   │   │   ├── toolServices.js
│   │   │   └── workflowServices.js  # Workflow API interactions
│   │   └── store.js
│   └── index.css
├── .env
├── package.json
└── tailwind.config.js
```

## Key Components & Concepts

### `CreateFlow.jsx`

The central component responsible for managing the React Flow canvas, node and edge states, form submissions, and interactions with Redux mutations for creating and updating workflows. It handles:
- Initial loading of workflow data via `useGetWorkflowByIdQuery`.
- Transformation of API data into React Flow compatible nodes and edges.
- Handling of `onConnect` to update node states (e.g., `connected` status for tool nodes).
- The `addNode` function for adding new nodes to the canvas.
- The `generatePayload` function to transform React Flow data back into a backend-compatible structure for saving.
- Integration with Formik for managing workflow-level form data (name, memory enabled, agent type).

### `NodeSidebar.jsx`

Renders the draggable sidebar that provides various node types (Agent, Tool, Task, etc.) for users to add to the canvas. It dynamically determines and passes the `service` property for agent nodes based on their label.

### `FlowNodes.jsx`

Defines the `nodeTypes` object used by React Flow, mapping custom node types (e.g., 'agent', 'tool', 'task') to their visual components and initial data templates. It also provides `nodeTemplates` for different categories of nodes available in the sidebar.

### `ToolConfigPanel.jsx`

Provides the configuration interface for tool nodes. It handles:
- Fetching and displaying available OAuth connections.
- Allowing users to select tool actions, objects, and configure input fields.
- Constructing the `configOauth` payload with `oauth_connecname` and `oauth_id`.
- Preventing unintended resets of input fields during re-renders or loading states.

### `workflowServices.js`

An RTK Query API slice that defines endpoints for interacting with workflow-related backend services (e.g., `createWorkflow`, `updateWorkflow`, `getAllWorkflows`, `getWorkflowById`). It uses `tagTypes` and `invalidatesTags` to manage cache invalidation and ensure the UI automatically refetches data when changes occur.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd Agent\ Build\ UI/frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Environment Variables:**
    Create a `.env` file in the `frontend/` directory and add your API base URL:
    ```
    VITE_API_BASE_URL=http://localhost:8000/api # Replace with your backend API URL
    ```

### Running the Application

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application should now be running at `http://localhost:5173` (or another port if 5173 is in use).

## API Interactions

The frontend uses **Redux Toolkit Query (RTK Query)** for all API interactions.
- API definitions are located in `src/redux/services/`.
- `workflowServices.js` is crucial for workflow-related operations.
- Cache invalidation is managed using `tagTypes: ['Workflow']`, `invalidatesTags: ['Workflow']` for mutations, and `providesTags: ['Workflow']` for queries to ensure the flow list updates automatically.

## Styling

**Tailwind CSS** is used for styling the application. The configuration can be found in `tailwind.config.js`.

## Known Issues & Enhancements

- **Agent Node `service` Field**:
  - **Issue**: Previously, the `service` field for agent nodes was not consistently populating in the payload, especially when loading existing workflows or creating new ones from the sidebar.
  - **Fix**: Logic has been implemented in `NodeSidebar.jsx` to correctly pass the `service` value when creating new nodes, and in `CreateFlow.jsx` to ensure `service` from loaded `workflowData` is preserved and included in the update payload.
- **Tool Node `connected` Status**:
  - **Issue**: The `connected` property for tool nodes was initially always `false` upon loading or connecting an agent.
  - **Fix**: A two-pass loading mechanism and explicit `onConnect` handling in `CreateFlow.jsx` now correctly sets this status.
- **`ToolConfigPanel` Value Resets**:
  - **Issue**: Configuration values in `ToolConfigPanel` would sometimes reset after rendering, especially during loading states.
  - **Fix**: Conditional updates in `useEffect` hooks within `ToolConfigPanel.jsx` now prevent unintended overwrites of user input.
- **Task Node Default Name**:
  - **Issue**: New task nodes defaulted to "Task 1" regardless of the template label.
  - **Fix**: The `addNode` function in `CreateFlow.jsx` now correctly uses `tpl.label` for the task name.
- **Future Enhancements**: Improve error handling messages for better user feedback.
