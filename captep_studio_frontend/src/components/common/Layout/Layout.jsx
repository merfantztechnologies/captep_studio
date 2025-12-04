import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../../redux/slices/authSlices";
import Sidebar from "../Sidebar";
import Header from "../Header";

const Layout = () => {
  const dispatch = useDispatch();
  const [activePage, setActivePage] = useState("home");

  useEffect(() => {
    const fetchUserData = () => {
      const user = {
        id: "1899b1f7-e239-467a-98f1-fbc8fb9a50a2",
        firstname: "Aakash",
        lastname: "N",
        username: "vasanthakumar@9140",
        password: "aakash@001",
        is_active: true,
        created_at: "2025-07-21 15:23:15.921865",
        updated_at: "2025-07-21 15:23:15.921865",
      };

      const token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhNjI1MmFhLWU1MjktNGE2Ni1iYWM0LTE4OGI5MmFhZTg0MSIsImVtYWlsIjoidmFzYW50aGFrdW1hcjg1MzFAZ21haWwuY29tIiwiaWF0IjoxNzUzMDkxNTk1LCJleHAiOjE3NTMwOTUxOTV9.6HCcP3a3jUzr-9B3auk3VWI3b6ebX6_Xz9ZH5LZP51M";

      dispatch(setCredentials({ user, token }));
    };

    fetchUserData();
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-white w-full">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
