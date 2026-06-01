import { escapeHtml } from "../lib/html";
import { getPublicImageUrl } from "../lib/storage";
import { getSupabaseClient } from "../lib/supabase";
import { createWhatsAppUrl } from "../lib/whatsapp";
import type { Offer } from "../types/supabase";

const offersList = document.querySelector<HTMLElement>("#offersList");
const fallbackContactUrl = "index.html#contact";
let loadedOffers: Offer[] = [];

type Lang = "ar" | "en";

const messages = {
  ar: {
    loading: "جاري تحميل العروض...",
    empty: "لا توجد عروض متاحة حالياً",
    error: "حدث خطأ أثناء تحميل العروض",
    orderNow: "اطلب الآن",
    whatsapp: "واتساب"
  },
  en: {
    loading: "Loading offers...",
    empty: "No offers are currently available",
    error: "An error occurred while loading offers",
    orderNow: "Order Now",
    whatsapp: "WhatsApp"
  }
};

function getCurrentLang(): Lang {
  return localStorage.getItem("mg-start-lang") === "en" ? "en" : "ar";
}

function pickLocalized(lang: Lang, arValue: string | null | undefined, enValue: string | null | undefined): string {
  return (lang === "en" ? enValue || arValue : arValue || enValue) || "";
}

function formatPrice(value: number | null, currency: string, lang: Lang): string {
  if (value === null) return "";
  const locale = lang === "en" ? "en-US" : "ar-SA";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value) + ` ${currency}`;
}

function getOfferCta(offer: Offer, lang: Lang): { href: string; label: string; target: string } {
  const ctaLabel = pickLocalized(lang, offer.cta_label_ar, offer.cta_label_en) || messages[lang].orderNow;
  const whatsappText = pickLocalized(lang, offer.whatsapp_text_ar, offer.whatsapp_text_en);

  if (offer.cta_url) {
    return { href: offer.cta_url, label: ctaLabel, target: "_blank" };
  }

  if (whatsappText) {
    return { href: createWhatsAppUrl(whatsappText), label: ctaLabel || messages[lang].whatsapp, target: "_blank" };
  }

  return { href: fallbackContactUrl, label: ctaLabel, target: "_self" };
}

function renderState(message: string, className: "loading" | "empty" | "error"): void {
  if (!offersList) return;
  offersList.innerHTML = `<div class="cms-state cms-state-${className}">${escapeHtml(message)}</div>`;
}

function renderOffer(offer: Offer, lang: Lang): string {
  const imageUrl = getPublicImageUrl(offer.image_bucket || "offer-images", offer.image_path);
  const cta = getOfferCta(offer, lang);
  const name = pickLocalized(lang, offer.name_ar, offer.name_en);
  const title = pickLocalized(lang, offer.title_ar, offer.title_en) || name;
  const description = pickLocalized(lang, offer.description_ar, offer.description_en);
  const badge = pickLocalized(lang, offer.badge_ar, offer.badge_en);
  const imageAlt = pickLocalized(lang, offer.image_alt_ar, offer.image_alt_en) || title;
  const featuresSource = lang === "en" && offer.features_en?.length ? offer.features_en : offer.features_ar;
  const features = Array.isArray(featuresSource) ? featuresSource : [];
  const price = formatPrice(offer.price, offer.currency || "SAR", lang);
  const oldPrice = formatPrice(offer.old_price, offer.currency || "SAR", lang);
  const targetAttributes = cta.target === "_blank" ? ' target="_blank" rel="noreferrer"' : "";

  return `
    <article class="offer-card-large cms-offer-card reveal ${offer.is_featured ? "is-featured" : ""}">
      ${badge ? `<span class="offer-badge">${escapeHtml(badge)}</span>` : ""}
      ${
        imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(imageAlt)}" loading="lazy" />`
          : `<div class="offer-image-placeholder">${escapeHtml(name)}</div>`
      }
      <div class="offer-actions cms-offer-content">
        <div>
          <h2>${escapeHtml(name)}</h2>
          <h3>${escapeHtml(title)}</h3>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
          ${features.length ? `<ul>${features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>` : ""}
        </div>
        <div class="offer-price-row">
          ${oldPrice ? `<span class="old-price">${escapeHtml(oldPrice)}</span>` : ""}
          ${price ? `<strong>${escapeHtml(price)}</strong>` : ""}
        </div>
        <a class="btn btn-primary" href="${escapeHtml(cta.href)}"${targetAttributes}>${escapeHtml(cta.label)}</a>
      </div>
    </article>
  `;
}

function renderOffers(offers: Offer[]): void {
  if (!offersList) return;
  const lang = getCurrentLang();
  offersList.innerHTML = offers.map((offer) => renderOffer(offer, lang)).join("");
  requestAnimationFrame(() => {
    offersList.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
  });
}

async function loadOffers(): Promise<void> {
  if (!offersList) return;
  renderState(messages[getCurrentLang()].loading, "loading");

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderState(messages[getCurrentLang()].empty, "empty");
      return;
    }

    loadedOffers = data;
    renderOffers(loadedOffers);
  } catch (error) {
    console.error("Failed to load offers", error);
    renderState(messages[getCurrentLang()].error, "error");
  }
}

document.querySelectorAll<HTMLElement>(".lang-btn").forEach((button) => {
  button.addEventListener("click", () => {
    window.setTimeout(() => {
      if (loadedOffers.length) renderOffers(loadedOffers);
    }, 0);
  });
});

void loadOffers();
