"use client";
import dynamic from "next/dynamic";
const App = dynamic(() => import("../client/src/App"), {
  ssr: false,
  loading: () => (
    <div className="boot-screen" role="status">
      Opening your workspace…
    </div>
  ),
});
export default function Client() {
  return <App />;
}
