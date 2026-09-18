import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import type { Metadata } from "next";
import "../client/src/assets/app.css";
import "../client/src/assets/task-runtime.css";
export const metadata: Metadata = {
  title: "NEO — Task workspace",
  description:
    "Collaborative task management for student teams and club committees.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
