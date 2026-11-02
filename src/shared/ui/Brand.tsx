import { HardHat } from "lucide-react";

/** 서비스 이름과 로고. 인증 화면과 상단 바에서 쓴다. */
export function Brand() {
  return (
    <span className="inline-flex items-center gap-2 text-lg font-bold text-content">
      <HardHat aria-hidden="true" className="size-7 text-accent" />
      AI 안전 관제
    </span>
  );
}
