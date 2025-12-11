import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './constants';

const API = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// 🔥 Gắn token tự động vào mọi request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
