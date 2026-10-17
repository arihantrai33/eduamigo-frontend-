import axios from 'axios';
import { childQuery } from '../utils/selectedChild';

const API = import.meta.env.VITE_API_URL;

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

// PARENT
export const getChildBus = async () => {
  const res = await axios.get(`${API}/transport/my-child-bus${childQuery()}`, authHeader());
  return res.data;
};

// ADMIN
export const getAllBuses = async () => {
  const res = await axios.get(`${API}/transport`, authHeader());
  return res.data;
};

export const createBus = async (data) => {
  const res = await axios.post(`${API}/transport`, data, authHeader());
  return res.data;
};

export const updateBusStops = async (id, stops) => {
  const res = await axios.put(`${API}/transport/${id}/stops`, { stops }, authHeader());
  return res.data;
};

export const updateBus = async (id, data) => {
  const res = await axios.put(`${API}/transport/${id}`, data, authHeader());
  return res.data;
};

export const deleteBus = async (id) => {
  const res = await axios.delete(`${API}/transport/${id}`, authHeader());
  return res.data;
};

export const getStudentsForBus = async () => {
  const res = await axios.get(`${API}/transport/students`, authHeader());
  return res.data;
};

export const assignStudents = async (busId, studentIds, stopIds = {}) => {
  const res = await axios.put(`${API}/transport/${busId}/assign-students`, { studentIds, stopIds }, authHeader());
  return res.data;
};

// DRIVER
export const getDriverBus = async (token) => {
  const res = await axios.get(`${API}/transport/driver/${token}`);
  return res.data;
};

export const startTrip = async (token, direction = "pickup") => {
  const res = await axios.patch(`${API}/transport/driver/${token}/start-trip`, { direction });
  return res.data;
};

export const endTrip = async (token) => {
  const res = await axios.patch(`${API}/transport/driver/${token}/end-trip`);
  return res.data;
};

export const markStopDone = async (token) => {
  const res = await axios.patch(`${API}/transport/driver/${token}/stop-done`);
  return res.data;
};

// A batch of GPS readings: [{ lat, lng, accuracy, speed, heading, at }]. The reply says how far the trip has got.
export const sendLocations = async (token, points) => {
  const res = await axios.post(`${API}/transport/driver/${token}/location`, { points }, { timeout: 15000 });
  return res.data;
};
