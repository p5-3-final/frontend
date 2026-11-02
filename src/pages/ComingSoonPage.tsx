import { Construction } from "lucide-react";
import { EmptyState } from "../shared/ui/EmptyState";

export interface ComingSoonPageProps {
  title: string;
}

/** 아직 기능이 없는 메뉴 화면(SPEC-002 R-15). 기능 spec이 들어오면 각 화면으로 바꾼다. */
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{title}</h1>
      <EmptyState
        icon={Construction}
        message="준비 중인 기능입니다."
        description="기능이 준비되면 이 메뉴에서 바로 쓸 수 있습니다."
      />
    </section>
  );
}
