import { useId, type ReactNode } from "react";

export interface PanelProps {
  title: string;
  /** 제목 옆에 둘 보조 내용(개수, 버튼 등) */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** 제목이 있는 화면 구역. 제목이 구역 이름이 되어 스크린 리더가 구역으로 이동할 수 있다. */
export function Panel({ title, aside, children, className = "" }: PanelProps) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={`flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-panel p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={headingId} className="text-base font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}
