import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  action?: ReactNode;
}

/** 보여 줄 내용이 아직 없을 때 쓰는 안내 영역 */
export function EmptyState({ icon: Icon, message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-panel px-6 py-16 text-center">
      <Icon aria-hidden="true" className="size-10 text-muted" />
      <p className="text-lg font-semibold">{message}</p>
      {description !== undefined && <p className="max-w-md text-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}
