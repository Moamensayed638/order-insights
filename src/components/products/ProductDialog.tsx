import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/product";
import { EDIT_TABS } from "./constants/constants";
import { DetailsForm } from "./DetailsForm";
import { ModifierEditList } from "./ModifierEditList";
import { SizeEditList } from "./SizeEditList";
import { WizardModifiers } from "./WizardModifiers";
import { WizardSizes } from "./WizardSizes";
import type { ProductDialogController } from "./hooks/useProductDialog";

export function ProductDialog({
  ctrl, categories, categoriesLoading,
}: {
  ctrl: ProductDialogController;
  categories: Category[];
  categoriesLoading: boolean;
}) {
  const {
    dialogOpen, wizardStep, setWizardStep, editing, editTab, setEditTab,
    form, setForm, sizes, setSizes, modifierGroups, setModifierGroups,
    formError, sizeEdits, setSizeEdits, optionEdits, setOptionEdits,
    sizeRowError, optionRowError, savingSizes, savingOptions, saveMutation,
    closeDialog, selectDefaultSize, saveAllSizes, saveAllOptions,
    handleImageChange, handleSubmit,
  } = ctrl;

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
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

        {/* Edit tabs */}
        {editing && (
          <Tabs value={editTab} onValueChange={(v) => setEditTab(v as typeof editTab)}>
            <TabsList className="bg-muted/60 border border-border/60 h-9 p-1 gap-0.5 w-full flex">
              {EDIT_TABS.map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex-1 h-7 text-xs font-mono uppercase tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none rounded-md"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {((editing && editTab === "details") || (!editing && wizardStep === 1)) && (
            <DetailsForm
              form={form}
              setForm={setForm}
              categories={categories}
              categoriesLoading={categoriesLoading}
              editing={editing}
              onImageChange={handleImageChange}
            />
          )}

          {editing && editTab === "sizes" && (
            <SizeEditList
              sizeEdits={sizeEdits}
              setSizeEdits={setSizeEdits}
              onSelectDefault={selectDefaultSize}
              rowError={sizeRowError}
            />
          )}

          {editing && editTab === "modifiers" && (
            <ModifierEditList
              optionEdits={optionEdits}
              setOptionEdits={setOptionEdits}
              rowError={optionRowError}
            />
          )}

          {!editing && wizardStep === 2 && (
            <WizardSizes sizes={sizes} setSizes={setSizes} />
          )}

          {!editing && wizardStep === 3 && (
            <WizardModifiers modifierGroups={modifierGroups} setModifierGroups={setModifierGroups} />
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
                onClick={() => setWizardStep((s) => (s - 1) as 1 | 2 | 3)}
                className="border-border/60"
              >
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="border-border/60"
              >
                {editing && editTab !== "details" ? "Close" : "Cancel"}
              </Button>
            )}
            {editing && editTab === "sizes" ? (
              <Button
                type="button"
                disabled={savingSizes || sizeEdits.length === 0}
                onClick={saveAllSizes}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant"
              >
                {savingSizes ? "Saving…" : "Save sizes"}
              </Button>
            ) : editing && editTab === "modifiers" ? (
              <Button
                type="button"
                disabled={savingOptions || optionEdits.length === 0}
                onClick={saveAllOptions}
                className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-elegant"
              >
                {savingOptions ? "Saving…" : "Save modifiers"}
              </Button>
            ) : (
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
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
