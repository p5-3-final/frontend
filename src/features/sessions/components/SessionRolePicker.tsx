import { useId } from "react";
import { Alert } from "../../../shared/ui/Alert";
import { TextField } from "../../../shared/ui/TextField";
import { useWorkSessions } from "../api/useWorkSessions";
import {
  NEW_SESSION,
  NO_SESSION,
  type SessionRolePickerState,
} from "../hooks/useSessionRolePicker";
import { SESSION_ROLE_LABELS, SESSION_ROLES } from "../model/roles";

// 고르기에는 최근 세션 100개(계약 Size 최대값)를 보인다(plan 4절).
const PICKER_SESSION_COUNT = 100;

export interface SessionRolePickerProps {
  picker: SessionRolePickerState;
}

/**
 * 업로드 화면의 세션·역할 고르기(SPEC-034 R-6, R-7). 세션을 고르면 역할을 필수로 받는다.
 * 상태는 페이지가 만든 {@link SessionRolePickerState}에 있고, 업로드 버튼이 같은 상태로 대상을 정한다.
 */
export function SessionRolePicker({ picker }: SessionRolePickerProps) {
  const selectId = useId();
  const { data } = useWorkSessions(0, PICKER_SESSION_COUNT);
  const sessions = data?.items ?? [];
  const extra = [picker.created].filter(
    (session) => session !== undefined && !sessions.some((item) => item.id === session.id),
  );
  const unknownChoice =
    picker.choice !== NO_SESSION &&
    picker.choice !== NEW_SESSION &&
    ![...sessions, ...extra].some((session) => session?.id === picker.choice);

  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-xl border border-line bg-panel p-3">
      <legend className="px-1 text-sm font-semibold">업로드할 작업 세션</legend>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor={selectId} className="text-sm font-medium text-muted">
            작업 세션
          </label>
          <select
            id={selectId}
            value={picker.choice}
            onChange={(event) => {
              picker.setChoice(event.target.value);
            }}
            className="h-11 max-w-full min-w-48 rounded-lg border border-line bg-surface px-3 text-content outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value={NO_SESSION}>세션 없음</option>
            {unknownChoice && <option value={picker.choice}>고른 세션</option>}
            {[...sessions, ...extra].map(
              (session) =>
                session !== undefined && (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ),
            )}
            <option value={NEW_SESSION}>새 세션 만들기</option>
          </select>
        </div>
        {picker.choice === NEW_SESSION && (
          <TextField
            label="새 세션 이름"
            value={picker.newName}
            maxLength={100}
            onChange={(event) => {
              picker.setNewName(event.target.value);
            }}
          />
        )}
      </div>
      {picker.choice !== NO_SESSION && (
        <div role="radiogroup" aria-label="역할" className="flex flex-wrap gap-2">
          {SESSION_ROLES.map((role) => (
            <label
              key={role}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3 text-sm has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent has-focus-visible:ring-2 has-focus-visible:ring-accent"
            >
              <input
                type="radio"
                name={`${selectId}-role`}
                value={role}
                checked={picker.role === role}
                onChange={() => {
                  picker.setRole(role);
                }}
                className="accent-accent"
              />
              {SESSION_ROLE_LABELS[role]}
            </label>
          ))}
        </div>
      )}
      {picker.error !== undefined && <Alert>{picker.error}</Alert>}
    </fieldset>
  );
}
