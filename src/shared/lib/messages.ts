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

// ── SPEC-033 검색 ──
export const SEARCH_QUERY_MESSAGE = "검색어를 1~200자로 입력해 주세요.";
export const SEARCH_IMAGE_MESSAGE = "jpg, png, webp 이미지를 5MB 이하로 올려 주세요.";
export const SEARCH_IMAGE_MISSING_MESSAGE =
  "이미지 검색 결과가 없습니다. 이미지를 다시 올려 주세요.";
export const SEARCH_FAILED_MESSAGE = "검색하지 못했습니다. 다시 시도해 주세요.";
export const SEARCH_SOURCE_REQUIRED_MESSAGE = "검색할 영상을 골라 주세요.";

/** 질의 해석 방법(계약 MomentSearchResult.parseMethod) 이름(SPEC-033 R-2) */
export const PARSE_METHOD_NAMES = {
  "industrial-rule": "산업 현장 규칙으로 해석",
  "english-phrase": "영어 문장 그대로 해석",
  llm: "AI로 해석",
  "safe-fallback": "기본 규칙으로 해석",
  image: "이미지로 검색",
} as const;

export const SEARCH_APPEARANCE_NOTICE = "장면 외형 기준 검색입니다.";
export const SEARCH_REUSED_NOTICE = "저장된 결과를 다시 보여 줍니다.";
export const SEARCH_NOT_FOUND_MESSAGE = "찾지 못했습니다.";

/** 축소 응답 이유(계약 Degraded.reason)별 안내(SPEC-033 R-4) */
export const DEGRADED_MESSAGES = {
  rerank_timeout: "정밀 검색이 제시간에 끝나지 않아 기본 순위로 보여 줍니다.",
  circuit_open: "정밀 검색을 잠시 쓸 수 없어 기본 순위로 보여 줍니다.",
  precise_quota_exceeded: "정밀 검색 사용 한도를 넘어 기본 순위로 보여 줍니다.",
  ai_unavailable: "AI 기능을 쓸 수 없어 텍스트 검색 결과만 보여 줍니다.",
} as const;

export const QUESTION_MESSAGE = "질문을 1~200자로 입력해 주세요.";
export const ANSWER_MISSING_MESSAGE = "답을 만들지 못했고 근거만 보여 줍니다.";
/** 영상 질문 답의 판정 상태(계약 AnswerResult.status) 이름(SPEC-033 R-9) */
export const ANSWER_STATUS_NAMES = { confirmed: "확인됨", unverified: "미확인" } as const;

export const VIDEO_NAME_LOADING = "영상 이름 불러오는 중";
export const VIDEO_NAME_FAILED = "이름을 불러오지 못한 영상";

/** 찾은 경로(계약 MomentResult.matchedBy) 이름 */
export const MATCHED_BY_NAMES = { visual: "시각", text: "텍스트", image: "이미지" } as const;

const SEARCH_MESSAGES: Readonly<Record<string, string>> = {
  SEARCH_QUERY_INVALID: SEARCH_QUERY_MESSAGE,
  SEARCH_IMAGE_INVALID: SEARCH_IMAGE_MESSAGE,
  SEARCH_NOT_INDEXED: "아직 검색할 수 있게 준비되지 않았습니다. 분석이 끝난 뒤 다시 시도해 주세요.",
  SEARCH_SOURCE_NOT_FOUND: ANALYSIS_NOT_FOUND_MESSAGE,
  SEARCH_MOMENT_NOT_FOUND: "검색 결과를 찾을 수 없습니다.",
  SEARCH_GROUNDING_NOT_FOUND: "주석 클립을 찾을 수 없습니다.",
};

// ── SPEC-035 품질 화면 ──
/** OPERATOR가 아니거나 품질 API가 403일 때(SPEC-035 R-1, R-20) */
export const QUALITY_FORBIDDEN_MESSAGE = "이 화면을 볼 권한이 없습니다.";
/** 품질 API가 5xx·네트워크 오류로 실패했을 때(SPEC-035 R-20) */
export const QUALITY_LOAD_FAILED_MESSAGE = "품질 정보를 불러오지 못했습니다.";

const QUALITY_MESSAGES: Readonly<Record<string, string>> = {
  QUALITY_FORBIDDEN: QUALITY_FORBIDDEN_MESSAGE,
  QUALITY_REVIEW_NOT_ASSIGNEE: "이 항목을 맡은 사람만 라벨을 저장할 수 있습니다.",
  QUALITY_REVIEW_ALREADY_ASSIGNED: "이미 다른 사람이 맡았습니다.",
  QUALITY_REVIEW_ALREADY_LABELED: "이미 라벨된 항목입니다.",
  QUALITY_REVIEW_NOT_ASSIGNED: "맡은 상태가 아닌 항목입니다. 목록에서 다시 맡아 주세요.",
  QUALITY_REVIEW_NOT_FOUND: "검토 항목을 찾을 수 없습니다.",
  QUALITY_GOLDEN_SET_DUPLICATED: "같은 이름의 Golden Set이 있습니다.",
  QUALITY_GOLDEN_SET_NOT_FOUND: "Golden Set을 찾을 수 없습니다.",
  QUALITY_GOLDEN_ENTRY_NOT_FOUND: "이미 빠진 초안 항목입니다.",
  // 계약은 라벨 없음과 uncertain 라벨을 같은 code로 돌려주고 본문 errors도 없어 둘을 구분하지 못한다(C-29).
  QUALITY_REVIEW_NOT_LABELED: "라벨이 없거나 불확실 라벨이라 넣을 수 없습니다.",
  QUALITY_GOLDEN_ENTRY_DUPLICATED: "이미 이 Golden Set 초안에 들어 있습니다.",
  QUALITY_GOLDEN_ORIGIN_MISMATCH: "가져온 데이터셋의 Golden Set에는 넣을 수 없습니다.",
  QUALITY_GOLDEN_EMPTY: "초안 항목이 없어 확정할 수 없습니다.",
  QUALITY_GOLDEN_FREEZE_IN_PROGRESS: "다른 확정이 진행 중입니다. 잠시 후 다시 시도해 주세요.",
  QUALITY_RUN_SET_MISMATCH: "다른 Golden Set의 실행입니다.",
  QUALITY_RUN_NOT_FOUND: "평가 실행을 찾을 수 없습니다.",
  QUALITY_SOURCE_NOT_FOUND: "측정 기록 없음(90일 보존)",
  QUALITY_IMPORT_IN_PROGRESS: "같은 매니페스트를 가져오는 중입니다.",
  QUALITY_IMPORT_NOT_FOUND: "가져오기를 찾을 수 없습니다.",
  QUALITY_EXPORT_NOT_FOUND: "내보내기를 찾을 수 없습니다.",
  QUALITY_INVALID_REQUEST: INVALID_INPUT_MESSAGE,
};

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
  ...SEARCH_MESSAGES,
  ...QUALITY_MESSAGES,
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
