import { useEffect, useState } from "react";

import "../styles/SharedPages.css";
export default function GlobalAlert() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => setState({ title: "Fin Capital", message: String(message ?? "") });
    window.showFinCapitalMessage = (message, title = "Fin Capital") =>
      setState({ title, message: String(message ?? "") });
    return () => {
      window.alert = originalAlert;
      delete window.showFinCapitalMessage;
    };
  }, []);

  if (!state) return null;

  return (
    <div className="fc-dialog-backdrop" onMouseDown={() => setState(null)}>
      <section className="fc-dialog" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="fc-dialog-icon">✓</div>
        <h3>{state.title}</h3>
        <p>{state.message}</p>
        <button className="primary full" onClick={() => setState(null)}>OK</button>
      </section>
    </div>
  );
}