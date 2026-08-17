import { NavLink } from "react-router";
export default function Sidebar({ open, onClose }) {
  const cls = ({ isActive }) => "navlink " + (isActive ? "active" : "");
  return (
    <>
      <div className={"backdrop " + (open ? "open" : "")} onClick={onClose} />
      <aside className={"sidebar " + (open ? "open" : "")}>
        <div className="sidebrand">
          <span className="avatar">S</span>
          <span>
            <b>Sangam Fin Capital</b>
            <small>Main Branch</small>
          </span>
        </div>
        <nav>
          <NavLink className={cls} to="/dashboard" onClick={onClose}>
            Dashboard
          </NavLink>
          <div className="navgroup">Customers</div>
          <NavLink className={cls} to="/customers/daily" onClick={onClose}>
            Daily
          </NavLink>
          <NavLink className={cls} to="/customers/weekly" onClick={onClose}>
            Weekly
          </NavLink>
          <NavLink className={cls} to="/customers/monthly" onClick={onClose}>
            Monthly
          </NavLink>
          <div className="navgroup">Loans</div>
          <NavLink className={cls} to="/loans" onClick={onClose}>
            All Loans
          </NavLink>
          <NavLink className={cls} to="/loans/create" onClick={onClose}>
            Create Loans
          </NavLink>
          <NavLink className={cls} to="/collection" onClick={onClose}>
            Collection
          </NavLink>
          <NavLink className={cls} to="/payments" onClick={onClose}>
            Payments
          </NavLink>
          <NavLink className={cls} to="/expenses" onClick={onClose}>
            Expenses
          </NavLink>
          <NavLink className={cls} to="/reports" onClick={onClose}>
            Reports
          </NavLink>
          <NavLink className={cls} to="/agents" onClick={onClose}>
            Agents
          </NavLink>
          <NavLink className={cls} to="/documents" onClick={onClose}>
            Documents
          </NavLink>
          <NavLink className={cls} to="/settings" onClick={onClose}>
            Settings
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
