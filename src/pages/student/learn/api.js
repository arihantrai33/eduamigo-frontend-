// Learning AI requests. Plain JSON calls use axios; the tutor's streamed answer uses fetch, reading one JSON event per line
// (NDJSON: meta, delta..., final | error) as it arrives. Errors are shaped like axios errors, so errorMessage() reads them.
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("token")}` });

export const learningApi = {
  get: (path) => axios.get(`${API}/learning${path}`, { headers: headers() }).then((r) => r.data.data),
  post: (path, body) => axios.post(`${API}/learning${path}`, body, { headers: headers() }).then((r) => r.data.data),
  patch: (path, body) => axios.patch(`${API}/learning${path}`, body, { headers: headers() }).then((r) => r.data.data),
  del: (path) => axios.delete(`${API}/learning${path}`, { headers: headers() }).then((r) => r.data),
};

// Streams one tutor answer. onEvent(event) is called for every event. Resolves when the stream ends; rejects with an
// axios-shaped error when the request is refused (status and the server's message), or with an AbortError when cancelled.
export async function streamChat(body, { signal, onEvent }) {
  const res = await fetch(`${API}/learning/chat`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw Object.assign(new Error(`Request failed with status code ${res.status}`), {
      response: { status: res.status, data, headers: { "x-request-id": res.headers.get("x-request-id") } },
      config: { url: "/learning/chat", method: "post" },
    });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) { try { onEvent(JSON.parse(line)); } catch { /* a malformed line is skipped */ } }
    }
  }
  if (buffer.trim()) { try { onEvent(JSON.parse(buffer)); } catch { /* ignore */ } }
}

// While an answer is still streaming, hidden blocks (```check, ```diagram) may be half written: hide them until the final
// answer arrives with them taken out.
export function visibleWhileStreaming(text) {
  return String(text || "")
    .replace(/```(check|diagram)[\s\S]*?```/g, "")
    .replace(/```(check|diagram)[\s\S]*$/, "")
    .replace(/```(c|ch|che|chec|d|di|dia|diag|diagr|diagra)?$/, "");
}
