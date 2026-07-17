import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8800', // Assuming backend is on 8800
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
