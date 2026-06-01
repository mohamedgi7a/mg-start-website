import { getSupabaseClient } from "../lib/supabase";

export async function getCurrentAdmin() {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const user = sessionData.session?.user;
  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data, error } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();

  if (error) {
    throw error;
  }

  return { user, isAdmin: Boolean(data) };
}

export async function requireAdmin(): Promise<boolean> {
  const status = document.querySelector<HTMLElement>("[data-admin-status]");

  try {
    const { user, isAdmin } = await getCurrentAdmin();

    if (!user) {
      window.location.href = "/admin/login/";
      return false;
    }

    if (!isAdmin) {
      if (status) {
        status.textContent = "ليس لديك صلاحية الوصول إلى لوحة التحكم";
        status.classList.add("admin-message-error");
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error("Admin guard failed", error);
    if (status) {
      status.textContent = "حدث خطأ أثناء التحقق من الصلاحيات";
      status.classList.add("admin-message-error");
    }
    return false;
  }
}

export function bindLogout(): void {
  document.querySelectorAll<HTMLElement>("[data-admin-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      await getSupabaseClient().auth.signOut();
      window.location.href = "/admin/login/";
    });
  });
}
