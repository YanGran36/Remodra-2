import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "Remodra - Construction Management SaaS";

// Add favicon and meta tags
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'Remodra is a comprehensive construction management SaaS platform for contractors to manage clients, estimates, invoices, projects, and materials.';
document.head.appendChild(meta);

createRoot(document.getElementById("root")!).render(<App />);
