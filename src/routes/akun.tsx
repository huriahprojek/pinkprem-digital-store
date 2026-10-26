import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/shop";

export const Route = createFileRoute("/akun")({
  head: () => ({ meta: [{ title: "Akun — PinkPrem" }, { name: "description", content: "Akun Saya PinkPrem" }, { property: "og:title", content: "Akun — PinkPrem" }, { property: "og:description", content: "Akun Saya PinkPrem" }] }),
  component: () => (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <EmptyState title="Akun Saya" description="Halaman ini sedang disiapkan." />
    </div>
  ),
});
