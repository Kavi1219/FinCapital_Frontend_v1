import { useNavigate } from "react-router";
import { useState } from "react";

import "../styles/SharedPages.css";
const SESSION_KEY = "fincapital_session";

export default function Login() {
  const [role, setRole] = useState("owner");
  const [identifier, setIdentifier] = useState("");
  const nav = useNavigate();

  function login() {
    /*
     * FRONTEND-ONLY SESSION
     *
     * Later, when Spring Boot login is connected, replace this object
     * with the real authenticated profile returned by the backend:
     *
     * {
     *   role: "agent",
     *   profileId: 25,
     *   displayName: "Kavi",
     *   companyId: 1,
     *   branchId: 1
     * }
     */

    const session =
      role === "owner"
        ? {
            role: "owner",
            profileId: "OWNER",
            displayName: "Owner",
          }
        : {
            role: "agent",
            profileId: identifier.trim() || "AGENT",
            displayName: identifier.trim() || "Agent",
          };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    nav("/dashboard");
  }

  return (
    <div className="auth">
      <section className="authcard">
        <div className="authbrand">
          <span className="avatar">F</span>
          <div>
            <h1>Fin Capital</h1>
            <p>Finance Management</p>
          </div>
        </div>

        <h2>Login</h2>

        <div className="choices">
          <button
            className={role === "owner" ? "active" : ""}
            onClick={() => setRole("owner")}
          >
            Owner
          </button>

          <button
            className={role === "agent" ? "active" : ""}
            onClick={() => setRole("agent")}
          >
            Agent
          </button>
        </div>

        <label>Company Name</label>
        <input placeholder="Company name" />

        <label>
          {role === "owner"
            ? "Owner / MD Mobile Number"
            : "Agent Mobile / Employee ID"}
        </label>

        <input
          placeholder={role === "owner" ? "Mobile number" : "Agent ID / Mobile"}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <label>Password</label>
        <input type="password" placeholder="Password" />

        <button className="primary full" onClick={login}>
          Login as {role === "owner" ? "Owner" : "Agent"}
        </button>

        <p className="note">
          Registration + OTP + agent approval will connect to Spring Boot in the
          backend step.
        </p>
      </section>
    </div>
  );
}