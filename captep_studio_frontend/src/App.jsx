import { RouterProvider } from "react-router-dom";
import route from "./routes";
import { Provider } from "react-redux";
import store from "./store";
import { ToastContainer } from 'react-toastify';


function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={route} />
      <ToastContainer />
    </Provider>
  );
}

export default App;


// import React, { useState } from 'react';
// import Sidebar from './components/common/Sidebar';
// import Header from './components/common/Header';
// import AgentsPage from './pages/Agents';
// import ToolsPage from './pages/Tools';
// import HomePage from './pages/Home';
// import FlowsPage from "./pages/Flow";   

// const App = () => {
//   const [activePage, setActivePage] = useState('home');

//   return (
//     <div className="flex h-screen bg-white w-full">
//       <Sidebar activePage={activePage} onNavigate={setActivePage} />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         {activePage === 'home' && <HomePage />}
//         {activePage === 'tools' && <ToolsPage />}
//         {activePage === 'agents' && <AgentsPage />}
//         {activePage === 'flows' && <FlowsPage />}
//       </div>
//     </div>
//   );
// };

// export default App;
