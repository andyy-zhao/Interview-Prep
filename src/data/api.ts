import type { AttemptInput } from "../domain/attempts";
import type { RecordData, Table, Store } from "../domain/types";
async function request(path: string, options?: RequestInit) {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
export const api = {
  load: (): Promise<{ configured: boolean; data: Store }> => request("/data"),
  save: (table: Table, data: RecordData) =>
    request("/" + table, { method: "POST", body: JSON.stringify(data) }),
  remove: (table: Table, id: string) =>
    request("/" + table + "/" + id, { method: "DELETE" }),
  attempt: (data: AttemptInput) =>
    request("/attempt", { method: "POST", body: JSON.stringify(data) }),
  review: (id: string) => request("/review/" + id, { method: "POST" }),
  quick: (id: string, action: string) =>
    request("/quick/" + id, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
