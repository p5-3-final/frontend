import { describe, expect, it } from "vitest";
import { createSseParser, type SseMessage } from "./parseSse";

function parseAll(...chunks: string[]) {
  const messages: SseMessage[] = [];
  const parser = createSseParser((message) => messages.push(message));
  for (const chunk of chunks) {
    parser.push(chunk);
  }
  return messages;
}

describe("parseSse", () => {
  it("[SPEC-031 R-12] id·event·data 줄을 빈 줄 단위로 메시지 하나로 묶는다", () => {
    expect(parseAll('id: 1\nevent: job.status\ndata: {"a":1}\n\n')).toEqual([
      { id: "1", event: "job.status", data: '{"a":1}' },
    ]);
  });

  it("[SPEC-031 R-12] 여러 줄 data는 줄바꿈으로 잇고 event가 없으면 message다", () => {
    expect(parseAll("data: a\ndata: b\n\n")).toEqual([
      { id: undefined, event: "message", data: "a\nb" },
    ]);
  });

  it("[SPEC-031 R-12] 주석 줄은 무시하고 CRLF도 줄 끝으로 본다", () => {
    expect(parseAll(": keep-alive\r\nevent: ping\r\ndata: {}\r\n\r\n")).toEqual([
      { id: undefined, event: "ping", data: "{}" },
    ]);
  });

  it("[SPEC-031 R-13] 조각난 청크를 이어 붙이고 마지막 id를 다음 메시지에도 유지한다", () => {
    expect(parseAll("id: 7\nda", "ta: x\n", "\ndata: y\n\n")).toEqual([
      { id: "7", event: "message", data: "x" },
      { id: "7", event: "message", data: "y" },
    ]);
  });

  it("[SPEC-031 R-12] data가 없는 블록은 내보내지 않는다", () => {
    expect(parseAll("id: 3\n\n")).toEqual([]);
  });
});
