import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — PinkPrem" }, { name: "description", content: "Dashboard Admin PinkPrem" }, { property: "og:title", content: "Admin — PinkPrem" }, { property: "og:description", content: "Dashboard Admin PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Dashboard Admin" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
