import LoginPage from "@/features/login/LoginPage";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const Login = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
  const supabase = await createClient();
  const params = await searchParams;

  // Use getUser() instead of getSession()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if user is admin before redirecting
    const { data: profile } = await supabase
      .from("profile")
      .select("type")
      .eq("id", user.id)
      .single();

    if (profile && profile.type === "admin") {
      redirect("/dashboard");
    }
  }

  // Show timeout message if logged out due to inactivity
  const errorMessages: Record<string, string> = {
    not_admin: "Access denied. Admin privileges required.",
    timeout: "You were logged out after 30 minutes of inactivity.",
    session_expired: "Your session has expired. Please log in again.",
    unauthorized: "Please log in to continue.",
  };

  const error = params?.error;
  const errorMessage = error ? errorMessages[error] : undefined;

  return <LoginPage error={errorMessage} />;
};

export default Login;