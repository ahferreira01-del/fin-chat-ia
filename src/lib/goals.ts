import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/finance";

export async function contribute(goal: { id: string; name: string; target_amount: number; saved: number }, amount: number, invalidate: () => void) {
  const { data, error } = await supabase.from("goal_contributions").insert({ goal_id: goal.id, amount }).select("id").single();
  if (error) {
    toast.error("Não foi possível registrar o aporte.");
    return null;
  }
  invalidate();
  const reached = goal.saved < goal.target_amount && goal.saved + amount >= goal.target_amount;
  toast.success(reached ? `🏆 Meta "${goal.name}" concluída! Parabéns!` : `✅ Aporte de ${formatBRL(amount)} registrado`, {
    action: {
      label: "Desfazer",
      onClick: async () => {
        await supabase.from("goal_contributions").delete().eq("id", data.id);
        invalidate();
      },
    },
  });
  return data.id;
}

