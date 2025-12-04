import { Routes, Route } from "react-router-dom";
import Layout from "../components/common/Layout/Layout";
import HomePage from "../pages/Home";
import AgentsPage from "../pages/Agents";
import ToolsPage from "../pages/Tools";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/home" element={<HomePage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/tools" element={<ToolsPage />} />
      </Route>
    </Routes>
  );
}
