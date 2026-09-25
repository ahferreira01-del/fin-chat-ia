import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Transaction,
  type TxType,
  useInvalidateFinance,
} from "@/lib/finance";

export type TxDraft = { type: TxType; amount: number; description: string; category: string; occurred_on: string };

export function TxFields({ value, onChange }: { value: TxDraft; onChange: (v: TxDraft) => void }) {
  const cats = value.type === "receita" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-2 gap-2">
        {(["despesa", "receita"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ ...value, type: t, category: "Outros" })}
            className={`rounded-xl border py-2 text-sm font-medium capitalize ${
              value.type === t ? (t === "receita" ? "border-income bg-accent text-income" : "border-expense text-expense") : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="grid gap-1.5">
        <Label>Valor (R$)</Label>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={Number.isFinite(value.amount) ? value.amount : ""}
          onChange={(e) => onChange({ ...value, amount: parseFloat(e.target.value) })}
        />
      </div>
      <div className="grid gap-1.5">
        <Label>Descrição</Label>
        <Input value={value.description} onChange={(e) => onChange({ ...value, description: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="grid gap-1.5">
          <Label>Categoria</Label>
          <select
            className="h-9 rounded-md border bg-card px-2 text-sm"
            value={value.category}
            onChange={(e) => onChange({ ...value, category: e.target.value })}
          >
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label>Data</Label>
          <Input type="date" value={value.occurred_on} onChange={(e) => onChange({ ...value, occurred_on: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

export function TransactionDialog({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const [draft, setDraft] = useState<TxDraft | null>(null);
  const invalidate = useInvalidateFinance();
  useEffect(() => {
    setDraft(tx ? { type: tx.type, amount: tx.amount, description: tx.description, category: tx.category, occurred_on: tx.occurred_on } : null);
  }, [tx]);

  async function save() {
    if (!tx || !draft || !(draft.amount > 0)) return toast.error("Informe um valor válido.");
    const { error } = await supabase.from("transactions").update(draft).eq("id", tx.id);
    if (error) return toast.error("Não foi possível salvar.");
    toast.success("Movimentação atualizada");
    invalidate();
    onClose();
  }

  return (
    <Dialog open={!!tx} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Editar movimentação</DialogTitle>
        </DialogHeader>
        {draft && <TxFields value={draft} onChange={setDraft} />}
        <Button onClick={save}>Salvar alterações</Button>
      </DialogContent>
    </Dialog>
  );
}

export async function deleteTransaction(tx: Transaction, invalidate: () => void) {
  const { error } = await supabase.from("transactions").delete().eq("id", tx.id);
  if (error) return toast.error("Não foi possível excluir.");
  invalidate();
  toast("Movimentação excluída", {
    action: {
      label: "Desfazer",
      onClick: async () => {
        await supabase.from("transactions").insert({
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          category: tx.category,
          occurred_on: tx.occurred_on,
        });
        invalidate();
      },
    },
  });
}
