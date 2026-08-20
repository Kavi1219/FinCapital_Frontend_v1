FIN CAPITAL - SPLIT CSS

This folder was split from the CSS file you supplied.

Files:
- global.css            -> shared app styles, header, sidebar, auth, cards, tables, common controls
- AddCustomer.css       -> Add Customer, multi-step form, documents, camera/file options, customer popups
- Customers.css         -> Customers list
- CustomerProfile.css   -> Customer profile, loan slots, profile viewer, profile summaries
- Payments.css          -> Pay Now, due/fine UI, payment history, preclose and cash-flow UI
- AddLoan.css           -> loan summary + Add Loan success popup
- Dashboard.css         -> dashboard, clickable cards, mobile navigation, overview, active-loan drill-down
- all-sections.css      -> optional import file that imports all files above

Recommended setup:
1. Put these files inside: src/styles/
2. In src/main.jsx either import all-sections.css:
   import "./styles/all-sections.css";

   OR import global.css once, then import each page CSS from the matching JSX file.

Examples:
Dashboard.jsx:
   import "../styles/Dashboard.css";

AddCustomer.jsx:
   import "../styles/AddCustomer.css";

Customers.jsx:
   import "../styles/Customers.css";

CustomerProfile.jsx:
   import "../styles/CustomerProfile.css";
   import "../styles/Payments.css";

AddLoan.jsx:
   import "../styles/AddLoan.css";

IMPORTANT:
global.css must load before the section CSS files because the section files use shared variables such as --blue, --line, --muted, etc.

I did not create fake Expenses/Reports/Agents/Documents/Settings CSS because those selectors were not present in the CSS file you supplied. We can split/create those when their styles are added.
