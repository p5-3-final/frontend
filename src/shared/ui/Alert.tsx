import type { ReactNode } from "react";

export interface AlertProps {
  tone?: "danger" | "success";
  children: ReactNode;
}

const TONE_CLASSES = {
  danger: "border-danger/40 bg-danger-soft text-danger",
  success: "border-accent/40 bg-accent-soft text-accent",
} as const;

/** 폼 위에 보여 주는 안내. 스크린 리더가 바로 읽도록 role을 둔다. */
export function Alert({ tone = "danger", children }: AlertProps) {
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-lg border px-3 py-2.5 text-sm ${TONE_CLASSES[tone]}`}
    >
      {children}
    </p>
  );
}
