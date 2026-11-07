import type { ReactNode } from "react";
import { Link } from "react-router";

/** 표·안내 안의 글자 링크 */
export function TextLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="font-semibold text-accent underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      {children}
    </Link>
  );
}
