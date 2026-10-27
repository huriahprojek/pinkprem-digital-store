import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — fluffnshine" }, { name: "description", content: "Dashboard Admin fluffnshine" }, { property: "og:title", content: "Admin — fluffnshine" }, { property: "og:description", content: "Dashboard Admin fluffnshine" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Dashboard Admin" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
