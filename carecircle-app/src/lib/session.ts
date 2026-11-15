// Session boundary: auth is an httpOnly / session cookie the backend owns; the frontend's one
// duty is wiping the react-query cache and demo overrides so one account's data never renders for the next.
import { queryClient } from "./queryClient";
import { apiPost } from "./api";

// Call after every successful login/signup.
export function beginSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cc_demo_role");
  }
  queryClient.clear();
}

// Call from every sign-out control; the hard redirect resets all in-memory state.
export async function endSession(redirectTo: string = "/login"): Promise<void> {
  try {
    await apiPost("/auth/logout");
  } finally {
    if (typeof window !== "undefined") {
      localStorage.removeItem("cc_demo_role");
      localStorage.removeItem("cc_circle_id");
    }
    queryClient.clear();
    window.location.assign(redirectTo);
  }
}
