import { Outlet, useNavigate } from "react-router";
import { useState } from "react";
import Sidebar from "./Sidebar";
export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  return (
    <div>
      <header className="header">
        <button className="brand" onClick={() => setOpen(true)}>
          <span className="avatar">S</span>
          <span>
            <b>Sangam Fin Capital</b>
            <small>Main Branch • Branch Location</small>
          </span>
        </button>
        <button className="primary" onClick={() => nav("/customers/new")}>
          + Customer
        </button>
      </header>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
