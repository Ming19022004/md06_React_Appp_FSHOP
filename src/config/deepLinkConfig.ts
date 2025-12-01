import { BASE_URL } from "../constants";

// Deep link config
export const DEEP_LINK_CONFIG = {
  BASE_URL: "coolmate://payment-result",
  FALLBACK_URL: `${BASE_URL}/vnpay/payment-result`,
  UNIVERSAL_LINK: "https://coolmate.com/payment-result"
};

// ---------------------------
// Create Deep Link
// ---------------------------
export const createDeepLinkUrl = (
  orderCode: string,
  status: string,
  amount?: number,
  transactionId?: string,
  errorCode?: string,
  errorMessage?: string
) => {

  const params = new URLSearchParams({
    orderId: orderCode,
    status,
    timestamp: Date.now().toString()
  });

  if (amount) params.append("amount", String(amount));
  if (transactionId) params.append("transactionId", transactionId);
  if (errorCode) params.append("errorCode", errorCode);
  if (errorMessage) params.append("errorMessage", encodeURIComponent(errorMessage));

  return `${DEEP_LINK_CONFIG.BASE_URL}?${params.toString()}`;
};


// ---------------------------
// Create Universal Link
// ---------------------------
export const createUniversalLinkUrl = (
  orderCode: string,
  status: string,
  amount?: number,
  transactionId?: string,
  errorCode?: string,
  errorMessage?: string
) => {

  const params = new URLSearchParams({
    orderId: orderCode,
    status,
    timestamp: Date.now().toString()
  });

  if (amount) params.append("amount", String(amount));
  if (transactionId) params.append("transactionId", transactionId);
  if (errorCode) params.append("errorCode", errorCode);
  if (errorMessage) params.append("errorMessage", encodeURIComponent(errorMessage));

  return `${DEEP_LINK_CONFIG.UNIVERSAL_LINK}?${params.toString()}`;
};


// ---------------------------
// Parse Deep Link / Universal Link
// ---------------------------
export const parseDeepLinkUrl = (url: string) => {
  try {
    if (
      !url ||
      (!url.includes("coolmate://payment-result") &&
       !url.includes("https://coolmate.com/payment-result"))
    ) {
      return null;
    }

    const cleanedUrl = url.replace("#/", "?");
    const urlObj = new URL(cleanedUrl);
    const params = new URLSearchParams(urlObj.search);

    return {
      orderId: params.get("orderId") || undefined,
      status: params.get("status") || undefined,
      amount: params.get("amount") ? Number(params.get("amount")) : undefined,
      transactionId: params.get("transactionId") || undefined,
      errorCode: params.get("errorCode") || undefined,
      errorMessage: params.get("errorMessage")
        ? decodeURIComponent(params.get("errorMessage") || "")
        : undefined,
      timestamp: params.get("timestamp") || undefined
    };
  } catch (err) {
    console.log("❌ parseDeepLinkUrl error:", err);
    return null;
  }
};


// ---------------------------
// Validate result
// ---------------------------
export const validateDeepLinkData = (data: any) => {
  if (!data) return false;
  if (!data.orderId || !data.status) return false;

  return true;
};


// ---------------------------
// Status mapping
// ---------------------------
export const PAYMENT_STATUS_MAP = {
  success: {
    title: "Thanh toán thành công",
    subtitle: "Đơn hàng của bạn đã được xử lý thành công"
  },
  failed: {
    title: "Thanh toán thất bại",
    subtitle: "Thanh toán đã bị từ chối hoặc thất bại"
  },
  error: {
    title: "Lỗi hệ thống",
    subtitle: "Đã xảy ra lỗi trong quá trình xử lý thanh toán"
  },
  invalid: {
    title: "Dữ liệu không hợp lệ",
    subtitle: "Thông tin thanh toán không đúng hoặc đã bị thay đổi"
  }
};
