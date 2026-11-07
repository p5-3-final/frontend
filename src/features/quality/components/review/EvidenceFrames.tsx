import { useRef, useState } from "react";
import { Panel } from "../../../../shared/ui/Panel";

export interface EvidenceFramesProps {
  urls: readonly string[];
  /** 서명 주소가 만료돼 이미지를 못 읽었을 때 부른다. 상세를 다시 받아 새 주소를 얻는다. */
  onExpired: () => void;
}

/**
 * 근거 프레임(SPEC-035 R-4). 서명 주소(1시간)가 만료되면 상세를 한 번만 다시 받는다.
 * 다시 받은 뒤에도 못 읽으면 안내만 보여 무한히 다시 요청하지 않는다.
 */
export function EvidenceFrames({ urls, onExpired }: EvidenceFramesProps) {
  // 여러 이미지가 한꺼번에 실패해도 다시 받기는 한 번이어야 해서 렌더와 무관한 ref로 센다.
  const retried = useRef(false);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    if (!retried.current) {
      retried.current = true;
      onExpired();
      return;
    }
    setFailed(true);
  };

  return (
    <Panel title="근거 프레임">
      {urls.length === 0 ? (
        <p className="text-sm text-muted">근거 프레임 없음</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url, index) => (
            <li key={url}>
              <img
                src={url}
                alt={`근거 프레임 ${String(index + 1)}`}
                onError={handleError}
                className="aspect-video w-full rounded-lg border border-line bg-surface object-cover"
              />
            </li>
          ))}
        </ul>
      )}
      {failed && <p className="text-sm text-danger">근거 프레임을 불러오지 못했습니다.</p>}
    </Panel>
  );
}
