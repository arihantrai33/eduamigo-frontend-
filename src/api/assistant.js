import axios from 'axios';

const API = import.meta.env.VITE_API_URL;
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const data = (res) => res.data.data;

// EduAmigo Ask
export const askAssistant = async ({ message, conversationId, choice }) =>
  data(await axios.post(`${API}/assistant/ask`, { message, conversationId, choice }, authHeader()));

export const sendFeedback = async (queryId, helpful) =>
  (await axios.post(`${API}/assistant/feedback`, { queryId, helpful }, authHeader())).data;

export const getAssistantIntro = async () => data(await axios.get(`${API}/assistant/intro`, authHeader()));

export const getTickets = async (params = {}) =>
  data(await axios.get(`${API}/assistant/tickets`, { ...authHeader(), params }));

export const updateTicket = async (id, body) =>
  data(await axios.patch(`${API}/assistant/tickets/${id}`, body, authHeader()));

export const getAssistantMetrics = async (days = 30) =>
  data(await axios.get(`${API}/assistant/metrics`, { ...authHeader(), params: { days } }));

export const getAssistantEvaluation = async () => data(await axios.get(`${API}/assistant/evaluation`, authHeader()));

// School documents EduAmigo Ask answers from (admin)
export const getKnowledge = async () => (await axios.get(`${API}/assistant/knowledge`, authHeader())).data;
export const addKnowledge = async (fields) => {
  // A PDF goes up as a form; pasted text as JSON.
  if (fields.file) {
    const form = new FormData();
    form.append('file', fields.file);
    ['title', 'category'].forEach((k) => form.append(k, fields[k]));
    form.append('audience', JSON.stringify(fields.audience || []));
    return data(await axios.post(`${API}/assistant/knowledge`, form, authHeader()));
  }
  return data(await axios.post(`${API}/assistant/knowledge`, { title: fields.title, category: fields.category, audience: fields.audience, text: fields.text }, authHeader()));
};
export const updateKnowledge = async (id, body) => data(await axios.patch(`${API}/assistant/knowledge/${id}`, body, authHeader()));
export const deleteKnowledge = async (id) => (await axios.delete(`${API}/assistant/knowledge/${id}`, authHeader())).data;

export const errorText = (err) => err?.response?.data?.message || 'Something went wrong. Please try again.';
