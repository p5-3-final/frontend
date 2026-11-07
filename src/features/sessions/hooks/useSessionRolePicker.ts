import { useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import type { UploadTarget } from "../../upload";
import { useCreateWorkSession } from "../api/useCreateWorkSession";
import type { SessionRole } from "../model/roles";
import { UPLOAD_SESSION_PARAM } from "../model/paths";
import { newSessionNameSchema } from "../model/schemas";

// URL의 세션 ID는 사용자가 바꿀 수 있는 입력이라 UUID 형식만 처음 값으로 쓴다(R-8).
const sessionIdSchema = z.guid();

/** 세션 고르기의 값. 세션 ID 대신 쓰는 두 값은 UUID와 겹치지 않는다. */
export const NO_SESSION = "";
export const NEW_SESSION = "new";

export interface CreatedSession {
  id: string;
  name: string;
}

export interface SessionRolePickerState {
  choice: string;
  newName: string;
  role: SessionRole | undefined;
  error: string | undefined;
  /** 이 고르기로 만든 세션. 목록을 다시 받기 전에도 고르기에 보인다(R-7). */
  created: CreatedSession | undefined;
  setChoice: (choice: string) => void;
  setNewName: (name: string) => void;
  setRole: (role: SessionRole) => void;
  /** 업로드 버튼이 파일을 고른 뒤 부른다. undefined면 세션 없이, null이면 올리지 않는다. */
  resolveTarget: () => Promise<UploadTarget | null | undefined>;
}

/**
 * 업로드 화면의 세션·역할 고르기 상태(SPEC-034 R-6, R-7). 페이지가 만들어 고르기 화면과 업로드 버튼에 함께 넘긴다.
 * 주소에 `?sessionId=`가 있으면 그 세션이 골라진 채로 시작한다(R-8, 세션 상세의 "이 세션에 영상 올리기").
 */
export function useSessionRolePicker(): SessionRolePickerState {
  const [searchParams] = useSearchParams();
  const [choice, setChoiceState] = useState(() => {
    const initial = sessionIdSchema.safeParse(searchParams.get(UPLOAD_SESSION_PARAM));
    return initial.success ? initial.data : NO_SESSION;
  });
  const [newName, setNewName] = useState("");
  const [role, setRoleState] = useState<SessionRole>();
  const [error, setError] = useState<string>();
  const [created, setCreated] = useState<CreatedSession>();
  const create = useCreateWorkSession();
  // 같은 이름으로 세션을 만드는 중에 파일을 또 고르면 새로 만들지 않고 그 결과를 기다린다(R-7).
  const creatingRef = useRef<{ name: string; promise: Promise<CreatedSession> }>(undefined);

  const createSession = (name: string): Promise<CreatedSession> => {
    if (creatingRef.current?.name === name) {
      return creatingRef.current.promise;
    }
    const promise = create.mutateAsync({ name }).then((session) => {
      const made = { id: session.id, name: session.name };
      // 다음 파일은 만든 세션으로 올라가게 고르기 값을 그 세션으로 바꾼다.
      setCreated(made);
      setChoiceState(made.id);
      setNewName("");
      return made;
    });
    creatingRef.current = { name, promise };
    promise.catch(() => {
      creatingRef.current = undefined;
    });
    return promise;
  };

  const reject = (message: string | undefined) => {
    setError(message);
    return null;
  };

  const resolveTarget = async (): Promise<UploadTarget | null | undefined> => {
    setError(undefined);
    if (choice === NO_SESSION) {
      return undefined;
    }
    const name = newSessionNameSchema.safeParse(newName);
    if (choice === NEW_SESSION && !name.success) {
      return reject(name.error.issues[0]?.message);
    }
    if (role === undefined) {
      return reject("역할을 골라 주세요.");
    }
    if (choice !== NEW_SESSION) {
      return { sessionId: choice, role };
    }
    try {
      // R-7: 첫 파일의 업로드 자리를 요청하기 전에 세션을 만든다.
      const session = await createSession(name.data ?? newName.trim());
      return { sessionId: session.id, role };
    } catch (failure: unknown) {
      return reject(messageForCode(failure instanceof ApiError ? failure.code : undefined));
    }
  };

  return {
    choice,
    newName,
    role,
    error,
    created,
    setChoice: (next) => {
      setChoiceState(next);
      setError(undefined);
    },
    setNewName,
    setRole: (next) => {
      setRoleState(next);
      setError(undefined);
    },
    resolveTarget,
  };
}
