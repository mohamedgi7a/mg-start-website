import { getSupabaseClient } from "../lib/supabase";
import { bindLogout, requireAdmin } from "./auth";

async function countRows(table: "offers" | "projects", publishedOnly = false): Promise<number> {
  const supabase = getSupabaseClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (publishedOnly) {
    query = query.eq("is_published", true);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

async function loadDashboard(): Promise<void> {
  const isAdmin = await requireAdmin();
  bindLogout();
  if (!isAdmin) return;

  try {
    const [offersTotal, offersPublished, projectsTotal, projectsPublished] = await Promise.all([
      countRows("offers"),
      countRows("offers", true),
      countRows("projects"),
      countRows("projects", true)
    ]);

    document.querySelector("[data-count='offers-total']")!.textContent = String(offersTotal);
    document.querySelector("[data-count='offers-published']")!.textContent = String(offersPublished);
    document.querySelector("[data-count='projects-total']")!.textContent = String(projectsTotal);
    document.querySelector("[data-count='projects-published']")!.textContent = String(projectsPublished);
  } catch (error) {
    console.error("Dashboard counts failed", error);
    const status = document.querySelector<HTMLElement>("[data-admin-status]");
    if (status) {
      status.textContent = "حدث خطأ أثناء تحميل إحصائيات لوحة التحكم";
      status.classList.add("admin-message-error");
    }
  }
}

void loadDashboard();
