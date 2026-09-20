"use client";
import { LoadingSkeleton } from "../frontend/src/components/LoadingSkeleton";
import dynamic from "next/dynamic";
const App = dynamic(() => import("../frontend/src/App"), {
  ssr: false,
  loading: () => <LoadingSkeleton variant="boot" label="Opening your workspace" />,
});
export default function Client() {
  return <App />;
}
