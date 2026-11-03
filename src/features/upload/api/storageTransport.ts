/**
 * media-service가 준 서명 주소로 파일 바이트를 저장소(S3·SeaweedFS)에 바로 보낸다(SPEC-005 NFR-1).
 * fetch는 업로드 진행률을 주지 않아 XMLHttpRequest를 쓴다. 서명 주소에 권한이 들어 있으므로 인증 헤더와 쿠키는 보내지 않는다.
 */
export interface TransferOptions {
  signal?: AbortSignal;
  /** 이번 요청에서 지금까지 보낸 바이트. 다시 보내면 0부터 다시 센다. */
  onProgress?: (loadedBytes: number) => void;
  /** 다시 보내기 전 기다리는 시간. 길이가 재시도 횟수다. */
  retryDelaysMs?: readonly number[];
}

/** 저장소 요청 실패. `status`가 없으면 네트워크 오류다. */
export class StorageError extends Error {
  constructor(readonly status: number | undefined) {
    super(`storage request failed with status ${String(status)}`);
    this.name = "StorageError";
  }
}

// SPEC-005 R-9: 일시적인 실패만 1초, 2초, 4초 뒤 최대 3번 다시 보낸다.
const DEFAULT_RETRY_DELAYS_MS = [1000, 2000, 4000] as const;

/** 조각 하나를 PUT하고 응답의 ETag를 돌려준다(SPEC-005 R-6). */
export async function putPart(
  url: string,
  body: Blob,
  options: TransferOptions = {},
): Promise<string> {
  const xhr = await sendWithRetry("PUT", url, () => body, body.size, options);
  const eTag = xhr.getResponseHeader("ETag");
  if (eTag === null) {
    // 저장소 CORS가 ETag를 노출하지 않으면 완료 요청을 만들 수 없다. 다시 보내도 같다.
    throw new StorageError(xhr.status);
  }
  return eTag;
}

/** 단일 업로드 POST 폼. 저장소 POST 정책 규칙에 따라 `fields`를 먼저 넣고 파일을 마지막에 넣는다(SPEC-005 R-5). */
export async function postForm(
  url: string,
  fields: Record<string, string>,
  file: Blob,
  options: TransferOptions = {},
): Promise<void> {
  const buildForm = () => {
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      form.append(key, value);
    });
    form.append("file", file);
    return form;
  };
  await sendWithRetry("POST", url, buildForm, file.size, options);
}

async function sendWithRetry(
  method: "PUT" | "POST",
  url: string,
  body: () => XMLHttpRequestBodyInit,
  totalBytes: number,
  options: TransferOptions,
): Promise<XMLHttpRequest> {
  const delays = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
  for (let attempt = 0; ; attempt++) {
    try {
      const xhr = await send(method, url, body(), options);
      options.onProgress?.(totalBytes);
      return xhr;
    } catch (error) {
      const delay = delays[attempt];
      if (!isRetryable(error) || delay === undefined || options.signal?.aborted === true) {
        throw options.signal?.aborted === true ? abortError() : error;
      }
      await wait(delay, options.signal);
    }
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof StorageError && (error.status === undefined || error.status >= 500);
}

function send(
  method: string,
  url: string,
  body: XMLHttpRequestBodyInit,
  options: TransferOptions,
): Promise<XMLHttpRequest> {
  return new Promise((resolve, reject) => {
    if (options.signal?.aborted === true) {
      reject(abortError());
      return;
    }
    const xhr = new XMLHttpRequest();
    const onAbort = () => {
      xhr.abort();
    };
    const finish = () => {
      options.signal?.removeEventListener("abort", onAbort);
    };
    xhr.open(method, url);
    xhr.upload.onprogress = (event) => {
      options.onProgress?.(event.loaded);
    };
    xhr.onload = () => {
      finish();
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr);
      } else {
        reject(new StorageError(xhr.status));
      }
    };
    xhr.onerror = () => {
      finish();
      reject(new StorageError(undefined));
    };
    xhr.ontimeout = xhr.onerror;
    xhr.onabort = () => {
      finish();
      reject(abortError());
    };
    options.signal?.addEventListener("abort", onAbort);
    xhr.send(body);
  });
}

function wait(ms: number, signal: AbortSignal | undefined): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function abortError(): DOMException {
  return new DOMException("upload aborted", "AbortError");
}
