import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories, fetchProducts, fetchTopSelling, filterProductsBySearch,
} from "@/lib/adminProducts";
import { getAllDrafts } from "@/lib/productDrafts";
import type { AdminProduct, ProductDraft } from "@/types/product";
import type { TabValue } from "../../../types/types";

export function useProductsData() {
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: fetchProducts });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });
  const topSellingQuery = useQuery({
    queryKey: ["admin-top-selling"],
    queryFn: () => fetchTopSelling(10, 30),
  });

  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [draftUpdateTrigger, setDraftUpdateTrigger] = useState(0);

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const topSelling = useMemo(() => topSellingQuery.data ?? [], [topSellingQuery.data]);

  // Listen for storage events from other tabs and refetch trigger
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "biscofa_product_drafts") {
        setDraftUpdateTrigger((prev) => prev + 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Refetch drafts when products query changes or draft trigger updates
  useEffect(() => {
    if (productsQuery.isSuccess) {
      setDraftUpdateTrigger((prev) => prev + 1);
    }
  }, [productsQuery.dataUpdatedAt]);

  const drafts = useMemo(() => getAllDrafts(), [draftUpdateTrigger]);

  const allProductsWithDrafts = useMemo<(AdminProduct | ProductDraft)[]>(
    () => [...drafts, ...products],
    [drafts, products]
  );

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.isAvailable).length;
    const unavailable = total - available;
    const topName = topSelling[0]?.name ?? "—";
    return { total, available, unavailable, topName };
  }, [products, topSelling]);

  const filtered = useMemo(() => {
    const byTab =
      tab === "available" ? products.filter((p) => p.isAvailable)
        : tab === "unavailable" ? products.filter((p) => !p.isAvailable)
          : products;
    return filterProductsBySearch(byTab, search);
  }, [products, tab, search]);

  return {
    productsQuery, categoriesQuery, topSellingQuery,
    products, categories, topSelling, stats, filtered,
    allProductsWithDrafts,
    tab, setTab, search, setSearch,
  };
}
