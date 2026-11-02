import { z } from "zod";

// 가입 화면이 로그인 화면으로 넘기는 라우터 state(SPEC-002 R-1). 주소창으로도 들어올 수 있으니 검증해서 읽는다.
const signedUpStateSchema = z.object({ signedUpEmail: z.string() });

export interface SignedUpState {
  signedUpEmail: string;
}

export function toSignedUpState(email: string): SignedUpState {
  return { signedUpEmail: email };
}

/** 가입 직후 넘어온 state면 가입한 이메일을, 아니면 undefined를 돌려준다. */
export function readSignedUpEmail(state: unknown): string | undefined {
  const parsed = signedUpStateSchema.safeParse(state);
  return parsed.success ? parsed.data.signedUpEmail : undefined;
}
