/** SSE 메시지 한 건. `id`는 마지막으로 받은 id이고 다음 메시지에도 유지된다(SSE 규격의 last event ID). */
export interface SseMessage {
  id: string | undefined;
  event: string;
  data: string;
}

export interface SseParser {
  /** 받은 텍스트 조각을 넣는다. 줄 중간에서 잘린 조각은 다음 조각과 이어 붙인다. */
  push: (chunk: string) => void;
}

/**
 * text/event-stream 해석기(HTML 규격 9.2의 필요한 부분만).
 * 브라우저 EventSource는 새 연결에 Last-Event-ID 헤더를 넣을 수 없어 fetch 스트림을 직접 읽는다(plan 5절, D-22).
 * `retry` 줄은 무시한다. 재연결 간격은 SPEC-031 R-13의 규칙(1초부터 두 배, 최대 30초)을 따른다.
 */
export function createSseParser(onMessage: (message: SseMessage) => void): SseParser {
  let buffer = "";
  let lastId: string | undefined;
  let event = "";
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length > 0) {
      onMessage({
        id: lastId,
        event: event === "" ? "message" : event,
        data: dataLines.join("\n"),
      });
    }
    event = "";
    dataLines = [];
  };

  const handleLine = (line: string) => {
    if (line === "") {
      dispatch();
      return;
    }
    if (line.startsWith(":")) {
      return;
    }
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    let value = colon === -1 ? "" : line.slice(colon + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }
    if (field === "data") {
      dataLines.push(value);
    } else if (field === "event") {
      event = value;
    } else if (field === "id" && !value.includes("\0")) {
      lastId = value;
    }
  };

  return {
    push(chunk) {
      buffer += chunk;
      // 줄 끝은 CRLF·LF·CR 셋 다 허용한다. 마지막 CR은 다음 조각의 LF와 짝일 수 있어 남겨 둔다.
      const pattern = /\r\n|\n|\r(?!$)/;
      let match = pattern.exec(buffer);
      while (match !== null) {
        handleLine(buffer.slice(0, match.index));
        buffer = buffer.slice(match.index + match[0].length);
        match = pattern.exec(buffer);
      }
    },
  };
}
