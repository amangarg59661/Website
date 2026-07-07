import { setupWorker } from "msw/browser";
import { handlers } from "./handlers/index";

const worker = setupWorker(...handlers);

export async function startMocks(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
  if (process.env.NODE_ENV === "development") {
    console.info("[msw] mocks active");
  }
}
