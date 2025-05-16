import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WalletContextProvider } from "./context/WalletContext";

createRoot(document.getElementById("root")!).render(
  <WalletContextProvider>
    <App />
  </WalletContextProvider>
);
