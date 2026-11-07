import type { ReactNode } from "react";

export interface DataTableProps {
  /** 표 이름. 스크린 리더와 테스트가 이 이름으로 표를 찾는다. */
  label: string;
  columns: readonly string[];
  children: ReactNode;
}

/** 품질 화면의 목록·지표 표. 좁은 화면에서는 표 안에서 가로로 넘긴다(SPEC-002 NFR-4). */
export function DataTable({ label, columns, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table aria-label={label} className="w-full text-left text-sm">
        <thead className="bg-panel-raised text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-3 py-2.5 font-medium whitespace-nowrap">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

/** 표의 칸. 숫자 칸은 `numeric`으로 오른쪽 정렬한다. */
export function Cell({ children, numeric = false }: { children: ReactNode; numeric?: boolean }) {
  return (
    <td className={`px-3 py-2.5 align-top ${numeric ? "text-right tabular-nums" : ""}`}>
      {children}
    </td>
  );
}
