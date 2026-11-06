import { VERIFICATION_NAMES } from "../../../shared/lib/messages";
import type { VerificationStatus } from "./schemas";

// SPEC-031 R-6: ai-gateway가 만든 결과(모델 미설정, 판단 불가)는 설명이 null이다. 빈칸 대신 그 사실을 보인다.
const MISSING_DESCRIPTION: Readonly<Record<VerificationStatus, string>> = {
  confirmed: "설명이 없습니다.",
  rejected: "판정 모델이 이벤트가 아니라고 보았습니다.",
  unverified: "판정 모델이 설정되지 않아 설명이 없습니다.",
  unknown: "판정할 수 없어 설명이 없습니다.",
};

/** 판정 상태 이름(SPEC-031 R-6) */
export function verificationName(status: VerificationStatus): string {
  return VERIFICATION_NAMES[status];
}

/** 화면에 보일 설명. 설명이 null이면 판정 상태별 안내를 쓴다(R-6). */
export function descriptionText(status: VerificationStatus, description: string | null): string {
  return description ?? MISSING_DESCRIPTION[status];
}
