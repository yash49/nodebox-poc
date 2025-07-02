import { Nodebox } from "@codesandbox/nodebox";
import { useEffect, useRef } from "react";

function App() {
  const nodeBoxIframeRef = useRef<HTMLIFrameElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    (async () => {
      const runtime = new Nodebox({
        // Provide a reference to the <iframe> element in the DOM
        // where Nodebox should render the preview.
        iframe: nodeBoxIframeRef.current!,
      });

      // Establish a connection with the runtime environment.
      await runtime.connect();

      // Populate the in-memory file system of Nodebox
      // with a Next.js project files.
      await runtime.fs.init({
        "package.json": JSON.stringify({
          name: "nextjs-preview",
          dependencies: {
            "@next/swc-wasm-nodejs": "12.1.6",
            next: "12.1.6",
            react: "18.2.0",
            "react-dom": "18.2.0",
          },
        }),
        // On the index page, let's illustrate how server-side props
        // propagate to your page component in Next.js.
        "pages/index.jsx": `
export default function Homepage({ name }) {
  return (
    <div>
      <h1>Hello, {name}</h1>
      <p>The name "{name}" has been received from server-side props.</p>
    </div>
  )
}

export function getServerSideProps() {
  return {
    props: {
      name: 'John'
    }
  }
}
    `,
      });

      // --------------

      // First, create a new shell instance.
      // You can use the same instance to spawn commands,
      // observe stdio, restart and kill the process.
      const shell = runtime.shell.create();

      shell.on("progress", (...args) => {
        console.log("Progress", ...args);
      });

      shell.stdout.on("data", (data) => {
        console.log("Output:", data);
      });

      shell.stderr.on("data", (data) => {
        console.log("Error:", data);
      });

      // Then, let's run the "dev" script that we've defined
      // in "package.json" during the previous step.
      const nextProcess = await shell.runCommand("next", []);

      // Find the preview by the process and mount it
      // on the preview iframe on the page.
      const previewInfo = await runtime.preview.getByShellId(nextProcess.id);

      previewIframeRef.current!.setAttribute("src", previewInfo.url);
    })();

    console.log("RAN");
  }, []);

  return (
    <>
      <iframe id="nodebox-iframe" ref={nodeBoxIframeRef}></iframe>
      <iframe id="preview-iframe" ref={previewIframeRef}></iframe>
    </>
  );
}

export default App;
