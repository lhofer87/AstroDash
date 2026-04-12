import type { GoNoGo } from '@/lib/types/conditions';
import { goNoGoLabel } from '@/lib/utils/conditions';

const styles: Record<GoNoGo, string> = {
  go: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35',
  maybe: 'bg-amber-500/20 text-amber-300 border-amber-500/35',
  nogo: 'bg-rose-500/20 text-rose-300 border-rose-500/35',
};

export function ConditionsBadge({ verdict }: { verdict: GoNoGo }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${styles[verdict]}`}
    >
      {goNoGoLabel(verdict)}
    </span>
  );
}
