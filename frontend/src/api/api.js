const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.detail || "Сервер не смог обработать запрос.");
  }

  return payload;
}

export function getSimulationData() {
  return request("/api/data");
}

export function simulate(decisions) {
  return request("/api/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decisions }),
  });
}
