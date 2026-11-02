import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import { useLogIn } from "../api/useLogIn";
import { logInSchema, type LogInValues } from "../model/schemas";

export interface LogInFormProps {
  /** 칸의 처음 값. 가입 직후 가입한 이메일(SPEC-002 R-1)이나 개발용 샘플 계정(#14)을 채운다. */
  defaultValues?: Partial<LogInValues> | undefined;
  /** 로그인에 성공해 세션이 시작된 뒤 부른다. */
  onLoggedIn: () => void;
}

export function LogInForm({ defaultValues, onLoggedIn }: LogInFormProps) {
  const logIn = useLogIn();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LogInValues>({
    resolver: zodResolver(logInSchema),
    defaultValues: { email: "", password: "", ...defaultValues },
  });

  const handleValid = (values: LogInValues) => {
    logIn.mutate(values, { onSuccess: onLoggedIn });
  };

  // SPEC-002 R-5, R-6: 실패 이유는 칸에 붙이지 않고 폼 위에 한 번만 알린다.
  const failure =
    logIn.error === null
      ? undefined
      : messageForCode(logIn.error instanceof ApiError ? logIn.error.code : undefined);

  return (
    <form
      aria-label="로그인"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        void handleSubmit(handleValid)(event);
      }}
    >
      {failure !== undefined && <Alert>{failure}</Alert>}
      <TextField
        label="이메일"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={logIn.isPending}>
        로그인
      </Button>
    </form>
  );
}
