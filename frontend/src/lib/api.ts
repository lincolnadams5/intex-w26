const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export async function getSafehouses() {
  const res = await fetch(`${BASE_URL}/api/safehouses`);
  if (!res.ok) throw new Error("Failed to fetch safehouses");
  return res.json();
}
