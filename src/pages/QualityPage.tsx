import { Navigate, Route, Routes } from "react-router";
import {
  EvaluationRunDetail,
  EvaluationRunList,
  GoldenSetDetail,
  GoldenSetList,
  QualityTabs,
  RequireOperator,
  ReviewDetail,
  ReviewQueue,
} from "../features/quality";

/**
 * 품질 화면(SPEC-035). 하위 화면을 이 묶음 안의 라우트로 두어 품질 코드가 lazy 묶음 하나에 모이게 한다(NFR-2).
 */
export function QualityPage() {
  return (
    <RequireOperator>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">품질</h1>
        <QualityTabs />
        <Routes>
          <Route path="review" element={<ReviewQueue />} />
          <Route path="review/:itemId" element={<ReviewDetail />} />
          <Route path="golden-sets" element={<GoldenSetList />} />
          <Route path="golden-sets/:setId" element={<GoldenSetDetail />} />
          <Route path="runs" element={<EvaluationRunList />} />
          <Route path="runs/:runId" element={<EvaluationRunDetail />} />
          <Route path="*" element={<Navigate to="/quality/review" replace />} />
        </Routes>
      </div>
    </RequireOperator>
  );
}
