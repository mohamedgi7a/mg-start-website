import { escapeHtml } from "./html";
import { getPublicImageUrl } from "./storage";
import type { Project } from "../types/supabase";

export function renderProjectCard(project: Project): string {
  const imageUrl = getPublicImageUrl(project.image_bucket || "project-images", project.image_path);
  const cta = project.cta_label_ar || "عرض المشروع";
  const cardContent = `
    <div class="project-preview project-preview-image" aria-hidden="true">
      ${
        imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(project.image_alt_ar || project.title_ar)}" loading="lazy" />`
          : `<div class="offer-image-placeholder">${escapeHtml(project.title_ar)}</div>`
      }
    </div>
    <div class="project-copy">
      <span class="project-type">${escapeHtml(project.type_ar)}</span>
      <h3>${escapeHtml(project.title_ar)}</h3>
      ${project.client_name_ar ? `<strong class="project-client">${escapeHtml(project.client_name_ar)}</strong>` : ""}
      ${project.description_ar ? `<p>${escapeHtml(project.description_ar)}</p>` : ""}
      ${
        project.external_url
          ? `<span class="project-visit">${escapeHtml(cta)}</span>`
          : `<span class="project-visit project-visit-muted">${escapeHtml(cta)}</span>`
      }
    </div>
  `;

  if (project.external_url) {
    return `
      <article class="portfolio-card portfolio-card-featured reveal ${project.is_featured ? "is-featured" : ""}">
        <a class="project-link" href="${escapeHtml(project.external_url)}" target="_blank" rel="noreferrer">
          ${cardContent}
        </a>
      </article>
    `;
  }

  return `
    <article class="portfolio-card portfolio-card-featured reveal ${project.is_featured ? "is-featured" : ""}">
      <div class="project-link project-link-static">
        ${cardContent}
      </div>
    </article>
  `;
}
