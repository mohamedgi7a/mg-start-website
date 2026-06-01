import { bindLogout, requireAdmin } from "./auth";
import { getSupabaseClient } from "../lib/supabase";
import { getPublicImageUrl } from "../lib/storage";
import { uploadImage } from "../lib/images";
import { checkboxValue, escapeHtml, formValue, nullableNumberValue, numberValue } from "../lib/html";
import type { Offer } from "../types/supabase";

const supabase = getSupabaseClient();
const offersTable = () => supabase.from("offers") as any;
const table = document.querySelector<HTMLTableSectionElement>("#offersTable");
const editor = document.querySelector<HTMLElement>("#offerEditor");
const form = document.querySelector<HTMLFormElement>("#offerForm");
const statusNode = document.querySelector<HTMLElement>("[data-admin-status]");
const previewNode = document.querySelector<HTMLElement>("[data-image-preview]");
const titleNode = document.querySelector<HTMLElement>("[data-editor-title]");
let offers: Offer[] = [];
let saving = false;

function setStatus(message: string, type: "success" | "error" | "info" = "info") {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.className = `admin-message admin-message-${type}`;
}

function getFeatureValues(name: "features_ar" | "features_en"): string[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>(`[data-feature-list="${name}"] input`))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function addFeatureRow(name: "features_ar" | "features_en", value = "") {
  const list = document.querySelector<HTMLElement>(`[data-feature-list="${name}"]`);
  if (!list) return;
  const row = document.createElement("div");
  row.className = "feature-row";
  row.innerHTML = `
    <input type="text" value="${escapeHtml(value)}" placeholder="ميزة" />
    <button type="button" aria-label="حذف الميزة">حذف</button>
  `;
  row.querySelector("button")?.addEventListener("click", () => row.remove());
  list.append(row);
}

function setFeatures(name: "features_ar" | "features_en", values: string[]) {
  const list = document.querySelector<HTMLElement>(`[data-feature-list="${name}"]`);
  if (!list) return;
  list.innerHTML = "";
  (values.length ? values : [""]).forEach((value) => addFeatureRow(name, value));
}

function setInput(name: string, value: string | number | null | undefined) {
  const input = form?.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | null;
  if (input) input.value = value == null ? "" : String(value);
}

function setCheck(name: string, value: boolean) {
  const input = form?.elements.namedItem(name) as HTMLInputElement | null;
  if (input) input.checked = value;
}

function updatePreview(bucket: string | null, path: string | null, alt = "صورة العرض") {
  if (!previewNode) return;
  const url = getPublicImageUrl(bucket, path);
  previewNode.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" />` : "<span>لا توجد صورة حالياً</span>";
}

