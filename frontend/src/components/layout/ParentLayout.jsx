import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";

const ParentLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default ParentLayout;
