export async function realDelay(min = 200, max = 400): Promise<void> {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fast") === "1") return;
  }
  const d = Math.floor(min + Math.random() * (max - min));
  await new Promise((r) => setTimeout(r, d));
}
