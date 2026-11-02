import { UserMenu } from "../../features/auth";
import { Brand } from "../../shared/ui/Brand";

export function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-panel px-4 lg:px-6">
      <Brand />
      <UserMenu />
    </header>
  );
}
