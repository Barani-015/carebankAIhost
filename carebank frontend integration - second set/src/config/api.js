// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-api.com';

export const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    SIGNIN: `${API_BASE_URL}/api/auth/signin`,
    SIGNOUT: `${API_BASE_URL}/api/auth/signout`,
  },
  USER: {
    PROFILE: `${API_BASE_URL}/api/user/profile`,
    UPDATE: `${API_BASE_URL}/api/user/update`,
  },
  // Add more endpoints as needed
};

// Or you can export individual constants
export const SIGNUP_ENDPOINT = `${API_BASE_URL}/api/auth/signup`;
export const SIGNIN_ENDPOINT = `${API_BASE_URL}/api/auth/signin`;
export const SIGNOUT_ENDPOINT = `${API_BASE_URL}/api/auth/signout`;
export const PROFILE_ENDPOINT = `${API_BASE_URL}/api/user/profile`;
export const UPDATE_ENDPOINT = `${API_BASE_URL}/api/user/update`;