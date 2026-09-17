import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import type { Metadata } from "next";
import "../client/src/assets/app.css";
import "../client/src/assets/product.css";
import "../client/src/assets/planner.css";
export const metadata: Metadata = {
  title: "NCT Planner — Neo Culture Tech",
  description:
    "The team planner from RMIT Neo Culture Tech. Organize club projects, share ownership, and plan your next deadline.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
