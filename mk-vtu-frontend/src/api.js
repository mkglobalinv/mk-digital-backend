import axios from "axios";

const envApiUrl = import.meta.env.VITE_API_URL || "";
const isLocalDevelopment = import.meta.env.DEV && envApiUrl.includes('localhost');

const API = axios.create({
  baseURL: isLocalDevelopment ? "" : envApiUrl
});

// attach token automatically
API.interceptors.request.use((req) => {
  req.metadata = { startTime: new Date() };
  // If Authorization header is already explicitly set (e.g. in ContentManager), don't overwrite it
  if (req.headers.Authorization) return req;

  // Check for admin/superadmin token
  const isAdminRequest = req.url.includes('/admin') || req.url.includes('/api/content');
  const token = isAdminRequest 
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auto-clear timer — if slow-network:true fires, automatically clear after 15s
// so the banner doesn't stick permanently if no further API calls are made.
let _slowNetworkClearTimer = null;

const dispatchNetworkEvent = (slow) => {
  window.dispatchEvent(new CustomEvent('slow-network', { detail: { slow } }));
  if (_slowNetworkClearTimer) clearTimeout(_slowNetworkClearTimer);
  if (slow) {
    // Auto-dismiss the "Network Unstable" banner after 15 seconds
    _slowNetworkClearTimer = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('slow-network', { detail: { slow: false } }));
      _slowNetworkClearTimer = null;
    }, 15000);
  }
};

API.interceptors.response.use(
  (response) => {
    const duration = new Date() - response.config.metadata.startTime;
    // Raised threshold to 12s to reduce false positives from initial heavy loads
    dispatchNetworkEvent(duration > 12000);
    return response;
  },
  (error) => {
    dispatchNetworkEvent(false);
    return Promise.reject(error);
  }
);

export default API;