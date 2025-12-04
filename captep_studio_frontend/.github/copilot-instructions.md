# AI Agent Instructions for Agent Build UI Frontend

## Project Overview
This is a React-based frontend application for an Agent Building UI system, built with Vite and modern React practices. The application allows users to create, manage, and test AI agents through a visual flow-based interface.

## Architecture Overview

### Core Technology Stack
- React (v19) with Vite build system
- Redux Toolkit for state management
- React Router (v7) for routing
- TailwindCSS for styling
- XY Flow (@xyflow/react) for flow-based visualizations

### Key Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components (Header, Sidebar)
│   └── Pages/           # Feature-specific components
├── redux/               # State management
│   ├── services/        # RTK Query API services
│   └── slices/          # Redux state slices
└── routes/              # Application routing
```

## Key Patterns and Conventions

### State Management
- Use Redux Toolkit for global state management
- RTK Query for API interactions (`redux/services/*.js`)
- State slices are organized by domain (auth, workflow, tools)
- Example: `store.js` shows the Redux store configuration pattern

### Flow Node Components
- Located in `components/Pages/FlowPage/FlowNode/`
- Follow the pattern in `FlowNodes.jsx` for creating new node types
- Use `ButtonHandle` component for node connections
- Implement configuration panels in `ConfigPanels/` directory

### Component Organization
- Page components go in `pages/`
- Reusable UI components go in `components/common/`
- Feature-specific components go in `components/Pages/{FeatureName}/`

## Development Workflow

### Getting Started
```bash
npm install
npm run dev
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks

### Code Style
- Use functional components with hooks
- Follow React 19 best practices
- Implement form validation using Formik + Yup
- Use Tailwind for styling (configured in `tailwind.config.js`)

## Common Tasks

### Adding a New Flow Node
1. Create node component in `components/Pages/FlowPage/FlowNode/`
2. Add configuration panel in `ConfigPanels/`
3. Register node type in `FlowNodes.jsx`
4. Add node-specific state handling in Redux if needed

### Adding a New Tool Integration
1. Create service in `redux/services/`
2. Add corresponding slice in `redux/slices/`
3. Register in store.js
4. Create configuration panel in `ConfigPanels/`

## Troubleshooting
- Check Redux DevTools for state issues
- Verify node connections in XY Flow debug mode
- Consult `vite.config.js` for build configuration issues

## Key Files to Reference
- `src/store.js` - Redux store configuration
- `src/components/Pages/FlowPage/FlowNodes.jsx` - Flow node implementations
- `src/redux/services/` - API service implementations
- `src/routes/AppRoutes.jsx` - Application routing structure