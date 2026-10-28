import type { ReactNode } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type OrderStatus } from "@/lib/format";
import { useProductImage } from "@/lib/catalog";
import { useSettings } from "@/lib/catalog";
import { fillTemplate, waLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";

export function ProductTile({
  name,
  color,
  imagePath,
  className,
}: {
  name: string;
  color: string;
  imagePath?: string | null;
  className?: string;
}) {
  const { data: url } = useProductImage(imagePath);
  const letter = name.trim().charAt(0).toUpperCase() || "?";
  if (url)
    return <img src={url} alt={name} className={cn("rounded-lg object-cover aspect-square", className)} loading="lazy" />;
  return (
    <div
      aria-hidden
      className={cn(
        "flex aspect-square items-center justify-center rounded-lg font-display text-primary-foreground",
        className,
      )}
      // Per-product tile colour is admin-managed data, not a theme token.
      style={{ background: `linear-gradient(140deg, ${color}, color-mix(in oklab, ${color} 60%, white))` }}
    >
      <span className="text-[2.5em] font-semibold leading-none drop-shadow-sm">{letter}</span>
    </div>
  );
}

const STATUS_CLASS: Record<OrderStatus, string> = {
  menunggu_pembayaran: "bg-status-pending-bg text-status-pending",
  dibayar: "bg-status-paid-bg text-status-paid",
  diproses: "bg-status-process-bg text-status-process",
  selesai: "bg-status-done-bg text-status-done",
  dibatalkan: "bg-status-cancel-bg text-status-cancel",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center sm:py-16">
      {icon && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blush text-primary">{icon}</div>}
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function PageLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" /> {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      title="Gagal memuat data"
      description={message}
      action={onRetry && <Button variant="outline" onClick={onRetry}>Coba lagi</Button>}
    />
  );
}

export function RestockButton({ product, variant, size = "sm" }: { product: string; variant: string; size?: "sm" | "default" }) {
  const { data: s } = useSettings();
  if (!s) return null;
  if (!s.whatsapp_configured) return <p className="text-xs text-muted-foreground">Contact WhatsApp belum tersedia.</p>;
  const text = fillTemplate(s.restock_message_template, { store: s.store_name, product, variant });
  return (
    <Button asChild variant="whatsapp" size={size}>
      <a href={waLink(s.admin_whatsapp, text)} target="_blank" rel="noopener noreferrer">
        <MessageCircle /> Restock WhatsApp
      </a>
    </Button>
  );
}
