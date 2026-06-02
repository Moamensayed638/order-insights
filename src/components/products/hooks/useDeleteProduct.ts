import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteProduct } from "@/lib/adminProducts";
import type { AdminProduct } from "@/types/product";

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => {
      toast.success("Product deleted");
      setDeletingProduct(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-top-selling"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Failed to delete product"),
  });

  return { deletingProduct, setDeletingProduct, deleteMutation };
}
