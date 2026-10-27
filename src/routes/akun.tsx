import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/akun")({
  head: () => ({ meta: [{ title: "Akun — fluffnshine" }, { name: "description", content: "Akun Saya fluffnshine" }, { property: "og:title", content: "Akun — fluffnshine" }, { property: "og:description", content: "Akun Saya fluffnshine" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Akun Saya" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
