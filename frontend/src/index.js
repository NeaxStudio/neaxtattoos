import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";


function removeEmergentBadge() {
  const selectors = [
    "#emergent-badge",
    'a[href*="utm_source=emergent-badge"]',
    'a[href*="app.emergent.sh"]',
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

removeEmergentBadge();

if (typeof MutationObserver !== "undefined") {
  const observer = new MutationObserver(() => removeEmergentBadge());
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
  window.addEventListener("beforeunload", () => observer.disconnect());
}
