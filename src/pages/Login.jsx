import { useNavigate } from "react-router";
import { useState } from "react";
export default function Login() {
  const [role, setRole] = useState("owner");
  const nav = useNavigate();
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
        <input placeholder="Mobile number" />
        <label>Password</label>
        <input type="password" placeholder="Password" />
        <button className="primary full" onClick={() => nav("/dashboard")}>
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
