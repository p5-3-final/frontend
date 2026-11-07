import { useParams } from "react-router";
import { CameraDetail } from "../features/cameras";

/** 카메라 상세(SPEC-034 R-13, R-14) */
export function CameraDetailPage() {
  const { cameraId = "" } = useParams();
  return <CameraDetail cameraId={cameraId} />;
}
