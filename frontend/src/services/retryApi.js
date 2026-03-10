import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const API = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  timeout: 30000,
});

let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest._retry) {
      originalRequest._retry = 0;
    }

    if (
      (error.code === 'ECONNABORTED' ||
        error.response?.status === 503 ||
        error.response?.status === 504) &&
      originalRequest._retry < MAX_RETRIES
    ) {
      originalRequest._retry += 1;
      retryCount += 1;

      console.log(`Retry attempt ${originalRequest._retry}/${MAX_RETRIES} for ${originalRequest.url}`);

      await sleep(RETRY_DELAY * originalRequest._retry);

      return API(originalRequest);
    }

    retryCount = 0;
    return Promise.reject(error);
  }
);

export const getRetryCount = () => retryCount;
export const resetRetryCount = () => {
  retryCount = 0;
};

export default API;
