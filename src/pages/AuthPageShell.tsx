import type { ReactNode } from "react";
import { Brand } from "../shared/ui/Brand";

export interface AuthPageShellProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

/** 로그인·가입 화면 공통 틀. 좁은 화면에서도 가로 스크롤 없이 카드 하나로 보인다. */
export function AuthPageShell({ title, children, footer }: AuthPageShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <section className="rounded-2xl border border-line bg-panel p-6 shadow-xl sm:p-8">
          <h1 className="mb-6 text-xl font-bold">{title}</h1>
          {children}
        </section>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}
