# syntax=docker/dockerfile:1
# frontend 이미지. Vite로 빌드한 정적 파일을 nginx로 서빙한다.
#   docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t vlm/frontend .
# 로컬 compose(docs 레포 local/)와 배포 workflow가 같은 파일을 쓴다.

FROM node:22.23.4-alpine@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS build
# VITE_ 변수는 빌드할 때 번들에 들어가므로 실행 시점이 아니라 빌드 인자로 받는다.
ARG VITE_API_BASE_URL=http://localhost:8080
# Vite 빌드 모드. 로컬 compose는 compose를 넘겨 .env.compose(로그인 칸에 채울 로컬 샘플 계정)를 읽게 한다.
ARG BUILD_MODE=production
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /workspace
# package.json의 packageManager에 적힌 pnpm 버전을 쓴다.
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
# 의존성 목록만 먼저 복사해서, 코드만 바뀌면 설치 계층은 캐시를 쓴다.
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build --mode "${BUILD_MODE}"

FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
# Kubernetes runAsNonRoot가 확인할 수 있도록 숫자 UID로 실행한다(베이스 이미지의 nginx 사용자).
USER 101:101
EXPOSE 8080
