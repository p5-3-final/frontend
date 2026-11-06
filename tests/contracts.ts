import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 계약 폴더. CI는 잠금 버전을 `.service-contracts/`에 받고(scripts/fetch-service-contracts.sh),
 * 로컬은 작업 공간의 docs 레포 계약을 바로 읽는다. CONTRACTS_DIR을 주면 그 값을 쓴다.
 */
export function contractsDir(): string {
  const candidates = [
    process.env.CONTRACTS_DIR,
    resolve(import.meta.dirname, "../.service-contracts/service-contracts"),
    resolve(import.meta.dirname, "../../../service-contracts"),
  ];
  const found = candidates.find((dir) => dir !== undefined && existsSync(dir));
  if (found === undefined) {
    throw new Error("계약 폴더가 없다. scripts/fetch-service-contracts.sh를 먼저 실행한다.");
  }
  return found;
}

/** 계약 JSON Schema 파일의 `examples`를 읽는다. */
export function contractExamples(relativePath: string): unknown[] {
  const schema: unknown = JSON.parse(readFileSync(resolve(contractsDir(), relativePath), "utf8"));
  if (typeof schema === "object" && schema !== null && "examples" in schema) {
    return Array.isArray(schema.examples) ? schema.examples : [];
  }
  return [];
}
