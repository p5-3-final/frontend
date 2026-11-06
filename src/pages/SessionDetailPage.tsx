import { useParams } from "react-router";
import { SessionDetail } from "../features/sessions";

/** 작업 세션 상세(SPEC-034 R-3~R-5, R-8) */
export function SessionDetailPage() {
  const { sessionId = "" } = useParams();
  return <SessionDetail sessionId={sessionId} />;
}
