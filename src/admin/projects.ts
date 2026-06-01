import { bindLogout, requireAdmin } from "./auth";
import { getSupabaseClient } from "../lib/supabase";
import { getPublicImageUrl } from "../lib/storage";
import { uploadImage } from "../lib/images";
import { checkboxValue, escapeHtml, formValue, numberValue } from "../lib/html";
import type { Project } from "../types/supabase";

const supabase = getSupabaseClient();
const table = document.querySelector<HTMLTableSectionElement>("#projectsTable");
const editor = document.querySelector<HTMLElement>("#projectEditor");
const form = document.querySelector<HTMLFormElement>("#projectForm");
const statusNode = document.querySelector<HTMLElement>("[data-admin-status]");
const previewNode = document.querySelector<HTMLElement>("[data-image-preview]");
const titleNode = document.querySelector<HTMLElement>("[data-editor-title]");
let projects: Project[] = [];
let saving = false;

function setStatus(message: string, type: "success" | "error" | "info" = "info") {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.className = `admin-message admin-message-${type}`;
}

function setInput(name: string, value: string | number | null | undefined) {
  const input = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  if (input) input.value = value == null ? "" : String(value);
}

function setCheck(name: string, value: boolean) {
  const input = form?.elements.namedItem(name) as HTMLInputElement | null;
  if (input) input.checked = value;
}

function updatePreview(bucket: string | null, path: string | null, alt = "صورة المشروع") {
  if (!previewNode) return;
  const url = getPublicImageUrl(bucket, path);
  previewNode.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />` : "<span>لا توجد صورة حالياً</span>";
}

function resetForm(project?: Project) {
  if (!form || !editor) return;
  form.reset();
  if (titleNode) titleNode.textContent = project ? "تعديل مشروع" : "إضافة مشروع";
  setInput("id", project?.id || "");
  setInput("image_path", project?.image_path || "");
  setInput("slug", project?.slug || "");
  setInput("title_ar", project?.title_ar || "");
  setInput("title_en", project?.title_en || "");
  setInput("client_name_ar", project?.client_name_ar || "");
  setInput("client_name_en", project?.client_name_en || "");
  setInput("type_ar", project?.type_ar || "");
  setInput("type_en", project?.type_en || "");
  setInput("description_ar", project?.description_ar || "");
  setInput("description_en", project?.description_en || "");
  setInput("external_url", project?.external_url || "");
  setInput("cta_label_ar", project?.cta_label_ar || "عرض المشروع");
  setInput("cta_label_en", project?.cta_label_en || "View project");
  setInput("image_alt_ar", project?.image_alt_ar || "");
  setInput("image_alt_en", project?.image_alt_en || "");
  setInput("sort_order", project?.sort_order ?? 0);
  setCheck("is_featured", Boolean(project?.is_featured));
  setCheck("is_published", project?.is_published ?? true);
  updatePreview(project?.image_bucket || "project-images", project?.image_path || null, project?.image_alt_ar || "صورة المشروع");
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTable() {
  if (!table) return;
  if (!projects.length) {
    table.innerHTML = `<tr><td colspan="5">لا توجد مشاريع بعد</td></tr>`;
    return;
  }
  table.innerHTML = projects
    .map((project) => `
      <tr>
        <td><strong>${escapeHtml(project.title_ar)}</strong><span>${escapeHtml(project.client_name_ar || project.slug)}${project.is_featured ? " · مميز" : ""}</span></td>
        <td>${escapeHtml(project.type_ar)}</td>
        <td><span class="admin-pill ${project.is_published ? "is-live" : ""}">${project.is_published ? "منشور" : "مخفي"}</span></td>
        <td>${project.sort_order}</td>
        <td>
          <div class="admin-row-actions">
            <button type="button" data-edit="${project.id}">تعديل</button>
            <button type="button" data-toggle-publish="${project.id}">${project.is_published ? "إخفاء" : "نشر"}</button>
            <button type="button" data-delete="${project.id}">حذف</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

async function loadProjects() {
  if (!table) return;
  table.innerHTML = `<tr><td colspan="5">جاري التحميل...</td></tr>`;
  const { data, error } = await supabase.from("projects").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) {
    table.innerHTML = `<tr><td colspan="5">حدث خطأ أثناء تحميل المشاريع</td></tr>`;
    setStatus(error.message, "error");
    return;
  }
  projects = (data || []) as Project[];
  renderTable();
}

