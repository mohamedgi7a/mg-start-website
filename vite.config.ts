import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        homeProjects: "src/pages/home-projects.ts",
        offers: "offers.html",
        mohamedAli: "Mohamed-Ali/index.html",
        projects: "projects/index.html",
        projectsLegacy: "projects.html",
        adminLogin: "admin/login/index.html",
        adminLoginLegacy: "admin/login.html",
        adminDashboard: "admin/index.html",
        adminOffers: "admin/offers/index.html",
        adminOffersLegacy: "admin/offers.html",
        adminProjects: "admin/projects/index.html",
        adminProjectsLegacy: "admin/projects.html"
      }
    }
  }
});
