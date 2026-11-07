import type { Page, Route } from "@playwright/test";
import {
  OPERATOR_ID,
  defaultReviewItems,
  evaluationRunBody,
  goldenSetBody,
  goldenSetVersionBody,
  pageBody,
  reviewLabelBody,
  stageTrendBody,
  alertReportBody,
  type GoldenSetEntryBody,
  type GoldenSetVersionBody,
  type ReviewItemBody,
} from "../../mocks/quality";

const API = "http://localhost:8080/api/v1";
// 1×1 회색 PNG. 근거 프레임 서명 주소 대신 돌려준다.
const PIXEL = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

function problem(status: number, code: string) {
  return {
    status,
    contentType: "application/problem+json",
    body: JSON.stringify({ type: "about:blank", title: "Error", status, code }),
  };
}

function bodyOf(route: Route): Record<string, unknown> {
  const raw: unknown = route.request().postData() === null ? {} : route.request().postDataJSON();
  return typeof raw === "object" && raw !== null ? Object.fromEntries(Object.entries(raw)) : {};
}

/**
 * E2E용 가짜 quality-service와 운영자 로그인. 맡기·라벨·초안·확정 상태를 기억한다.
 * `useFakeApi(page, { loggedIn: true })` 뒤에 부른다. 나중에 등록한 route가 먼저 적용되므로 내 정보를 OPERATOR로 바꾼다.
 * 실제 quality-service와의 연결은 backend 구현 뒤 로컬 compose 시연으로 확인한다(plan 6절).
 */
export async function useFakeQuality(page: Page) {
  let items: ReviewItemBody[] = defaultReviewItems();
  let set = goldenSetBody({ draftEntryCount: 0, latestVersion: 3 });
  let entries: GoldenSetEntryBody[] = [];
  let versions: GoldenSetVersionBody[] = [goldenSetVersionBody()];
  const runs = [evaluationRunBody()];
  let sequence = 0;

  await page.route(`${API}/auth/me`, async (route) => {
    await route.fulfill({
      json: {
        id: OPERATOR_ID,
        email: "operator@example.com",
        nickname: "운영자",
        roles: ["USER", "OPERATOR"],
      },
    });
  });
  await page.route("http://localhost:8333/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "image/png", body: PIXEL });
  });

  await page.route(`${API}/quality/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1/quality", "");
    const method = request.method();
    const parts = path.split("/").filter((part) => part !== "");

    if (parts[0] === "review-items") {
      const item = items.find((entry) => entry.itemId === parts[1]);
      const replace = (next: ReviewItemBody) => {
        items = items.map((entry) => (entry.itemId === next.itemId ? next : entry));
        return next;
      };
      if (parts.length === 1) {
        const status = url.searchParams.get("status");
        const size = Number(url.searchParams.get("size") ?? "20");
        await route.fulfill({
          json: pageBody(
            items.filter((entry) => status === null || entry.status === status),
            0,
            size,
          ),
        });
        return;
      }
      if (item === undefined) {
        await route.fulfill(problem(404, "QUALITY_REVIEW_NOT_FOUND"));
        return;
      }
      if (parts[2] === "assignment" && method === "POST") {
        await route.fulfill(
          item.status === "UNASSIGNED"
            ? {
                json: replace({
                  ...item,
                  status: "ASSIGNED",
                  assigneeId: OPERATOR_ID,
                  assignedAt: new Date().toISOString(),
                }),
              }
            : problem(409, "QUALITY_REVIEW_ALREADY_ASSIGNED"),
        );
        return;
      }
      if (parts[2] === "label") {
        const input = bodyOf(route);
        const label = reviewLabelBody({
          verdict:
            input.verdict === "correct" || input.verdict === "uncertain"
              ? input.verdict
              : "incorrect",
        });
        await route.fulfill({
          json: replace({ ...item, status: "LABELED", label, labeledAt: new Date().toISOString() }),
        });
        return;
      }
      await route.fulfill({ json: item });
      return;
    }

    if (parts[0] === "golden-sets") {
      if (parts.length === 1) {
        await route.fulfill({ json: pageBody([set]) });
        return;
      }
      if (parts[2] === "entries" && method === "POST") {
        const reviewItemId = String(bodyOf(route).reviewItemId);
        const item = items.find((entry) => entry.itemId === reviewItemId);
        if (item?.label == null) {
          await route.fulfill(problem(409, "QUALITY_REVIEW_NOT_LABELED"));
          return;
        }
        sequence++;
        const entry: GoldenSetEntryBody = {
          entryId: `0192fb10-0000-7000-8000-${String(sequence).padStart(12, "0")}`,
          setId: set.setId,
          reviewItemId,
          sourceId: item.sourceId,
          eventId: item.eventId,
          label: item.label,
          addedAt: new Date().toISOString(),
        };
        entries = [...entries, entry];
        set = { ...set, draftEntryCount: entries.length };
        await route.fulfill({ status: 201, json: entry });
        return;
      }
      if (parts[2] === "entries") {
        await route.fulfill({ json: pageBody(entries) });
        return;
      }
      if (parts[2] === "versions" && method === "POST") {
        const version = (set.latestVersion ?? 0) + 1;
        const frozen = goldenSetVersionBody({
          version,
          entryCount: entries.length,
          manifestKey: `golden/${set.setId}/v${String(version)}/manifest.json`,
          frozenAt: new Date().toISOString(),
        });
        versions = [frozen, ...versions];
        entries = [];
        set = { ...set, draftEntryCount: 0, latestVersion: version };
        await route.fulfill({ status: 201, json: frozen });
        return;
      }
      if (parts[2] === "versions") {
        await route.fulfill({ json: pageBody(versions) });
        return;
      }
      await route.fulfill({ json: set });
      return;
    }

    if (parts[0] === "evaluation-runs") {
      await route.fulfill({ json: parts.length === 1 ? pageBody(runs) : runs[0] });
      return;
    }
    if (parts[0] === "stage-reports" && parts[1] === "trends") {
      await route.fulfill({
        json: stageTrendBody({
          from: url.searchParams.get("from") ?? "2026-11-01",
          to: url.searchParams.get("to") ?? "2026-11-06",
        }),
      });
      return;
    }
    if (parts[0] === "alert-reports") {
      await route.fulfill({ json: alertReportBody() });
      return;
    }
    await route.fulfill(problem(404, "QUALITY_NOT_FOUND"));
  });
}
