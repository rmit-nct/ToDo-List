"use client";
import { LoadingSkeleton } from "../client/src/components/LoadingSkeleton";
import dynamic from "next/dynamic";
const App = dynamic(() => import("../client/src/App"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="boot" label="Opening your workspace" />,
});
export default function Client() {
  return <App />;
}
