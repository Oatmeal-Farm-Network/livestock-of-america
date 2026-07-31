import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { I18nProvider } from "./lib/i18n";
import { LanguageProvider } from "./lib/LanguageContext";
import { AccountProvider } from "./lib/AccountContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AccountProvider>
            <App />
          </AccountProvider>
        </BrowserRouter>
      </LanguageProvider>
    </I18nProvider>
  </StrictMode>,
);
