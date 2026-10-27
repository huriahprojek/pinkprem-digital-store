import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Masuk — fluffnshine" }, { name: "description", content: "Masuk / Daftar fluffnshine" }, { property: "og:title", content: "Masuk — fluffnshine" }, { property: "og:description", content: "Masuk / Daftar fluffnshine" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Masuk / Daftar" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
