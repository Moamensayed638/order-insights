import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchCategories, fetchProducts, fetchTopSelling, filterProductsBySearch,
} from "@/lib/adminProducts";
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

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const topSelling = useMemo(() => topSellingQuery.data ?? [], [topSellingQuery.data]);

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
    tab, setTab, search, setSearch,
  };
}
