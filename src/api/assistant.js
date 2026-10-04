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

export const errorText = (err) => err?.response?.data?.message || 'Something went wrong. Please try again.';
