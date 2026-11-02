import { Link, useNavigate } from "react-router";
import { SignUpForm, toSignedUpState } from "../features/auth";
import { AuthPageShell } from "./AuthPageShell";

export function SignUpPage() {
  const navigate = useNavigate();
  return (
    <AuthPageShell
      title="회원가입"
      footer={
        <>
          이미 계정이 있나요?{" "}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            로그인
          </Link>
        </>
      }
    >
      <SignUpForm
        onSignedUp={(email) => {
          void navigate("/login", { state: toSignedUpState(email) });
        }}
      />
    </AuthPageShell>
  );
}
