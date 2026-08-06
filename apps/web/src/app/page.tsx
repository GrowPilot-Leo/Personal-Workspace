import { redirect } from "next/navigation";

// V2 information architecture places Today at the root. The legacy dashboard
// route remains at /dashboard for backward compatibility with V1 bookmarks.
export default function HomePage() {
  redirect("/today");
}
