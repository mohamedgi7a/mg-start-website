import { escapeHtml } from "../lib/html";
import { renderProjectCard } from "../lib/projectCards";
import { getSupabaseClient } from "../lib/supabase";
import type { Project } from "../types/supabase";

const homeProjectsList = document.querySelector<HTMLElement>("#homeProjectsList");

function renderState(message: string, className: "loading" | "empty" | "error"): void {
  if (!homeProjectsList) return;
  homeProjectsList.innerHTML = `<div class="cms-state cms-state-${className}">${escapeHtml(message)}</div>`;
}

async function loadHomeProjects(): Promise<void> {
  if (!homeProjectsList) return;
  renderState("جاري تحميل المشاريع...", "loading");

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(3);

    if (error) throw error;

    if (!data || data.length === 0) {
      renderState("لا توجد مشاريع منشورة حالياً", "empty");
      return;
    }

    homeProjectsList.innerHTML = (data as Project[]).map(renderProjectCard).join("");
    requestAnimationFrame(() => {
      homeProjectsList.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
    });
  } catch (error) {
    console.error("Failed to load homepage projects", error);
    renderState("حدث خطأ أثناء تحميل المشاريع", "error");
  }
}

void loadHomeProjects();
