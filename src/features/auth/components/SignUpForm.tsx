import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "../../../shared/api/problem";
import { messageForCode } from "../../../shared/lib/messages";
import { Alert } from "../../../shared/ui/Alert";
import { Button } from "../../../shared/ui/Button";
import { TextField } from "../../../shared/ui/TextField";
import { useSignUp } from "../api/useSignUp";
import { signUpSchema, type SignUpValues } from "../model/schemas";

export interface SignUpFormProps {
  /** 가입에 성공하면 가입한 이메일로 부른다. */
  onSignedUp: (email: string) => void;
}

export function SignUpForm({ onSignedUp }: SignUpFormProps) {
  const signUp = useSignUp();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema) });

  const handleValid = (values: SignUpValues) => {
    setFormError(undefined);
    signUp.mutate(values, {
      onSuccess: (user) => {
        onSignedUp(user.email);
      },
      onError: (error) => {
        const code = error instanceof ApiError ? error.code : undefined;
        // SPEC-002 R-3: 중복 이메일은 어느 칸이 문제인지 알 수 있게 이메일 칸에 붙인다.
        if (code === "AUTH_EMAIL_DUPLICATED") {
          setError("email", { message: messageForCode(code) });
          return;
        }
        setFormError(messageForCode(code));
      },
    });
  };

  return (
    <form
      aria-label="회원가입"
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        void handleSubmit(handleValid)(event);
      }}
    >
      {formError !== undefined && <Alert>{formError}</Alert>}
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField
        label="닉네임"
        autoComplete="nickname"
        error={errors.nickname?.message}
        {...register("nickname")}
      />
      <Button type="submit" disabled={signUp.isPending}>
        가입하기
      </Button>
    </form>
  );
}
