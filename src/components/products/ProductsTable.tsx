import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { AdminProduct } from "@/types/product";
import { fmt } from "./constants/constants";
import { ProductImage } from "./ProductImage";
import { EmptyBox, ErrorBox } from "./StateBoxes";

export function ProductsTable({
  products, isLoading, isError, onRetry, onEdit, onDelete,
}: {
  products: AdminProduct[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (product: AdminProduct) => void;
  onDelete: (product: AdminProduct) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md bg-muted/50" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorBox onRetry={onRetry} />;
  if (products.length === 0) return <EmptyBox />;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-16 py-3" />
            <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">ID</TableHead>
            <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Name</TableHead>
            <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Category</TableHead>
            <TableHead className="text-right text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Price</TableHead>
            <TableHead className="text-right text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Discounted</TableHead>
            <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Status</TableHead>
            <TableHead className="w-32 py-3" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p, rowIdx) => (
            <TableRow
              key={p.id}
              className={cn(
                "border-b border-border/40 transition-colors duration-150 hover:bg-primary/5",
                rowIdx % 2 === 0 ? "bg-card" : "bg-muted/10",
              )}
            >
              <TableCell className="py-2.5 pl-4 pr-2">
                <ProductImage url={p.imageUrl} alt={p.name} />
              </TableCell>
              <TableCell className="py-2.5">
                <span className="font-mono text-sm font-medium text-primary">#{p.id}</span>
              </TableCell>
              <TableCell className="py-2.5">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                {p.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{p.description}</p>
                )}
              </TableCell>
              <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">
                {p.categoryName || "—"}
              </TableCell>
              <TableCell className="py-2.5 text-right font-mono text-sm tabular-nums text-foreground">
                {fmt(p.price)}
              </TableCell>
              <TableCell className="py-2.5 text-right font-mono text-sm tabular-nums">
                {p.discountedPrice < p.price ? (
                  <span className="font-semibold text-primary">{fmt(p.discountedPrice)}</span>
                ) : (
                  <span className="text-muted-foreground/60">—</span>
                )}
              </TableCell>
              <TableCell className="py-2.5">
                {p.isAvailable ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 hover:bg-emerald-500/20 h-5 px-2 text-[10px] font-mono uppercase tracking-wide">
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground border border-border/60 h-5 px-2 text-[10px] font-mono uppercase tracking-wide">
                    Hidden
                  </Badge>
                )}
              </TableCell>
              <TableCell className="py-2.5 pr-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(p)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(p)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
