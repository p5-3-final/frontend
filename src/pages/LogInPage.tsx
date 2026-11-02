import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { LogInForm, readDevLogin, readSignedUpEmail, safeRedirect } from "../features/auth";
import { Alert } from "../shared/ui/Alert";
import { AuthPageShell } from "./AuthPageShell";

export function LogInPage() {
  const signedUpEmail = readSignedUpEmail(useLocation().state);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  return (
    <AuthPageShell
      title="로그인"
      footer={
        <>
          처음이신가요?{" "}
          <Link to="/signup" className="font-semibold text-accent hover:underline">
            회원가입
          </Link>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {signedUpEmail !== undefined && (
          <Alert tone="success">가입이 완료되었습니다. 로그인해 주세요.</Alert>
        )}
        <LogInForm
          // 가입 직후에는 방금 가입한 계정으로 로그인하므로 개발용 계정보다 우선한다.
          defaultValues={signedUpEmail === undefined ? readDevLogin() : { email: signedUpEmail }}
          onLoggedIn={() => {
            void navigate(safeRedirect(searchParams.get("redirect")), { replace: true });
          }}
        />
      </div>
    </AuthPageShell>
  );
}
