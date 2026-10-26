import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/produk")({
  head: () => ({ meta: [{ title: "Katalog — PinkPrem" }, { name: "description", content: "Katalog Produk PinkPrem" }, { property: "og:title", content: "Katalog — PinkPrem" }, { property: "og:description", content: "Katalog Produk PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Katalog Produk" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
