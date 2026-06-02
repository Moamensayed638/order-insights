import { TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { TopSellingProduct } from "@/types/product";
import { fmt } from "./constants/constants";
import { ProductImage } from "./ProductImage";
import { ErrorBox } from "./StateBoxes";

export function TopSellingTable({
  data, isLoading, isError, onRetry,
}: {
  data: TopSellingProduct[];
  isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-md bg-muted/50" style={{ opacity: 1 - i * 0.12 }} />
        ))}
      </div>
    );
  }
  if (isError) return <ErrorBox onRetry={onRetry} />;
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-14 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No sales data yet.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60 bg-card shadow-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12 py-3" />
            <TableHead className="w-16 py-3" />
            <TableHead className="text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Product</TableHead>
            <TableHead className="text-right text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Price</TableHead>
            <TableHead className="text-right pr-6 text-[11px] font-mono uppercase tracking-wider py-3 text-muted-foreground">Units sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p, idx) => (
            <TableRow key={p.id} className="border-b border-border/40 hover:bg-primary/5">
              <TableCell className="py-3 pl-4 font-mono text-xs text-muted-foreground">#{idx + 1}</TableCell>
              <TableCell className="py-2.5"><ProductImage url={p.imageUrl} alt={p.name} /></TableCell>
              <TableCell className="py-3">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs font-mono text-muted-foreground">#{p.id}</p>
              </TableCell>
              <TableCell className="py-3 text-right font-mono text-sm tabular-nums">{fmt(p.price)}</TableCell>
              <TableCell className="py-3 pr-6 text-right font-mono text-sm font-semibold tabular-nums text-primary">{p.totalSold}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
