/** 진행 막대 위 표시 하나(SPEC-031 R-4). 무엇을 표시할지는 쓰는 쪽(analysis)이 정한다. */
export interface TimelineMarker {
  /** 누르면 돌려줄 값(이벤트 ID) */
  id: string;
  atMs: number;
  /** 스크린 리더가 읽을 이름. 예: "보호구 미착용 01:35 보통" */
  label: string;
  tone: "high" | "medium" | "low" | "none";
}

/** 가까운 표시를 묶은 결과. `percent`는 진행 막대 왼쪽에서의 위치(0~100)다. */
export interface MarkerGroup {
  percent: number;
  first: TimelineMarker;
  count: number;
  tone: TimelineMarker["tone"];
}
