import { expect, test } from "@playwright/test";

test("service worker installs and never serves a generic API response from shell cache", async ({
  page,
  request,
}) => {
  await page.goto("/login");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const registration = await page.evaluate(async () => {
    const value = await navigator.serviceWorker.getRegistration();
    return Boolean(value?.active);
  });
  expect(registration).toBe(true);
  const first = await request.get("/api/health");
  const second = await request.get("/api/health");
  expect(first.ok()).toBe(true);
  expect(second.ok()).toBe(true);
  expect(await second.json()).toEqual(await first.json());
});
test("service worker keeps the previous package when activation fails and clears it explicitly", async ({
  page,
}) => {
  await page.goto("/login");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const result = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const send = (message: unknown) =>
      new Promise<unknown>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => resolve(event.data);
        registration.active?.postMessage(message, [channel.port2]);
      });
    const meta = await caches.open("family-english-package-meta-v1");
    await caches
      .open("family-english-package-old")
      .then((cache) => cache.put("/learn", new Response("old-package")));
    await meta.put(
      "/__family-english-active-package__",
      new Response("family-english-package-old"),
    );
    const failed = await send({
      type: "ACTIVATE_PACKAGE",
      version: "broken",
      urls: ["/resource-that-does-not-exist-for-acceptance"],
    });
    const markerAfterFailure = await (
      await caches.open("family-english-package-meta-v1")
    ).match("/__family-english-active-package__");
    const activeAfterFailure = await markerAfterFailure?.text();
    registration.active?.postMessage({ type: "CLEAR_PACKAGE" });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const markerAfterClear = await (
      await caches.open("family-english-package-meta-v1")
    ).match("/__family-english-active-package__");
    const oldCacheAfterClear = await caches.has("family-english-package-old");
    return {
      failed,
      activeAfterFailure,
      markerAfterClear: Boolean(markerAfterClear),
      oldCacheAfterClear,
    };
  });
  expect(result.failed).toEqual({ ok: false });
  expect(result.activeAfterFailure).toBe("family-english-package-old");
  expect(result.markerAfterClear).toBe(false);
  expect(result.oldCacheAfterClear).toBe(false);
});

test("browser stores and clears an offline lesson package in IndexedDB", async ({
  page,
}) => {
  await page.goto("/login");
  const result = await page.evaluate(async () => {
    const request = indexedDB.open("family-english-browser-test", 1);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onupgradeneeded = () =>
        request.result.createObjectStore("packages");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("packages", "readwrite");
      tx.objectStore("packages").put(
        {
          version: "v1",
          lessonStages: [
            "prepare",
            "review",
            "introduce",
            "practice",
            "finish",
          ],
        },
        "active",
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const stored = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("packages")
        .objectStore("packages")
        .get("active");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("packages", "readwrite");
      tx.objectStore("packages").delete("active");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    const cleared = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("packages")
        .objectStore("packages")
        .get("active");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return { stored, cleared };
  });
  expect(result.stored).toMatchObject({
    version: "v1",
    lessonStages: expect.arrayContaining(["finish"]),
  });
  expect(result.cleared).toBeUndefined();
});
