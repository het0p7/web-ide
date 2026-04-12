import axios from "axios";

// Global flag to prevent token refresh after logout
window.hasLoggedOut = localStorage.getItem('hasLoggedOut') === 'true';

// Create an Axios instance
const api = axios.create({
  baseURL: "",
  withCredentials: true, // Include cookies in requests
});

let isRefreshing = false;
let failedQueue =[];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  })

  failedQueue = [];
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      // Avoid refresh recursion on the refresh endpoint itself
      if (originalRequest.url && originalRequest.url.includes('/api/v1/refresh')) {
        return Promise.reject(error);
      }

      // Don't try to refresh if user has logged out
      if (window.hasLoggedOut || localStorage.getItem('hasLoggedOut') === 'true') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) =>{
          failedQueue.push({resolve, reject})
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        })
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/v1/refresh');
        // Access token is set as httpOnly cookie, no need to return it
        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api; 