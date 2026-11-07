import { Cctv, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Pagination } from "../../../shared/ui/Pagination";
import { streamSessionPath } from "../../stream";
import { useCameras } from "../api/useCameras";
import { cameraDetailPath } from "../model/paths";
import type { Camera } from "../model/schemas";
import { CameraStatusBadge } from "./CameraStatusBadge";

const pageParamSchema = z.coerce.number().int().min(0).catch(0);

export interface CameraListProps {
  onCreate: () => void;
}

/** 카메라 목록(SPEC-034 R-13). 이름·상태·현재 세션을 보이고, 수집 중이면 실시간 세션 화면으로 간다. */
export function CameraList({ onCreate }: CameraListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageParamSchema.parse(searchParams.get("page") ?? 0);
  const { data, error, isPending } = useCameras(page);

  if (isPending) {
    return <p className="text-sm text-muted">카메라를 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return <Alert>{messageForCode(error instanceof ApiError ? error.code : undefined)}</Alert>;
  }
  if (data.items.length === 0 && page === 0) {
    return (
      <EmptyState
        icon={Cctv}
        message="등록한 카메라가 없습니다."
        description="카메라를 등록하고 수집을 시작하면 실시간 세션 화면에서 위험을 볼 수 있습니다."
        action={
          <Button onClick={onCreate}>
            <Plus aria-hidden="true" className="size-4" />
            카메라 등록
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="카메라" className="flex flex-col gap-2">
        {data.items.map((camera) => (
          <CameraRow key={camera.cameraId} camera={camera} />
        ))}
      </ul>
      <Pagination
        page={page}
        totalPages={data.page.totalPages}
        onChange={(next) => {
          setSearchParams(next === 0 ? {} : { page: String(next) });
        }}
      />
    </div>
  );
}

function CameraRow({ camera }: { camera: Camera }) {
  return (
    <li className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-3 sm:grid-cols-[minmax(0,1fr)_7rem_10rem] sm:items-center">
      <Link
        to={cameraDetailPath(camera.cameraId)}
        className="min-w-0 font-medium break-all text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {camera.name}
      </Link>
      <CameraStatusBadge status={camera.status} />
      {camera.activeSessionId === null ? (
        <span className="text-sm text-muted">세션 없음</span>
      ) : (
        <Link
          to={streamSessionPath(camera.activeSessionId)}
          className="text-sm text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          실시간 세션 보기
        </Link>
      )}
    </li>
  );
}
