import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps {
  /** 0부터 센 현재 쪽 */
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

/** 이전·다음 쪽 이동 */
export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const last = Math.max(totalPages, 1) - 1;
  return (
    <nav aria-label="쪽 이동" className="flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        aria-label="이전 쪽"
        disabled={page <= 0}
        onClick={() => {
          onChange(page - 1);
        }}
      >
        <ChevronLeft aria-hidden="true" className="size-5" />
      </Button>
      <span className="text-sm text-muted">
        {page + 1} / {last + 1}쪽
      </span>
      <Button
        variant="secondary"
        aria-label="다음 쪽"
        disabled={page >= last}
        onClick={() => {
          onChange(page + 1);
        }}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </nav>
  );
}
