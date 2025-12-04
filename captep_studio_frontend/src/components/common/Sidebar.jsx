import React, { useEffect, useState } from "react";
import { Home, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePage, setActivePage] = useState("home");

  // Update activePage when route changes
  useEffect(() => {
    const currentPath = location.pathname.replace("/", "");
    setActivePage(currentPath || "home");
  }, [location.pathname]);

  const handleNavigate = (page, path) => {
    setActivePage(page);
    navigate(path);
  };

  return (
    <div className="w-18 bg-gray-100 border-r border-gray-300 flex flex-col items-center py-6">
      {/* Home */}
      <button
        onClick={() => handleNavigate("home", "/home")}
        className={`flex flex-col items-center mb-6 p-2 w-full ${
          activePage === "home" ? "bg-white border-l-4 border-blue-600" : ""
        }`}
      >
        <Home
          className={`w-5 h-5 mb-1 ${
            activePage === "home" ? "text-blue-600" : "text-gray-600"
          }`}
        />
        <span
          className={`text-xs ${
            activePage === "home" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          Home
        </span>
      </button>

      {/* Agents */}
      <button
        onClick={() => handleNavigate("agents", "/agents")}
        className={`flex flex-col items-center mb-6 p-2 w-full ${
          activePage === "agents" ? "bg-white border-l-4 border-blue-600" : ""
        }`}
      >
        <svg
          className={`w-5 h-5 mb-1 ${
            activePage === "agents" ? "text-blue-600" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 2L2 7l10 5 10-5-10-5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2 17l10 5 10-5M2 12l10 5 10-5"
          />
        </svg>
        <span
          className={`text-xs ${
            activePage === "agents" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          Agents
        </span>
      </button>

      {/* Flows */}
      <button
        onClick={() => handleNavigate("flows", "/flows")}
        className={`flex flex-col items-center mb-6 p-2 w-full ${
          activePage === "flows" ? "bg-white border-l-4 border-blue-600" : ""
        }`}
      >
        <svg
          className={`w-5 h-5 mb-1 ${
            activePage === "flows" ? "text-blue-600" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8" />
        </svg>
        <span
          className={`text-xs ${
            activePage === "flows" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          Flows
        </span>
      </button>

      {/* Tools */}
      <button
        onClick={() => handleNavigate("tools", "/tools")}
        className={`flex flex-col items-center mb-6 p-2 w-full ${
          activePage === "tools" ? "bg-white border-l-4 border-blue-600" : ""
        }`}
      >
        <svg
          className={`w-5 h-5 mb-1 ${
            activePage === "tools" ? "text-blue-600" : "text-gray-600"
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <circle cx="6.5" cy="17.5" r="3.5" />
          <path d="M10 6h4M18 10v4" />
        </svg>
        <span
          className={`text-xs ${
            activePage === "tools" ? "text-blue-600" : "text-gray-600"
          }`}
        >
          Tools
        </span>
      </button>

      {/* More button */}
      <button className="flex flex-col items-center p-2 w-full mt-auto">
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  );
};

export default Sidebar;
