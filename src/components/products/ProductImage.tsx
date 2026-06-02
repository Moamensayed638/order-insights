import { Coffee } from "lucide-react";
import { resolveImageUrl } from "@/lib/adminProducts";

export function ProductImage({ url, alt }: { url: string; alt: string }) {
  const src = resolveImageUrl(url);
  if (!src) {
    return (
      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
        <Coffee className="h-4 w-4 text-muted-foreground/50" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="h-10 w-10 rounded-md object-cover border border-border/60"
      onError={(e) => { (e.currentTarget.style.display = "none"); }}
    />
  );
}
