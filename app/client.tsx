"use client";
import dynamic from "next/dynamic";
import { SessionProvider } from "next-auth/react";
const App = dynamic(() => import("../client/src/App"), {
  ssr: false,
  loading: () => (
    <div className="boot-screen" role="status">
      Opening your workspace…
    </div>
  ),
});
export default function Client() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