function resetForm(offer?: Offer) {
  if (!form || !editor) return;
  form.reset();
  if (titleNode) titleNode.textContent = offer ? "تعديل عرض" : "إضافة عرض";
  setInput("id", offer?.id || "");
  setInput("image_path", offer?.image_path || "");
  setInput("slug", offer?.slug || "");
  setInput("name_ar", offer?.name_ar || "");
  setInput("name_en", offer?.name_en || "");
  setInput("title_ar", offer?.title_ar || "");
  setInput("title_en", offer?.title_en || "");
  setInput("description_ar", offer?.description_ar || "");
  setInput("description_en", offer?.description_en || "");
  setInput("price", offer?.price ?? "");
  setInput("old_price", offer?.old_price ?? "");
  setInput("currency", offer?.currency || "SAR");
  setInput("badge_ar", offer?.badge_ar || "");
  setInput("badge_en", offer?.badge_en || "");
  setInput("whatsapp_text_ar", offer?.whatsapp_text_ar || "");
  setInput("whatsapp_text_en", offer?.whatsapp_text_en || "");
  setInput("cta_label_ar", offer?.cta_label_ar || "اطلب الآن");
  setInput("cta_label_en", offer?.cta_label_en || "Order Now");
  setInput("cta_url", offer?.cta_url || "");
  setInput("image_alt_ar", offer?.image_alt_ar || "");
  setInput("image_alt_en", offer?.image_alt_en || "");
  setInput("sort_order", offer?.sort_order ?? 0);
  setCheck("is_featured", Boolean(offer?.is_featured));
  setCheck("is_published", offer?.is_published ?? true);
  setFeatures("features_ar", offer?.features_ar || []);
  setFeatures("features_en", offer?.features_en || []);
  updatePreview(offer?.image_bucket || "offer-images", offer?.image_path || null, offer?.image_alt_ar || "صورة العرض");
  editor.hidden = false;
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderTable() {
  if (!table) return;
  if (!offers.length) {
    table.innerHTML = `<tr><td colspan="5">لا توجد عروض بعد</td></tr>`;
    return;
  }
  table.innerHTML = offers
    .map((offer) => {
      const price = offer.price == null ? "-" : `${offer.price} ${escapeHtml(offer.currency || "SAR")}`;
      return `
        <tr>
          <td><strong>${escapeHtml(offer.name_ar)}</strong><span>${escapeHtml(offer.slug)}${offer.is_featured ? " · مميز" : ""}</span></td>
          <td>${price}</td>
          <td><span class="admin-pill ${offer.is_published ? "is-live" : ""}">${offer.is_published ? "منشور" : "مخفي"}</span></td>
          <td>${offer.sort_order}</td>
          <td>
            <div class="admin-row-actions">
              <button type="button" data-edit="${offer.id}">تعديل</button>
              <button type="button" data-toggle-publish="${offer.id}">${offer.is_published ? "إخفاء" : "نشر"}</button>
              <button type="button" data-delete="${offer.id}">حذف</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function loadOffers() {
  if (!table) return;
  table.innerHTML = `<tr><td colspan="5">جاري التحميل...</td></tr>`;
  const { data, error } = await supabase.from("offers").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  if (error) {
    table.innerHTML = `<tr><td colspan="5">حدث خطأ أثناء تحميل العروض</td></tr>`;
    setStatus(error.message, "error");
    return;
  }
  offers = (data || []) as Offer[];
  renderTable();
}

async function saveOffer(event: SubmitEvent) {
  event.preventDefault();
  if (!form || saving) return;
  const nameAr = formValue(form, "name_ar");
  const slug = formValue(form, "slug");
  if (!nameAr || !slug) {
    setStatus("اكتب slug والاسم العربي قبل الحفظ.", "error");
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
    if (imageFile) imagePath = await uploadImage("offer-images", imageFile);
    const payload = {
      slug,
      name_ar: nameAr,
      name_en: formValue(form, "name_en") || null,
      title_ar: formValue(form, "title_ar") || null,
      title_en: formValue(form, "title_en") || null,
      description_ar: formValue(form, "description_ar") || null,
      description_en: formValue(form, "description_en") || null,
      price: nullableNumberValue(form, "price"),
      old_price: nullableNumberValue(form, "old_price"),
      currency: formValue(form, "currency") || "SAR",
      badge_ar: formValue(form, "badge_ar") || null,
      badge_en: formValue(form, "badge_en") || null,
      image_bucket: imagePath ? "offer-images" : null,
      image_path: imagePath,
      image_alt_ar: formValue(form, "image_alt_ar") || null,
      image_alt_en: formValue(form, "image_alt_en") || null,
      whatsapp_text_ar: formValue(form, "whatsapp_text_ar") || null,
      whatsapp_text_en: formValue(form, "whatsapp_text_en") || null,
      cta_label_ar: formValue(form, "cta_label_ar") || "اطلب الآن",
      cta_label_en: formValue(form, "cta_label_en") || "Order Now",
      cta_url: formValue(form, "cta_url") || null,
      features_ar: getFeatureValues("features_ar"),
      features_en: getFeatureValues("features_en"),
      is_featured: checkboxValue(form, "is_featured"),
      is_published: checkboxValue(form, "is_published"),
      sort_order: numberValue(form, "sort_order")
    };
    const id = formValue(form, "id");
    const result = id ? await offersTable().update(payload).eq("id", id) : await offersTable().insert(payload);
    if (result.error) throw result.error;
    setStatus("تم حفظ العرض بنجاح.", "success");
    if (editor) editor.hidden = true;
    await loadOffers();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ العرض", "error");
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
    const offer = offers.find((item) => item.id === editId);
    if (offer) resetForm(offer);
  }
  if (publishId) {
    const offer = offers.find((item) => item.id === publishId);
    if (!offer) return;
    const { error } = await offersTable().update({ is_published: !offer.is_published }).eq("id", publishId);
    if (error) setStatus(error.message, "error");
    else {
      setStatus("تم تحديث حالة النشر.", "success");
      await loadOffers();
    }
  }
  if (deleteId && window.confirm("هل تريد حذف هذا العرض؟")) {
    const { error } = await offersTable().delete().eq("id", deleteId);
    if (error) setStatus(error.message, "error");
    else {
      setStatus("تم حذف العرض.", "success");
      await loadOffers();
    }
  }
}

async function init() {
  const isAdmin = await requireAdmin();
  bindLogout();
  if (!isAdmin) return;
  document.querySelector("[data-new-offer]")?.addEventListener("click", () => resetForm());
  document.querySelectorAll("[data-close-editor]").forEach((button) => button.addEventListener("click", () => {
    if (editor) editor.hidden = true;
  }));
  document.querySelectorAll<HTMLElement>("[data-add-feature]").forEach((button) => {
    button.addEventListener("click", () => addFeatureRow(button.dataset.addFeature as "features_ar" | "features_en"));
  });
  table?.addEventListener("click", handleTableClick);
  form?.addEventListener("submit", saveOffer);
  await loadOffers();
}

init().catch((error) => setStatus(error instanceof Error ? error.message : "حدث خطأ في لوحة العروض", "error"));
