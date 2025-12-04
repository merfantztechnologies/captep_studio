import Layout from "../components/common/Layout/Layout";
import HomePage from "../pages/Home";
import AgentsPage from "../pages/Agents";
import ToolsPage from "../pages/Tools";
import FlowsPage from "../pages/Flow";


const MainRoutes={
    path:'/',
    element:<Layout/>,
    children:[
        {
            path:"/home",
            element:<HomePage/>
        },
        {
            path:"/agents",
            element:<AgentsPage/>
        },
        {
            path:"/tools",
            element:<ToolsPage/>
        },
        {
            path:"/flows",
            element:<FlowsPage/>
        }
    ]

}

export default MainRoutes;