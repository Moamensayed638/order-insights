import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, Coffee, Package, Plus, Pencil, Search, Trash2, TrendingUp,
  CheckCircle2, XCircle, Trophy, Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/orders/StatCard";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createModifierGroup, createModifierOption, createProduct, createSize,
  deleteProduct, fetchCategories, fetchProducts, fetchTopSelling,
  filterProductsBySearch, formatDiscountTimestamp, resolveEditCategoryId,
  resolveImageUrl, updateProduct, validateModifierGroups, validateProductForm,
  validateSizes,
} from "@/lib/adminProducts";
import type { ModifierGroupDraft, SizeDraft } from "@/lib/adminProducts";
import type { AdminProduct, ProductFormInput } from "@/types/product";

const fmt = (n: number) => `${n.toFixed(2)} EGP`;

type TabValue = "all" | "available" | "unavailable" | "top";

type FormState = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  calories: string;
  pointsReward: string;
  discountPercentage: string;
  discountStart: string;
  discountEnd: string;
  image: File | null;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  calories: "0",
  pointsReward: "0",
  discountPercentage: "",
  discountStart: "",
  discountEnd: "",
  image: null,
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const AdminProducts = () => {
  const queryClient = useQueryClient();

  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: fetchProducts });
  const categoriesQuery = useQuery({ queryKey: ["admin-categories"], queryFn: fetchCategories });
  const topSellingQuery = useQuery({
    queryKey: ["admin-top-selling"],
    queryFn: () => fetchTopSelling(10, 30),
  });

  const [tab, setTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [sizes, setSizes] = useState<SizeDraft[]>([{ name: "", price: "", isDefault: true }]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupDraft[]>([
    { name: "", isRequired: false, maxSelections: "1", options: [{ name: "", extraPrice: "0" }] },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<AdminProduct | null>(null);

  useEffect(() => { document.title = "Biscofa — Admin Products"; }, []);

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const topSelling = topSellingQuery.data ?? [];

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

  function resetForm() {
    setForm(emptyForm);
    setEditing(null);
    setFormError(null);
    setWizardStep(1);
    setSizes([{ name: "", price: "", isDefault: true }]);
    setModifierGroups([{ name: "", isRequired: false, maxSelections: "1", options: [{ name: "", extraPrice: "0" }] }]);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(product: AdminProduct) {
    setEditing(product);
    setFormError(null);
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      categoryId: resolveEditCategoryId(product, categories),
      calories: String(product.calories),
      pointsReward: String(product.pointsReward),
      discountPercentage:
        product.discountPercentage != null ? String(product.discountPercentage) : "",
      discountStart: product.discountStart ? product.discountStart.slice(0, 16) : "",
      discountEnd: product.discountEnd ? product.discountEnd.slice(0, 16) : "",
      image: null,
    });
    setDialogOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (input: { id?: number; payload: ProductFormInput }) => {
      if (input.id != null) return updateProduct(input.id, input.payload);
      const product = await createProduct(input.payload);
      await Promise.all(sizes.map((s) =>
        createSize(product.id, { name: s.name.trim(), price: Number(s.price), isDefault: s.isDefault }),
      ));
      for (const g of modifierGroups) {
        const group = await createModifierGroup(product.id, {
          name: g.name.trim(),
          isRequired: g.isRequired,
          maxSelections: Number(g.maxSelections),
        });
        if (group?.id) {
          await Promise.all(g.options.map((o) =>
            createModifierOption(group.id, { name: o.name.trim(), extraPrice: Number(o.extraPrice) }),
          ));
        }
      }
      return product;
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.id != null ? "Product updated" : "Product created");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-top-selling"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Failed to save product"),
  });

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

  function handleImageChange(file: File | null) {
    if (file && file.size > MAX_IMAGE_BYTES) {
      setFormError("Image must be 2 MB or less");
      return;
    }
    setFormError(null);
    setForm((f) => ({ ...f, image: file }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (wizardStep === 1) {
      const err = validateProductForm(
        {
          name: form.name,
          description: form.description,
          price: form.price,
          categoryId: form.categoryId,
          calories: form.calories,
          pointsReward: form.pointsReward,
          discountPercentage: form.discountPercentage,
        },
        { isEditing: Boolean(editing), hasImage: Boolean(form.image) },
      );
      if (err) return setFormError(err);
      if (!editing) return setWizardStep(2);
    }

    if (wizardStep === 2) {
      const err = validateSizes(sizes);
      if (err) return setFormError(err);
      return setWizardStep(3);
    }

    const err3 = validateModifierGroups(modifierGroups);
    if (err3) return setFormError(err3);

    const discountPercentage =
      form.discountPercentage.trim() === "" ? null : Number(form.discountPercentage);

    const payload: ProductFormInput = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      categoryId: Number(form.categoryId),
      calories: Number(form.calories),
      pointsReward: Number(form.pointsReward),
      image: form.image,
      discountPercentage,
      discountStart: formatDiscountTimestamp(form.discountStart),
      discountEnd: formatDiscountTimestamp(form.discountEnd),
    };

    saveMutation.mutate({ id: editing?.id, payload });
  }

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
            onClick={openCreate}
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
              data={topSelling}
              isLoading={topSellingQuery.isLoading}
              isError={topSellingQuery.isError}
              onRetry={() => topSellingQuery.refetch()}
            />
          ) : productsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-md bg-muted/50" style={{ opacity: 1 - i * 0.12 }} />
              ))}
            </div>
          ) : productsQuery.isError ? (
            <ErrorBox onRetry={() => productsQuery.refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyBox />
          ) : (
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
                  {filtered.map((p, rowIdx) => (
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
                            onClick={() => openEdit(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingProduct(p)}
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
          )}

          {tab !== "top" && !productsQuery.isLoading && !productsQuery.isError && filtered.length > 0 && (
            <p className="text-right text-[11px] font-mono text-muted-foreground/60">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </section>
      </main>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl bg-card border-border/60 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? `Edit product #${editing.id}` : "New product"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {editing
                ? "Update the product details. Image is optional — leave blank to keep the current one."
                : "Fill in the details to add a new product to the menu."}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator (create only) */}
          {!editing && (
            <div className="flex items-center gap-2 py-1">
              {([1, 2, 3] as const).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold",
                    wizardStep === s
                      ? "bg-primary text-primary-foreground"
                      : wizardStep > s
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}>
                    {s}
                  </div>
                  <span className={cn(
                    "text-[10px] font-mono uppercase tracking-wide",
                    wizardStep === s ? "text-foreground" : "text-muted-foreground/60",
                  )}>
                    {s === 1 ? "Details" : s === 2 ? "Sizes" : "Modifiers"}
                  </span>
                  {s < 3 && <div className="h-px w-6 bg-border/60" />}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Basic info */}
            {(editing || wizardStep === 1) && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" required>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Category" required>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesQuery.isLoading ? "Loading…" : "Pick a category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field label="Description" required>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Price (EGP)" required>
                    <Input type="number" step="0.01" min="0" value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  </Field>
                  <Field label="Calories">
                    <Input type="number" min="0" value={form.calories}
                      onChange={(e) => setForm({ ...form, calories: e.target.value })} />
                  </Field>
                  <Field label="Points reward">
                    <Input type="number" min="0" value={form.pointsReward}
                      onChange={(e) => setForm({ ...form, pointsReward: e.target.value })} />
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Discount % (optional)">
                    <Input type="number" min="0" max="100" step="0.01" value={form.discountPercentage}
                      onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })} placeholder="—" />
                  </Field>
                  <Field label="Discount start (optional)">
                    <Input type="datetime-local" value={form.discountStart}
                      onChange={(e) => setForm({ ...form, discountStart: e.target.value })} />
                  </Field>
                  <Field label="Discount end (optional)">
                    <Input type="datetime-local" value={form.discountEnd}
                      onChange={(e) => setForm({ ...form, discountEnd: e.target.value })} />
                  </Field>
                </div>

                <Field label={editing ? "Replace image (optional, ≤ 2 MB)" : "Image (required, ≤ 2 MB)"} required={!editing}>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
                  />
                  {editing && editing.imageUrl && (
                    <p className="mt-1 text-[10px] font-mono text-muted-foreground">
                      Current: {editing.imageUrl.split("/").pop()}
                    </p>
                  )}
                </Field>
              </>
            )}

            {/* Step 2: Sizes */}
            {!editing && wizardStep === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground font-body">
                  Add at least one size. Mark one as the default.
                </p>
                {sizes.map((s, i) => (
                  <div key={i} className="flex items-end gap-2 rounded-md border border-border/60 bg-muted/20 p-3">
                    <Field label="Name" required>
                      <Input
                        value={s.name}
                        onChange={(e) => setSizes(sizes.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        placeholder="e.g. Medium"
                        className="w-32"
                      />
                    </Field>
                    <Field label="Price (EGP)" required>
                      <Input
                        type="number" step="0.01" min="0"
                        value={s.price}
                        onChange={(e) => setSizes(sizes.map((x, j) => j === i ? { ...x, price: e.target.value } : x))}
                        placeholder="0"
                        className="w-28"
                      />
                    </Field>
                    <div className="flex items-center gap-1.5 pb-1">
                      <input
                        type="radio"
                        name="sizeDefault"
                        checked={s.isDefault}
                        onChange={() => setSizes(sizes.map((x, j) => ({ ...x, isDefault: j === i })))}
                        className="accent-primary"
                        id={`size-default-${i}`}
                      />
                      <label htmlFor={`size-default-${i}`} className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground cursor-pointer">
                        Default
                      </label>
                    </div>
                    {sizes.length > 1 && (
                      <Button
                        type="button" variant="ghost" size="icon"
                        onClick={() => setSizes(sizes.filter((_, j) => j !== i))}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setSizes([...sizes, { name: "", price: "", isDefault: false }])}
                  className="gap-1.5 border-border/60 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add size
                </Button>
              </div>
            )}

            {/* Step 3: Modifier groups */}
            {!editing && wizardStep === 3 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground font-body">
                  Add at least one modifier group, each with at least one option.
                </p>
                {modifierGroups.map((g, gi) => (
                  <div key={gi} className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-3">
                    <div className="flex items-end gap-2">
                      <Field label={`Group #${gi + 1} name`} required>
                        <Input
                          value={g.name}
                          onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, name: e.target.value } : x))}
                          placeholder="e.g. Extras"
                          className="w-40"
                        />
                      </Field>
                      <Field label="Max selections" required>
                        <Input
                          type="number" min="1"
                          value={g.maxSelections}
                          onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, maxSelections: e.target.value } : x))}
                          className="w-24"
                        />
                      </Field>
                      <div className="flex items-center gap-1.5 pb-1">
                        <input
                          type="checkbox"
                          checked={g.isRequired}
                          onChange={(e) => setModifierGroups(modifierGroups.map((x, j) => j === gi ? { ...x, isRequired: e.target.checked } : x))}
                          className="accent-primary"
                          id={`group-required-${gi}`}
                        />
                        <label htmlFor={`group-required-${gi}`} className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground cursor-pointer">
                          Required
                        </label>
                      </div>
                      {modifierGroups.length > 1 && (
                        <Button
                          type="button" variant="ghost" size="icon"
                          onClick={() => setModifierGroups(modifierGroups.filter((_, j) => j !== gi))}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2 pl-2 border-l border-border/40">
                      {g.options.map((o, oi) => (
                        <div key={oi} className="flex items-end gap-2">
                          <Field label={`Option #${oi + 1} name`} required>
                            <Input
                              value={o.name}
                              onChange={(e) => setModifierGroups(modifierGroups.map((x, j) =>
                                j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, name: e.target.value } : op) } : x,
                              ))}
                              placeholder="e.g. Sugar"
                              className="w-36"
                            />
                          </Field>
                          <Field label="Extra price (EGP)" required>
                            <Input
                              type="number" step="0.01" min="0"
                              value={o.extraPrice}
                              onChange={(e) => setModifierGroups(modifierGroups.map((x, j) =>
                                j === gi ? { ...x, options: x.options.map((op, k) => k === oi ? { ...op, extraPrice: e.target.value } : op) } : x,
                              ))}
                              className="w-28"
                              placeholder="0"
                            />
                          </Field>
                          {g.options.length > 1 && (
                            <Button
                              type="button" variant="ghost" size="icon"
                              onClick={() => setModifierGroups(modifierGroups.map((x, j) =>
                                j === gi ? { ...x, options: x.options.filter((_, k) => k !== oi) } : x,
                              ))}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 mb-0.5"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button" variant="outline" size="sm"
                        onClick={() => setModifierGroups(modifierGroups.map((x, j) =>
                          j === gi ? { ...x, options: [...x.options, { name: "", extraPrice: "0" }] } : x,
                        ))}
                        className="gap-1.5 border-border/60 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add option
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setModifierGroups([...modifierGroups, { name: "", isRequired: false, maxSelections: "1", options: [{ name: "", extraPrice: "0" }] }])}
                  className="gap-1.5 border-border/60 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add group
                </Button>
              </div>
            )}

            {formError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}

            <DialogFooter>
              {!editing && wizardStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setFormError(null); setWizardStep((s) => (s - 1) as 1 | 2 | 3); }}
                  className="border-border/60"
                >
                  Back
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                  className="border-border/60"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant"
              >
                {saveMutation.isPending
                  ? "Saving…"
                  : editing
                  ? "Save changes"
                  : wizardStep < 3
                  ? "Next"
                  : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProduct
                ? `"${deletingProduct.name}" (#${deletingProduct.id}) will be permanently removed.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function ProductImage({ url, alt }: { url: string; alt: string }) {
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

function TopSellingTable({
  data, isLoading, isError, onRetry,
}: {
  data: { id: number; name: string; price: number; imageUrl: string; totalSold: number }[];
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

function ErrorBox({ onRetry }: { onRetry: () => void }) {
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

function EmptyBox() {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-14 text-center">
      <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">No products match this view.</p>
    </div>
  );
}

export default AdminProducts;
