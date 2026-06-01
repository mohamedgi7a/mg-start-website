import { getPublicImageUrl } from "../lib/storage";
import { getSupabaseClient } from "../lib/supabase";
import { createWhatsAppUrl } from "../lib/whatsapp";
import { escapeHtml } from "../lib/html";
import type { Offer } from "../types/supabase";

const offersList = document.querySelector<HTMLElement>("#offersList");
const fallbackContactUrl = "index.html#contact";

function formatPrice(value: number | null, currency: string): string {
  if (value === null) return "";
  return new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(value) + ` ${currency}`;
}

function getOfferCta(offer: Offer): { href: string; label: string; target: string } {
  if (offer.cta_url) {
    return { href: offer.cta_url, label: offer.cta_label_ar || "اطلب الآن", target: "_blank" };
  }

  if (offer.whatsapp_text_ar) {
    return { href: createWhatsAppUrl(offer.whatsapp_text_ar), label: offer.cta_label_ar || "واتساب", target: "_blank" };
  }

  return { href: fallbackContactUrl, label: offer.cta_label_ar || "اطلب الآن", target: "_self" };
}

function renderState(message: string, className: "loading" | "empty" | "error"): void {
  if (!offersList) return;
  offersList.innerHTML = `<div class="cms-state cms-state-${className}">${escapeHtml(message)}</div>`;
}

function renderOffer(offer: Offer): string {
  const imageUrl = getPublicImageUrl(offer.image_bucket || "offer-images", offer.image_path);
  const cta = getOfferCta(offer);
  const title = offer.title_ar || offer.name_ar;
  const description = offer.description_ar || "";
  const features = Array.isArray(offer.features_ar) ? offer.features_ar : [];
  const price = formatPrice(offer.price, offer.currency || "SAR");
  const oldPrice = formatPrice(offer.old_price, offer.currency || "SAR");
  const targetAttributes = cta.target === "_blank" ? ' target="_blank" rel="noreferrer"' : "";

  return `
    <article class="offer-card-large cms-offer-card reveal ${offer.is_featured ? "is-featured" : ""}">
      ${offer.badge_ar ? `<span class="offer-badge">${escapeHtml(offer.badge_ar)}</span>` : ""}
      ${
        imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(offer.image_alt_ar || title)}" loading="lazy" />`
          : `<div class="offer-image-placeholder">${escapeHtml(offer.name_ar)}</div>`
      }
      <div class="offer-actions cms-offer-content">
        <div>
          <h2>${escapeHtml(offer.name_ar)}</h2>
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

async function loadOffers(): Promise<void> {
  if (!offersList) return;
  renderState("جاري تحميل العروض...", "loading");

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
      renderState("لا توجد عروض متاحة حالياً", "empty");
      return;
    }

    offersList.innerHTML = data.map(renderOffer).join("");
    requestAnimationFrame(() => {
      offersList.querySelectorAll(".reveal").forEach((node) => node.classList.add("is-visible"));
    });
  } catch (error) {
    console.error("Failed to load offers", error);
    renderState("حدث خطأ أثناء تحميل العروض", "error");
  }
}

void loadOffers();
