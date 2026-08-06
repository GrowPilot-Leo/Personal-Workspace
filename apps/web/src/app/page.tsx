import { redirect } from "next/navigation";

// Workbench home is the Bento Grid dashboard.
export default function HomePage() {
  redirect("/dashboard");
}
