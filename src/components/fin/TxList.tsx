import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBRL, formatDate, type Transaction, useInvalidateFinance } from "@/lib/finance";
import { TransactionDialog, deleteTransaction } from "./TransactionDialog";

export function TxList({ items }: { items: Transaction[] }) {
  const [edit, setEdit] = useState<Transaction | null>(null);
  const [view, setView] = useState<Transaction | null>(null);
  const invalidate = useInvalidateFinance();
  return (
    <>
      <ul className="divide-y rounded-2xl bg-card shadow-soft">
        {items.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                t.type === "receita" ? "bg-accent text-income" : "bg-muted text-expense"
              }`}
            >
              {t.type === "receita" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.description || t.category}</p>
              <p className="text-xs text-muted-foreground">
                {t.category} · {formatDate(t.occurred_on)}
              </p>
            </div>
            <span className={`tabular text-sm font-semibold ${t.type === "receita" ? "text-income" : "text-expense"}`}>
              {t.type === "receita" ? "+" : "−"}
              {formatBRL(t.amount)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded-full p-1 text-muted-foreground hover:bg-muted" aria-label="Opções">
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setView(t)}>
                  <Eye className="h-4 w-4" /> Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEdit(t)}>
                  <Pencil className="h-4 w-4" /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => deleteTransaction(t, invalidate)}>
                  <Trash2 className="h-4 w-4" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
      <TransactionDialog tx={edit} onClose={() => setEdit(null)} />
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes</DialogTitle>
          </DialogHeader>
          {view && (
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="capitalize">{view.type}</dd>
              <dt className="text-muted-foreground">Valor</dt>
              <dd className="tabular font-semibold">{formatBRL(view.amount)}</dd>
              <dt className="text-muted-foreground">Descrição</dt>
              <dd>{view.description || "—"}</dd>
              <dt className="text-muted-foreground">Categoria</dt>
              <dd>{view.category}</dd>
              <dt className="text-muted-foreground">Data</dt>
              <dd>{formatDate(view.occurred_on)}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
