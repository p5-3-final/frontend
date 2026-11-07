import { FolderOpen, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { z } from "zod";
import { formatDateTime } from "../../../shared/lib/format";
import { Button } from "../../../shared/ui/Button";
import { EmptyState } from "../../../shared/ui/EmptyState";
import { Pagination } from "../../../shared/ui/Pagination";
import { useWorkSessions } from "../api/useWorkSessions";
import { sessionDetailPath } from "../model/paths";
import type { WorkSession } from "../model/schemas";
import { LoadError } from "./LoadError";

// URL의 ?page는 사용자가 바꿀 수 있는 입력이라 0 이상 정수만 받고, 아니면 첫 쪽을 보여 준다.
const pageParamSchema = z.coerce.number().int().min(0).catch(0);

export interface SessionListProps {
  /** "세션 만들기"를 누르면 부른다. */
  onCreate: () => void;
}

/** 내 작업 세션 목록. 최신순 20개씩 보여 주고 쪽을 URL에 둔다(SPEC-034 R-1). */
export function SessionList({ onCreate }: SessionListProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = pageParamSchema.parse(searchParams.get("page") ?? 0);
  const { data, error, isPending, refetch } = useWorkSessions(page);

  if (isPending) {
    return <p className="text-sm text-muted">작업 세션을 불러오는 중입니다.</p>;
  }
  if (error !== null) {
    return (
      <LoadError
        error={error}
        failedMessage="작업 세션 목록을 불러오지 못했습니다."
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }
  if (data.items.length === 0 && page === 0) {
    return (
      <EmptyState
        icon={FolderOpen}
        message="작업 세션이 없습니다."
        description="작업 전·중·후 영상을 한 세션으로 묶으면 작업 뒤 방호 시설이 돌아왔는지 한 화면에서 비교할 수 있습니다."
        action={
          <Button onClick={onCreate}>
            <Plus aria-hidden="true" className="size-4" />
            세션 만들기
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ul aria-label="작업 세션" className="flex flex-col gap-2">
        {data.items.map((session) => (
          <SessionRow key={session.id} session={session} />
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

function SessionRow({ session }: { session: WorkSession }) {
  return (
    <li className="grid gap-x-4 gap-y-1 rounded-xl border border-line bg-panel p-3 lg:grid-cols-[minmax(0,1fr)_10rem_12rem_12rem] lg:items-center">
      <Link
        to={sessionDetailPath(session.id)}
        className="min-w-0 font-medium break-all text-accent hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {session.name}
      </Link>
      <span className="text-sm break-all">
        <span className="sr-only">현장 </span>
        {session.site ?? "-"}
      </span>
      <span className="text-sm break-all">
        <span className="sr-only">구역 </span>
        {session.area ?? "-"}
      </span>
      <span className="text-sm text-muted">{formatDateTime(session.createdAt)}</span>
    </li>
  );
}
