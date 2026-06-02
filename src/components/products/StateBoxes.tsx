import { AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorBox({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-14 text-center">
      <div className="h-12 w-12 rounded-full border border-destructive/30 bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">Could not load</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          The API may be unreachable. Check your connection and try again.
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry} className="border-destructive/30 text-destructive hover:bg-destructive/10">
        Try again
      </Button>
    </div>
  );
}

export function EmptyBox() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-14 text-center">
      <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">No products match this view.</p>
    </div>
  );
}
