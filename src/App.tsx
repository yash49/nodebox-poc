import { Nodebox, type ShellProcess } from "@codesandbox/nodebox";
import { useEffect, useRef, useState } from "react";

function App() {
  const nodeBoxIframeRef = useRef<HTMLIFrameElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  const runtimeRef = useRef<Nodebox>(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    let runtime: Nodebox;
    let shell: ShellProcess;

    (async () => {
      if (signal.aborted) return;

      runtime = new Nodebox({
        // Provide a reference to the <iframe> element in the DOM
        // where Nodebox should render the preview.
        iframe: nodeBoxIframeRef.current!,
      });

      if (signal.aborted) return;

      // Establish a connection with the runtime environment.
      await runtime.connect();

      if (signal.aborted) return;
      runtimeRef.current = runtime;

      // Populate the in-memory file system of Nodebox
      // with a Next.js project files.
      await runtime.fs.init({
        "/styles.css": `body {
  font-family: sans-serif;
  -webkit-font-smoothing: auto;
  -moz-font-smoothing: auto;
  -moz-osx-font-smoothing: grayscale;
  font-smoothing: auto;
  text-rendering: optimizeLegibility;
  font-smooth: always;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}
h1 {
  font-size: 1.5rem;
}`,
        "/App.jsx": `import React from "react"
export default function App() {
  return <h1>Hello world</h1>
}
`,
        "/index.jsx": `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import App from "./App";
const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);`,
        "/index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.jsx"></script>
  </body>
</html>`,
        "/package.json": JSON.stringify({
          scripts: { dev: "vite" },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            vite: "4.2.0",
            "@vitejs/plugin-react": "3.1.0",
            "esbuild-wasm": "0.17.12",
          },
        }),
        "vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
});`,
      });

      if (signal.aborted) return;

      // --------------

      // First, create a new shell instance.
      // You can use the same instance to spawn commands,
      // observe stdio, restart and kill the process.
      shell = runtime.shell.create();

      if (signal.aborted) return;

      shell.on("progress", (...args) => {
        console.log("Progress", ...args);
      });

      shell.stdout.on("data", (data) => {
        console.log("Output:", data);
      });

      shell.stderr.on("data", (data) => {
        console.log("Error:", data);
      });

      if (signal.aborted) return;

      // Then, let's run the "dev" script that we've defined
      // in "package.json" during the previous step.
      const nextProcess = await shell.runCommand("vite", []);

      if (signal.aborted) return;

      // Find the preview by the process and mount it
      // on the preview iframe on the page.
      const previewInfo = await runtime.preview.getByShellId(nextProcess.id);

      if (signal.aborted) return;

      previewIframeRef.current!.setAttribute("src", previewInfo.url);

      if (signal.aborted) return;
    })();

    controller.signal.onabort = () => {
      if (shell) {
        shell.kill();
      }
      runtimeRef.current = null;
    };

    return () => {
      controller.abort();
    };
  }, []);

  const [code, setCode] = useState(initialCode);

  useEffect(() => {
    runtimeRef.current?.fs.writeFile("/App.jsx", code);
  }, [code]);

  return (
    <>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={20}
      ></textarea>
      <iframe
        id="nodebox-iframe"
        style={{ display: "none" }}
        ref={nodeBoxIframeRef}
      ></iframe>
      <iframe id="preview-iframe" ref={previewIframeRef}></iframe>
    </>
  );
}

export default App;

const initialCode = `
import React from "react"
export default function App() {
  return <h1>Hello world</h1>
}
`;
