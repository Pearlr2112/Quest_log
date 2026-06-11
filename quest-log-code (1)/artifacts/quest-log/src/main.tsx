import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setExtraHeadersGetter } from "@workspace/api-client-react";
import { getUserId } from "./lib/user-id";

setExtraHeadersGetter(() => ({ "X-User-ID": getUserId() }));

createRoot(document.getElementById("root")!).render(<App />);
