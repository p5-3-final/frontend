import { useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";

export interface MobileNavProps {
  id: string;
  onClose: () => void;
}

/**
 * 1024px 미만에서 메뉴 버튼으로 여는 서랍(SPEC-002 NFR-5). 열리면 첫 메뉴로 초점을 옮기고,
 * Escape·바깥 클릭·메뉴 선택으로 닫는다.
 */
export function MobileNav({ id, onClose }: MobileNavProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // 키보드 사용자가 바로 메뉴를 고를 수 있게 초점을 옮기고, Escape를 듣는다. 둘 다 React 밖의 DOM과 동기화한다.
  useEffect(() => {
    panelRef.current?.querySelector("a")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <button
        type="button"
        aria-label="메뉴 닫기"
        tabIndex={-1}
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className="absolute inset-y-0 left-0 w-64 max-w-[80vw] border-r border-line bg-panel shadow-2xl"
      >
        <Sidebar onNavigate={onClose} />
      </div>
    </div>
  );
}
