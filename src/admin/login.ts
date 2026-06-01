import { getSupabaseClient } from "../lib/supabase";
import { getCurrentAdmin } from "./auth";

const form = document.querySelector<HTMLFormElement>("#adminLoginForm");
const statusNode = document.querySelector<HTMLElement>("[data-login-status]");

function setStatus(message: string, isError = false): void {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.classList.toggle("admin-message-error", isError);
  statusNode.classList.toggle("admin-message-success", !isError);
}

async function redirectIfAlreadyAdmin(): Promise<void> {
  try {
    const { user, isAdmin } = await getCurrentAdmin();
    if (user && isAdmin) {
      window.location.href = "/admin/";
    }
  } catch {
    // Login form remains available if the initial check fails.
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");
  const formData = new FormData(form);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    setStatus("أدخل البريد الإلكتروني وكلمة المرور", true);
    return;
  }

  if (submitButton) submitButton.disabled = true;
  setStatus("جاري تسجيل الدخول...");

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { isAdmin } = await getCurrentAdmin();
    if (!isAdmin) {
      setStatus("ليس لديك صلاحية الوصول إلى لوحة التحكم", true);
      await supabase.auth.signOut();
      return;
    }

    window.location.href = "/admin/";
  } catch (error) {
    console.error("Login failed", error);
    setStatus("تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.", true);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});

void redirectIfAlreadyAdmin();
