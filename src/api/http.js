const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
  
export async function apiFetch(path, options = {}) {
  const r = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!r.ok) throw new Error(`API error ${r.status}`);
  return r.status === 204 ? null : r.json();
}
export { API_BASE_URL };
