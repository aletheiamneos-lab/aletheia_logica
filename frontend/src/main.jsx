import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/geist/wght.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-sans/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/public-sans/400.css";
import "@fontsource/public-sans/500.css";
import "@fontsource/public-sans/600.css";
import "@fontsource/public-sans/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource/karla/400.css";
import "@fontsource/karla/500.css";
import "@fontsource/karla/600.css";
import "@fontsource/karla/700.css";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/600.css";
import "@fontsource/newsreader/700.css";
import "@fontsource/work-sans/400.css";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import "@fontsource/work-sans/700.css";
import "./index.css";
import "./apple-saas-animate-overrides.css";
import "./premium-overrides.css";
import "./styles/buttons.css";
import App from "./App.jsx";
import { applyRootFont, applyRootTheme } from "./appEnvironment";

applyRootTheme();
applyRootFont();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
