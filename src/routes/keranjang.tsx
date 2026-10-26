import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/keranjang")({
  head: () => ({ meta: [{ title: "Keranjang — PinkPrem" }, { name: "description", content: "Keranjang Belanja PinkPrem" }, { property: "og:title", content: "Keranjang — PinkPrem" }, { property: "og:description", content: "Keranjang Belanja PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Keranjang Belanja" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
