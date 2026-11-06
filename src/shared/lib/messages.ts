// SPEC-002 NFR-3: 오류 code마다 정한 문구를 쓰고, 정하지 않은 code에는 공통 문구를 쓴다.
export const GENERIC_ERROR_MESSAGE = "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";

const INVALID_INPUT_MESSAGE = "입력값을 확인해 주세요.";

// 업로드 전 파일 검사(SPEC-005 R-2, R-3)와 서버 오류에 같은 문구를 쓴다.
export const UNSUPPORTED_FORMAT_MESSAGE = "mp4, mov, mkv, avi 영상만 올릴 수 있습니다.";
export const FILE_SIZE_MESSAGE = "파일 크기는 1바이트 이상 5GB 이하여야 합니다.";
// 저장소 오류는 ProblemDetail이 아니라 code가 없다(SPEC-005 R-10).
export const UNSUPPORTED_PLAYBACK_MESSAGE =
  "이 브라우저에서 재생할 수 없는 영상입니다. 원본을 내려받아 다른 플레이어로 확인해 주세요.";
export const UPLOAD_STORAGE_MESSAGE = "파일을 저장소에 올리지 못했습니다. 다시 시도해 주세요.";

// ── SPEC-031 분석 결과 ──
export const ANALYSIS_NOT_ANALYZED_MESSAGE = "아직 분석 결과가 없습니다.";

/** 이벤트 유형(taxonomy/v2 eventType) 한국어 이름. 모르는 값은 원래 값을 보인다({@link eventTypeName}). */
export const EVENT_TYPE_NAMES: Readonly<Record<string, string>> = {
  fall: "쓰러짐",
  fire_or_smoke: "화재·연기",
  ppe_missing: "보호구 미착용",
  object_removed: "물건 제거",
  barrier_not_restored: "방호 미복구",
  hazard_zone_access: "위험구역 접근",
  equipment_abandoned: "장비 방치",
  object_moved: "안전시설 이동",
  other: "기타",
};

export function eventTypeName(eventType: string): string {
  return EVENT_TYPE_NAMES[eventType] ?? eventType;
}

/** 요약 상태별 안내(SPEC-031 R-2). generated는 요약문을 그대로 보인다. */
export const SUMMARY_STATUS_MESSAGES = {
  not_configured: "요약 모델이 설정되지 않아 요약문이 없습니다.",
  failed: "요약문을 만들지 못했습니다.",
  empty: "요약할 내용이 없습니다.",
} as const;

/** severity(taxonomy/v2) 한국어 이름. 색과 함께 글자로도 보인다(SPEC-031 R-18). */
export const SEVERITY_NAMES = { high: "높음", medium: "보통", low: "낮음" } as const;

/** 판정 상태 이름(SPEC-031 R-6) */
export const VERIFICATION_NAMES = {
  confirmed: "확인됨",
  rejected: "이벤트 아님",
  unverified: "미확인(모델 없음)",
  unknown: "판단 불가",
} as const;

/** 이벤트 확인 상태(운영자 검토) */
export const REVIEW_STATE_NAMES = {
  UNREVIEWED: "확인 전",
  CONFIRMED: "확인함",
  DISMISSED: "기각",
} as const;

/** job 분석 상태(job.status 알림의 status, SPEC-031 R-15). 모르는 값은 원래 값을 보인다. */
export const JOB_STATUS_NAMES: Readonly<Record<string, string>> = {
  PLANNED: "분석 준비 중",
  RUNNING: "분석 중",
  ANALYZED: "결과 정리 중",
  COMPLETED: "분석 완료",
  COMPLETED_WITH_ERRORS: "일부 오류로 분석 완료",
  TIMED_OUT: "분석 시간 초과",
  CANCELLED: "분석 취소됨",
};

/** 작업 세션 역할(SPEC-017) */
export const SESSION_ROLE_NAMES = {
  BEFORE: "작업 전 영상",
  DURING: "작업 중 영상",
  AFTER: "작업 후 영상",
} as const;

/** 분석 API가 code 없이 실패했거나(네트워크 오류 포함) 모르는 code일 때(SPEC-031 R-17) */
export const ANALYSIS_LOAD_FAILED_MESSAGE = "분석 결과를 불러오지 못했습니다.";
export const ANALYSIS_NOT_FOUND_MESSAGE = "영상을 찾을 수 없습니다.";

// ── SPEC-035 품질 화면 ──
/** OPERATOR가 아니거나 품질 API가 403일 때(SPEC-035 R-1, R-20) */
export const QUALITY_FORBIDDEN_MESSAGE = "이 화면을 볼 권한이 없습니다.";

// 기능마다 오류 code 문구를 따로 두고 아래 MESSAGES에서 합친다. 뒤 spec은 자기 묶음을 더한다.
const ANALYSIS_MESSAGES: Readonly<Record<string, string>> = {
  ANALYSIS_SOURCE_NOT_FOUND: ANALYSIS_NOT_FOUND_MESSAGE,
  ANALYSIS_EVENT_NOT_FOUND: "이벤트를 찾을 수 없습니다.",
  ANALYSIS_FORBIDDEN: "운영자만 이벤트를 확인·기각할 수 있습니다.",
  ANALYSIS_UNAVAILABLE: "분석 결과를 잠시 불러올 수 없습니다. 다시 시도해 주세요.",
  ANALYSIS_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
};

const MESSAGES: Readonly<Record<string, string>> = {
  ...ANALYSIS_MESSAGES,
  AUTH_EMAIL_DUPLICATED: "이미 가입된 이메일입니다.",
  AUTH_INVALID_CREDENTIALS: "이메일 또는 비밀번호가 올바르지 않습니다.",
  AUTH_ACCOUNT_LOCKED: "로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  GATEWAY_RATE_LIMITED: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
  AUTH_PASSWORD_POLICY: INVALID_INPUT_MESSAGE,
  AUTH_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
  MEDIA_FILE_SIZE_INVALID: FILE_SIZE_MESSAGE,
  MEDIA_UNSUPPORTED_FORMAT: UNSUPPORTED_FORMAT_MESSAGE,
  MEDIA_UPLOAD_INCOMPLETE: "파일이 모두 올라가지 않았습니다. 다시 시도해 주세요.",
  MEDIA_INVALID_STATE: "만료되었거나 삭제된 영상이라 업로드를 마칠 수 없습니다.",
  MEDIA_VIDEO_NOT_FOUND: "이미 삭제되었거나 찾을 수 없는 영상입니다.",
  MEDIA_NOT_PLAYABLE: "업로드가 끝나지 않았거나 만료된 영상이라 재생할 수 없습니다.",
  MEDIA_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
};

/** 오류 code에 맞는 한국어 문구. code가 없거나 모르는 값이면 공통 문구다. */
export function messageForCode(code: string | undefined): string {
  return (code === undefined ? undefined : MESSAGES[code]) ?? GENERIC_ERROR_MESSAGE;
}
