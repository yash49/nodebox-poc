import { Nodebox, type ShellProcess } from "@codesandbox/nodebox";
import { useEffect, useRef, useState } from "react";
import { viteReactJs } from "./starterProject";
import "./App.css";

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
      await runtime.fs.init(viteReactJs);

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

  const [code, setCode] = useState(viteReactJs["/App.jsx"]);

  useEffect(() => {
    runtimeRef.current?.fs.writeFile("/App.jsx", code);
  }, [code]);

  return (
    <div style={{ width: "100vw", display: "flex", height: "100vh" }}>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        rows={20}
        style={{ flexGrow: 1,fontSize:"1rem" }}
      ></textarea>
      <iframe
        id="nodebox-iframe"
        style={{ display: "none" }}
        ref={nodeBoxIframeRef}
      ></iframe>
      <iframe
        id="preview-iframe"
        ref={previewIframeRef}
        style={{ flexGrow: 1 }}
      ></iframe>
    </div>
  );
}

export default App;
