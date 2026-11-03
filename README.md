# frontend

"AI 안전 관제" 웹 화면(React SPA). 구조와 규칙은 [AGENTS.md](AGENTS.md)에 있다.

## 준비물

- Node.js 22(`.nvmrc`), pnpm(`package.json`의 `packageManager` 버전을 pnpm이 자동으로 맞춘다)
- 실제 API로 확인하려면 docs 레포 `local/`의 compose로 backend를 띄운다.

## 실행

```bash
pnpm install
cp .env.example .env.local          # VITE_API_BASE_URL=http://localhost:8080 (api-gateway)
pnpm dev                            # http://localhost:5173
```

backend와 함께 확인하려면 루트(`project/`)에서 compose를 먼저 띄운다. 게이트웨이의 CORS 허용 목록 기본값은 `http://localhost:5173`(개발 서버)과 `http://localhost:3000`(frontend 컨테이너)이다.

```bash
cp local/.env.example local/.env
docker compose -f local/docker-compose.yml up -d --build
```

compose는 frontend도 이미지로 빌드해 `http://localhost:3000`에 띄운다. 이 빌드는 모드 `compose`로 `.env.compose`를 읽어 로그인 칸에 로컬 샘플 관리자 계정을 미리 채운다(`pnpm dev`와 배포 빌드는 빈 칸). 코드를 고치면서 볼 때는 `pnpm dev`를, 배포와 같은 빌드 결과를 볼 때는 컨테이너를 쓴다.

## Docker 이미지

`Dockerfile`이 Vite로 빌드한 정적 파일을 nginx(non-root, 포트 8080)로 서빙한다. `VITE_API_BASE_URL`은 번들에 들어가므로 빌드 인자로 준다.

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t vlm/frontend .
# 로컬 compose처럼 로그인 칸에 샘플 계정을 채우려면 --build-arg BUILD_MODE=compose
docker run --rm -p 3000:8080 vlm/frontend
```

- 재발급 토큰은 `Secure` 쿠키라서, Safari는 `http://localhost`에서 저장하지 않을 수 있다. 로컬 확인은 Chrome 계열 브라우저로 한다(ADR-0004).

## 명령어

```bash
pnpm typecheck && pnpm lint && pnpm format:check && pnpm test   # 커밋 전 확인
pnpm test:e2e                       # Playwright(데스크톱·360px 모바일). 처음 한 번 pnpm exec playwright install chromium
pnpm build
pnpm gen:api                        # docs 레포 계약 → src/api/generated (CONTRACTS_DIR로 경로 변경 가능)
```

## 화면

| 경로 | 화면 |
| --- | --- |
| `/login`, `/signup` | 로그인, 회원가입 |
| `/analysis` | 영상 분석(로그인 후 첫 화면): 영상 업로드와 내 영상 목록·삭제 |
| `/analysis/videos/:videoId` | 영상 상세: 파일 정보, 원본 재생·내려받기, 삭제 |
| `/events`, `/search`, `/history`, `/settings` | 준비 중 |

## 영상 업로드

영상 분석 화면의 "영상 업로드" 버튼이나 끌어다 놓기로 mp4·mov·mkv·avi 파일(5GB까지)을 여러 개 고르면 하나씩 순서대로 올라간다. 파일 바이트는 api-gateway를 거치지 않고 media-service가 준 서명 주소로 저장소에 바로 간다(100MB 이하 POST 폼, 넘으면 조각 PUT).

- 로컬: compose의 SeaweedFS(`http://localhost:8333`)가 기본 설정으로 브라우저 업로드(CORS, `ETag` 노출)를 허용한다. 따로 설정할 것이 없다.
- 운영: S3 버킷 CORS에 frontend 주소, POST·PUT, `ETag` 노출이 있어야 한다(infra 레포).
- 업로드 중에 탭을 닫거나 새로고침하면 대기열이 사라진다(이어 올리기 없음). 끝나지 않은 영상은 24시간 뒤 만료된다.

## 원본 재생

목록에서 영상 이름을 누르면 상세 화면에서 원본을 재생한다. 브라우저가 media-service가 준 서명 주소(1시간 유효)로 저장소에서 바로 읽는다. 재생 중 주소가 만료되면 새 주소를 한 번 받아 보던 위치부터 이어서 재생한다.

- 브라우저가 재생하지 못하는 형식·코덱(mkv·avi의 일부 코덱, Chromium의 H.264 등)은 안내와 "원본 내려받기" 링크를 보여 준다.
- Playwright Chromium은 H.264 mp4를 재생하지 못해서 E2E는 재생 불가 안내로 확인한다. 실제 재생은 로컬 compose와 데스크톱 Chrome으로 확인한다.

## 문서

- 기능 spec, ADR, 계약: docs 레포 `docs/specs/`, `docs/adr/`, `docs/contracts/`
- 구현 계획: [specs/](specs/)
