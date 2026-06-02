import { useEffect } from "react";
import {CheckCircle2, Package, Plus, Search, Trophy, XCircle} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/orders/StatCard";
import { AppHeader } from "@/components/AppHeader";
import { DeleteProductDialog } from "@/components/products/DeleteProductDialog";
import { ProductDialog } from "@/components/products/ProductDialog";
import { ProductsTable } from "@/components/products/ProductsTable";
import { TopSellingTable } from "@/components/products/TopSellingTable";
import { useDeleteProduct } from "@/components/products/hooks/useDeleteProduct";
import { useProductDialog } from "@/components/products/hooks/useProductDialog";
import { useProductsData } from "@/components/products/hooks/useProductsData";
import type { TabValue } from "@/types/types";

const AdminProducts = () => {
  const data = useProductsData();
  const dialog = useProductDialog(data.categories);
  const del = useDeleteProduct();

  useEffect(() => { document.title = "Biscofa — Admin Products"; }, []);

  const { productsQuery, topSellingQuery, stats, filtered, tab, setTab, search, setSearch } = data;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        onRefresh={() => {
          productsQuery.refetch();
          topSellingQuery.refetch();
        }}
        isRefreshing={productsQuery.isFetching || topSellingQuery.isFetching}
      />

      <main className="container space-y-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
              Products
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Manage the menu — create, edit, and remove products.
            </p>
          </div>
          <Button
            onClick={dialog.openCreate}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant gap-1.5"
          >
            <Plus className="h-4 w-4" />
            New product
          </Button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total products" value={stats.total.toString()} icon={<Package className="h-5 w-5" />} accent="primary" index={0} />
          <StatCard label="Available" value={stats.available.toString()} icon={<CheckCircle2 className="h-5 w-5" />} accent="accent" index={1} />
          <StatCard label="Unavailable" value={stats.unavailable.toString()} icon={<XCircle className="h-5 w-5" />} accent="warning" index={2} />
          <StatCard label="Top seller" value={stats.topName} icon={<Trophy className="h-5 w-5" />} accent="muted" index={3} />
        </section>

        <section className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="w-full md:w-auto">
              <TabsList className="bg-muted/60 border border-border/60 h-9 p-1 gap-0.5 w-full md:w-auto flex">
                {(["all", "available", "unavailable", "top"] as TabValue[]).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="flex-1 md:flex-none px-2 md:px-4 h-7 text-[10px] sm:text-xs font-mono uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-md whitespace-nowrap"
                  >
                    {t === "top" ? "Top-selling" : t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {tab !== "top" && (
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search products…"
                  className="pl-9 h-9 bg-muted/40 border-border/60 text-sm font-body placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-primary/20"
                />
              </div>
            )}
          </div>

          {tab === "top" ? (
            <TopSellingTable
              data={data.topSelling}
              isLoading={topSellingQuery.isLoading}
              isError={topSellingQuery.isError}
              onRetry={() => topSellingQuery.refetch()}
            />
          ) : (
            <ProductsTable
              products={filtered}
              isLoading={productsQuery.isLoading}
              isError={productsQuery.isError}
              onRetry={() => productsQuery.refetch()}
              onEdit={dialog.openEdit}
              onDelete={del.setDeletingProduct}
            />
          )}

          {tab !== "top" && !productsQuery.isLoading && !productsQuery.isError && filtered.length > 0 && (
            <p className="text-right text-[11px] font-mono text-muted-foreground/60">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </section>
      </main>

      <ProductDialog
        ctrl={dialog}
        categories={data.categories}
        categoriesLoading={data.categoriesQuery.isLoading}
      />

      <DeleteProductDialog
        product={del.deletingProduct}
        isPending={del.deleteMutation.isPending}
        onClose={() => del.setDeletingProduct(null)}
        onConfirm={() => del.deletingProduct && del.deleteMutation.mutate(del.deletingProduct.id)}
      />
    </div>
  );
};

export default AdminProducts;
