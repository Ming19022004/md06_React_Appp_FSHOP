import { Platform } from 'react-native';
import { BASE_URL } from '../constants';

// ✅ Cấu hình URL return cho VNPay theo platform (đồng bộ với BE)
export const getVNPayReturnUrl = () => {
  // ✅ URL return cho Android emulator - sử dụng 10.0.2.2 như BE
  if (Platform.OS === 'android') {
    return `${BASE_URL}/vnpay/payment-result`;
  }
  
  // ✅ URL return cho iOS simulator
  if (Platform.OS === 'ios') {
    return `${BASE_URL}/vnpay/payment-result`;
  }
  
  // ✅ Fallback cho web hoặc platform khác
  return `${BASE_URL}/vnpay/payment-result`;
};

// ✅ Cấu hình VNPay cho các platform khác nhau
export const VNPAY_CONFIG = {
  // ✅ URL return cho từng platform (đồng bộ với BE)
  returnUrls: {
    android: `${BASE_URL}/vnpay/payment-result`,
    ios: `${BASE_URL}/vnpay/payment-result`,
    web: `${BASE_URL}/vnpay/payment-result`,
  },
  
  // ✅ IP address cho từng platform
  ipnUrl: `${BASE_URL}/vnpay/ipn`,
  
  // ✅ Các cấu hình khác
  tmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
  hashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
};

// ✅ Helper function để lấy URL return theo platform
export const getReturnUrlByPlatform = () => {
  const platform = Platform.OS;
  return VNPAY_CONFIG.returnUrls[platform] || VNPAY_CONFIG.returnUrls.web;
};

// ✅ Helper function để debug URL configuration
export const debugVNPayConfig = () => {
  console.log('🔍 VNPay Configuration Debug:');
  console.log('Platform:', Platform.OS);
  console.log('BASE_URL:', BASE_URL);
  console.log('Return URL:', getVNPayReturnUrl());
  console.log('Platform-specific URL:', getReturnUrlByPlatform());
  console.log('Full config:', VNPAY_CONFIG);
  console.log('✅ Android Return URL:', VNPAY_CONFIG.returnUrls.android);
  console.log('✅ Expected URL for Android:', `${BASE_URL}/vnpay/payment-result`);
};

// ✅ Helper function để kiểm tra URL return có đúng không (đồng bộ với BE)
export const validateReturnUrl = () => {
  const currentUrl = getVNPayReturnUrl();
  const expectedUrl = `${BASE_URL}/vnpay/payment-result`;
  
  console.log('🔍 Validating Return URL:');
  console.log('Current URL:', currentUrl);
  console.log('Expected URL:', expectedUrl);
  console.log('Is Correct:', currentUrl === expectedUrl);
  
  return currentUrl === expectedUrl;
};