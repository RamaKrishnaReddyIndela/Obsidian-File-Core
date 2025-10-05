// src/services/auth.js
import axios from '../utils/axios';

export const getUserProfile = () => {
  return axios.get('/user/profile');
};
