import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/kontak")({
  head: () => ({ meta: [{ title: "Kontak — PinkPrem" }, { name: "description", content: "Kontak & Restock PinkPrem" }, { property: "og:title", content: "Kontak — PinkPrem" }, { property: "og:description", content: "Kontak & Restock PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Kontak & Restock" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