async function saveProject(event: SubmitEvent) {
  event.preventDefault();
  if (!form || saving) return;
  const slug = formValue(form, "slug");
  const titleAr = formValue(form, "title_ar");
  const typeAr = formValue(form, "type_ar");
  if (!slug || !titleAr || !typeAr) {
    setStatus("اكتب slug والعنوان العربي والنوع العربي قبل الحفظ.", "error");
    return;
  }
  saving = true;
  setStatus("جاري الحفظ...", "info");
  const submitButton = form.querySelector<HTMLButtonElement>("button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  try {
    const imageInput = form.elements.namedItem("image") as HTMLInputElement | null;
    const imageFile = imageInput?.files?.[0];
    let imagePath = formValue(form, "image_path") || null;
    if (imageFile) imagePath = await uploadImage("project-images", imageFile);
    const payload = {
      slug,
      title_ar: titleAr,
      title_en: formValue(form, "title_en") || null,
      client_name_ar: formValue(form, "client_name_ar") || null,
      client_name_en: formValue(form, "client_name_en") || null,
      type_ar: typeAr,
      type_en: formValue(form, "type_en") || null,
      description_ar: formValue(form, "description_ar") || null,
      description_en: formValue(form, "description_en") || null,
      image_bucket: imagePath ? "project-images" : null,
      image_path: imagePath,
      image_alt_ar: formValue(form, "image_alt_ar") || null,
      image_alt_en: formValue(form, "image_alt_en") || null,
      external_url: formValue(form, "external_url") || null,
      cta_label_ar: formValue(form, "cta_label_ar") || "عرض المشروع",
      cta_label_en: formValue(form, "cta_label_en") || "View project",
      is_featured: checkboxValue(form, "is_featured"),
      is_published: checkboxValue(form, "is_published"),
      sort_order: numberValue(form, "sort_order")
    };
    const id = formValue(form, "id");
    const result = id ? await supabase.from("projects").update(payload).eq("id", id) : await supabase.from("projects").insert(payload);
    if (result.error) throw result.error;
    setStatus("تم حفظ المشروع بنجاح.", "success");
    if (editor) editor.hidden = true;
    await loadProjects();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ المشروع", "error");
  } finally {
    saving = false;
    if (submitButton) submitButton.disabled = false;
  }
}

async function handleTableClick(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const editId = target.dataset.edit;
  const deleteId = target.dataset.delete;
  const publishId = target.dataset.togglePublish;
  if (editId) {
    const project = projects.find((item) => item.id === editId);
    if (project) resetForm(project);
  }
  if (publishId) {
    const project = projects.find((item) => item.id === publishId);
    if (!project) return;
    const { error } = await supabase.from("projects").update({ is_published: !project.is_published }).eq("id", publishId);
    if (error) setStatus(error.message, "error");
    else {
      setStatus("تم تحديث حالة النشر.", "success");
      await loadProjects();
    }
  }
  if (deleteId && window.confirm("هل تريد حذف هذا المشروع؟")) {
    const { error } = await supabase.from("projects").delete().eq("id", deleteId);
    if (error) setStatus(error.message, "error");
    else {
      setStatus("تم حذف المشروع.", "success");
      await loadProjects();
    }
  }
}

async function init() {
  const isAdmin = await requireAdmin();
  bindLogout();
  if (!isAdmin) return;
  document.querySelector("[data-new-project]")?.addEventListener("click", () => resetForm());
  document.querySelectorAll("[data-close-editor]").forEach((button) => button.addEventListener("click", () => {
    if (editor) editor.hidden = true;
  }));
  table?.addEventListener("click", handleTableClick);
  form?.addEventListener("submit", saveProject);
  await loadProjects();
}

init().catch((error) => setStatus(error instanceof Error ? error.message : "حدث خطأ في لوحة المشاريع", "error"));
