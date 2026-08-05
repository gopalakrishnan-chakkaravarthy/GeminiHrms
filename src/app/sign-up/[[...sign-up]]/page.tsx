import { SignUp } from "@clerk/nextjs";
import LoginPage from "@/app/login/page";
import { AUTH_PROVIDER } from "@/lib/auth";

export default function Page() {
  if (AUTH_PROVIDER !== "clerk") {
    return <LoginPage />;
  }

  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <SignUp />
    </div>
  );
}
