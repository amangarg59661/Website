import { test, expect } from "@playwright/test";
import { ROUTES, VIEWPORTS } from "./routes";

for (const viewport of VIEWPORTS) {
  test.describe(`viewport ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const route of ROUTES) {
      test(`${route}`, async ({ page }) => {
        await page.goto(route, { waitUntil: "networkidle" });
        await page.evaluate(async () => {
          if (document.fonts) await document.fonts.ready;
        });
        await page.waitForTimeout(300);
        await expect(page).toHaveScreenshot(
          `${viewport.name}-${route.replace(/\//g, "_") || "root"}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.001 },
        );
      });
    }
  });
}
