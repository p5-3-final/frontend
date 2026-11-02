import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";

export interface LogInFormProps {
  /** 이메일 칸의 처음 값. 가입 직후 가입한 이메일을 채운다(SPEC-002 R-1). */
  defaultEmail?: string | undefined;
}

export function LogInForm({ defaultEmail }: LogInFormProps) {
  return (
    <form aria-label="로그인" noValidate className="flex flex-col gap-4">
      <TextField label="이메일" type="email" autoComplete="email" defaultValue={defaultEmail} />
      <TextField label="비밀번호" type="password" autoComplete="current-password" />
      <Button type="submit">로그인</Button>
    </form>
  );
}
