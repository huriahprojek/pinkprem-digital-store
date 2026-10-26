import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk — PinkPrem" }, { name: "description", content: "Masuk / Daftar PinkPrem" }, { property: "og:title", content: "Masuk — PinkPrem" }, { property: "og:description", content: "Masuk / Daftar PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Masuk / Daftar" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
