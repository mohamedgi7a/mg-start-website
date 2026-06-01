import { escapeHtml } from "../lib/html";
import { renderProjectCard } from "../lib/projectCards";
import { getSupabaseClient } from "../lib/supabase";
import type { Project } from "../types/supabase";

const projectsList = document.querySelector<HTMLElement>("#projectsList");

function renderState(message: string, className: "loading" | "empty" | "error"): void {
  if (!projectsList) return;
  projectsList.innerHTML = `<div class="cms-state cms-state-${className}">${escapeHtml(message)}</div>`;
}

async function loadProjects(): Promise<void> {
  if (!projectsList) return;
  renderState("جاري تحميل المشاريع...", "loading");

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderState("لا توجد مشاريع منشورة حالياً", "empty");
      return;
    }

    projectsList.innerHTML = (data as Project[]).map(renderProjectCard).join("");
    requestAnimationFrame(() => {
      projectsList.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
    });
  } catch (error) {
    console.error("Failed to load projects", error);
    renderState("حدث خطأ أثناء تحميل المشاريع", "error");
  }
}

void loadProjects();
