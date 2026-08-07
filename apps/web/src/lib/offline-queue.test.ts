import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";

import {
  applyPulledChanges,
  openOfflineDatabase,
  pendingOperationCount,
  pullChanges,
  readSyncCursor,
  replayQueue,
  resolveConflict,
  saveRecordAndQueue,
} from "./offline-queue";

const operation = (
  operationId: string,
  recordId: string,
  createdAt: string,
) => ({
  operationId,
  kind: "upsert-session" as const,
  recordId,
  baseVersion: 0,
  payload: { clientId: recordId, targetId: "phonics-s" },
  createdAt,
});

async function readStore<T>(store: string, key: IDBValidKey) {
  const db = await openOfflineDatabase();
  const request = db.transaction(store).objectStore(store).get(key);
  const value = await new Promise<T | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return value;
}

describe("offline queue browser persistence", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("family-english-offline");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  });

  it("atomically stores records and operations, then replays oldest first", async () => {
    await saveRecordAndQueue(
      { recordId: "session-new", version: 0, deleted: false },
      operation("op-new", "session-new", "2026-08-07T00:00:02Z"),
    );
    await saveRecordAndQueue(
      { recordId: "session-old", version: 0, deleted: false },
      operation("op-old", "session-old", "2026-08-07T00:00:01Z"),
    );
    const calls: string[] = [];
    await replayQueue(async (_url, init) => {
      calls.push(JSON.parse(String(init?.body)).operationId);
      return new Response("{}", { status: 200 });
    });
    expect(calls).toEqual(["op-old", "op-new"]);
    expect(await pendingOperationCount()).toBe(0);
    expect(await readStore("records", "session-old")).toBeTruthy();
  });

  it("retains failures and conflicts, and resolves them explicitly", async () => {
    await saveRecordAndQueue(
      { recordId: "session-1", version: 0, deleted: false },
      operation("op-1", "session-1", "2026-08-07T00:00:00Z"),
    );
    await expect(
      replayQueue(
        async () =>
          new Response(JSON.stringify({ currentVersion: 3 }), { status: 409 }),
      ),
    ).rejects.toThrow("同步冲突");
    expect(await pendingOperationCount()).toBe(1);
    await resolveConflict("op-1", "local", 3);
    await expect(
      replayQueue(async (_url, init) => {
        expect(JSON.parse(String(init?.body)).baseVersion).toBe(3);
        return new Response("{}", { status: 200 });
      }),
    ).resolves.toBeUndefined();
    expect(await pendingOperationCount()).toBe(0);
  });

  it("persists encoded cursors and applies tombstone precedence", async () => {
    await applyPulledChanges(
      [
        {
          recordId: "r",
          version: 2,
          deleted: false,
          payload: { value: "new" },
          sequence: "2",
        },
      ],
      "cursor/2",
    );
    await applyPulledChanges(
      [{ recordId: "r", version: 2, deleted: true, sequence: "3" }],
      "cursor/3",
    );
    await applyPulledChanges(
      [
        {
          recordId: "r",
          version: 1,
          deleted: false,
          payload: { value: "stale" },
          sequence: "4",
        },
      ],
      "cursor/4",
    );
    expect(await readSyncCursor()).toBe("cursor/4");
    expect(
      await readStore<{ deleted: boolean; payload?: { value: string } }>(
        "records",
        "r",
      ),
    ).toMatchObject({ deleted: true });
    let requested = "";
    await pullChanges(async (url) => {
      requested = String(url);
      return new Response(JSON.stringify({ changes: [], cursor: "5" }), {
        status: 200,
      });
    });
    expect(requested).toContain("cursor=cursor%2F4");
    expect(await readSyncCursor()).toBe("5");
  });
});
