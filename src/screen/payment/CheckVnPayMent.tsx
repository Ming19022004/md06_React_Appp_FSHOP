
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation, CommonActions } from "@react-navigation/native";
import API from "../../api";
import { BASE_URL } from "../../constants";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Theme colors
const PRIMARY = '#0f766e';
const ORANGE = '#f97316';
const RED = '#ef4444';
const GREEN = '#10b981';
const AMBER = '#f59e0b';

// Khai báo global type
declare global {
  var paymentResultParams: any;
}

const BACKEND_URL = BASE_URL;

interface PaymentResult {
  status: "success" | "error" | "loading";
  title: string;
  subtitle: string;
  orderCode?: string;
  amount?: number;
  transactionId?: string;
  bankCode?: string;
  paymentTime?: string;
  errorCode?: string;
  errorMessage?: string;
}

interface OrderDetails {
  order_code?: string;
  items?: Array<{
    name: string;
    purchaseQuantity: number;
    price: number;
    size?: string;
  }>;
  totalPrice?: number;
  shippingFee?: number;
  voucher?: {
    code?: string;
    discount?: number;
  };
  finalTotal?: number;
  shippingAddress?: string;
}

const CheckVnPayMent = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const [paymentResult, setPaymentResult] = useState<PaymentResult>({
    status: "loading",
    title: "Đang kiểm tra thanh toán...",
    subtitle: "Vui lòng chờ trong giây lát",
  });
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    checkPaymentResult();

    // Thêm log để debug deep link
    console.log(" CheckVnPayMent mounted");
    console.log("Global payment params:", (globalThis as any).paymentResultParams);
    console.log(" Route params:", route.params);

    // Cleanup function to clear params when component unmounts
    return () => {
      (globalThis as any).paymentResultParams = null;
    };
  }, []);

  // Reset navigation về tab Home
  const resetToHomeTab = () => {
    console.log("🧭 resetToHomeTab() được gọi - về MainTab/HomeTab");
    try {
      const stateBefore = navigation.getState?.();
      console.log("🧭 Nav state BEFORE reset:", JSON.stringify(stateBefore, null, 2));
    } catch (e: any) {
      console.log("🧭 Nav state BEFORE reset: error", e?.message || e);
    }

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: "MainTab",
            state: {
              index: 0,
              routes: [{ name: "HomeTab" }],
            },
          },
        ],
      })
    );

    try {
      const stateAfter = navigation.getState?.();
      console.log("🧭 Nav state AFTER reset:", JSON.stringify(stateAfter, null, 2));
    } catch (e: any) {
      console.log("🧭 Nav state AFTER reset: error", e?.message || e);
    }
  };

  const checkPaymentResult = async () => {
    try {
      // Lấy params từ route (deep link hoặc navigation)
      const params = route.params as any;
      let searchParams = params?.searchParams || params || {};

      // Kiểm tra global params từ deep link
      if ((globalThis as any).paymentResultParams && Object.keys((globalThis as any).paymentResultParams).length > 0) {
        searchParams = (globalThis as any).paymentResultParams;
        console.log(" Sử dụng global params:", searchParams);
        // Clear params immediately after using them
        (globalThis as any).paymentResultParams = null;
      }

      console.log(" Payment Result Params:", searchParams);
      console.log("Backend URL:", BACKEND_URL);

      // Xử lý deep link params từ BE redirect
      if (searchParams.status === "success") {
        // Thanh toán thành công từ deep link - lấy dữ liệu thực tế từ API
        const orderCode = searchParams.orderId;
        console.log(" Xử lý success deep link cho order:", orderCode);

        // Gọi API để lấy thông tin chi tiết đơn hàng
        await fetchOrderDetails(orderCode);
        return;
      } else if (searchParams.status === "failed") {
        // Thanh toán thất bại từ deep link - lấy dữ liệu thực tế từ API
        const orderCode = searchParams.orderId;
        console.log(" Xử lý failed deep link cho order:", orderCode);

        // Gọi API để lấy thông tin chi tiết đơn hàng
        await fetchOrderDetails(orderCode);
        return;
      }

      // Xử lý VNPay params trực tiếp
      if (searchParams.vnp_ResponseCode) {
        console.log("VNPay Response Code:", searchParams.vnp_ResponseCode);

        if (searchParams.vnp_ResponseCode === "00") {
          // Thanh toán thành công - lấy dữ liệu thực tế từ API
          const orderCode = searchParams.vnp_OrderInfo?.replace("Thanh_toan_don_hang_", "");
          console.log("VNPay success, lấy thông tin order:", orderCode);

          // Gọi API để lấy thông tin chi tiết đơn hàng
          await fetchOrderDetails(orderCode);
          return;

        } else if (searchParams.vnp_ResponseCode === "24") {
          // Khách hàng hủy thanh toán - lấy dữ liệu thực tế từ API
          const orderCode = searchParams.vnp_OrderInfo?.replace("Thanh_toan_don_hang_", "");
          console.log(" VNPay cancelled, lấy thông tin order:", orderCode);

          // Gọi API để lấy thông tin chi tiết đơn hàng
          await fetchOrderDetails(orderCode);
          return;
        } else {
          // Lỗi khác từ VNPay - lấy dữ liệu thực tế từ API
          const orderCode = searchParams.vnp_OrderInfo?.replace("Thanh_toan_don_hang_", "");
          console.log(" VNPay error, lấy thông tin order:", orderCode);

          // Gọi API để lấy thông tin chi tiết đơn hàng
          await fetchOrderDetails(orderCode);
          return;
        }
      }

      // Nếu không có params, thử lấy từ cache hoặc API
      console.log("Không có params, thử lấy từ cache/API");

      // Thử lấy từ cache trước - sử dụng orderId từ URL hoặc fallback
      const orderCode = searchParams.orderId || searchParams.order_code;
      if (orderCode) {
        await fetchOrderDetails(orderCode);
        return;
      }

      // Nếu không có dữ liệu, hiển thị lỗi
      setPaymentResult({
        status: "error",
        title: "Không có thông tin thanh toán",
        subtitle: "Vui lòng thử lại hoặc liên hệ hỗ trợ",
      });

    } catch (error: any) {
      console.error(" Lỗi chi tiết:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      let errorMessage = "Không thể kiểm tra trạng thái thanh toán.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === "Network Error") {
        errorMessage = `Không thể kết nối đến server (${BACKEND_URL}). Vui lòng kiểm tra kết nối mạng.`;
      }

      setPaymentResult({
        status: "error",
        title: "Lỗi kết nối",
        subtitle: errorMessage,
      });
    }
  };



  // Function để xóa toàn bộ giỏ hàng khi thanh toán thành công
  const clearEntireCart = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.log("Không có userId để xóa giỏ hàng");
        return;
      }

      console.log("🛒 Xóa toàn bộ giỏ hàng cho user:", userId);

      // Sử dụng API xóa toàn bộ giỏ hàng
      await API.delete(`/carts/${userId}`);

      console.log("✅ Đã xóa toàn bộ giỏ hàng thành công");
    } catch (error: any) {
      console.error("❌ Lỗi khi xóa giỏ hàng:", {
        message: error.message,
        response: error.response?.data
      });
    }
  };

  // Function để lấy thông tin chi tiết đơn hàng từ API
  const fetchOrderDetails = async (orderCode: string) => {
    try {
      console.log(" Lấy thông tin chi tiết đơn hàng:", orderCode);

      // Thử lấy từ cache trước
      try {
        const cacheResponse = await axios.get(`${BACKEND_URL}/vnpay/get_payment_result`, {
          params: { order_code: orderCode }
        });

        console.log(" Cache response:", cacheResponse.data);

        if (cacheResponse.data?.success) {
          const result = cacheResponse.data.data;
          setPaymentResult({
            status: result.status === 'success' ? 'success' : 'error',
            title: result.status === 'success' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
            subtitle: result.status === 'success'
              ? 'Đơn hàng của bạn đã được xử lý thành công'
              : (result.errorMessage || 'Đã xảy ra lỗi trong quá trình thanh toán'),
            orderCode: result.orderId,
            amount: result.amount,
            transactionId: result.transactionId,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          });

                     // Nếu thanh toán thành công, xóa toàn bộ giỏ hàng
           if (result.status === 'success') {
             await clearEntireCart();
           }
          return;
        }
      } catch (cacheError: any) {
        console.log("Không thể lấy từ cache:", cacheError.message);
      }

      // Nếu không có trong cache, lấy từ database
      try {
        console.log("📞 Gọi API check_order_status với order_code:", orderCode);
        const orderResponse = await axios.get(`${BACKEND_URL}/vnpay/check_order_status`, {
          params: { order_code: orderCode }
        });

        console.log("✅ Order response:", JSON.stringify(orderResponse.data, null, 2));

        if (orderResponse.data?.success && orderResponse.data?.order) {
          const order = orderResponse.data.order;

          console.log("📦 Order data:", {
            order_code: order.order_code,
            status: order.status,
            paymentStatus: order.paymentStatus,
            finalTotal: order.finalTotal,
            paymentDetails: order.paymentDetails
          });

          // Check status: backend set 'confirmed' và 'completed' khi thanh toán thành công
          if (order.status === 'confirmed' && order.paymentStatus === 'completed') {
            // Lưu thông tin đơn hàng đầy đủ
            setOrderDetails({
              order_code: order.order_code,
              items: order.items || [],
              totalPrice: order.totalPrice,
              shippingFee: order.shippingFee,
              voucher: order.voucher,
              finalTotal: order.finalTotal,
              shippingAddress: order.shippingAddress,
            });

            setPaymentResult({
              status: 'success',
              title: 'Thanh toán thành công',
              subtitle: 'Đơn hàng của bạn đã được xử lý thành công',
              orderCode: order.order_code,
              amount: order.finalTotal || order.paymentDetails?.amount,
              transactionId: order.paymentDetails?.transactionId,
              bankCode: order.paymentDetails?.bankCode,
              paymentTime: order.paymentDetails?.paymentTime,
            });

            // Xóa toàn bộ giỏ hàng khi thanh toán thành công
            await clearEntireCart();
            return;
          } else if (order.status === 'Thanh toán thất bại' || order.paymentStatus === 'failed') {
            setPaymentResult({
              status: 'error',
              title: 'Thanh toán thất bại',
              subtitle: order.paymentDetails?.errorMessage || 'Đã xảy ra lỗi trong quá trình thanh toán',
              orderCode: order.order_code,
              errorCode: order.paymentDetails?.errorCode,
              errorMessage: order.paymentDetails?.errorMessage,
            });
            return;
          } else {
            // Trạng thái khác (pending, processing, etc.)
            console.log("⚠️ Order có trạng thái:", order.status, order.paymentStatus);
            setPaymentResult({
              status: 'error',
              title: 'Trạng thái đơn hàng',
              subtitle: `Đơn hàng đang ở trạng thái: ${order.status || 'chưa xác định'}`,
              orderCode: order.order_code,
            });
            return;
          }
        } else {
          console.log("❌ Response không hợp lệ:", orderResponse.data);
        }
      } catch (orderError: any) {
        console.error("❌ Lỗi khi gọi API check_order_status:", {
          message: orderError.message,
          response: orderError.response?.data,
          status: orderError.response?.status,
          url: `${BACKEND_URL}/vnpay/check_order_status?order_code=${orderCode}`
        });
      }

      // Nếu không lấy được dữ liệu, hiển thị lỗi
      setPaymentResult({
        status: "error",
        title: "Không tìm thấy thông tin đơn hàng",
        subtitle: `Không thể tìm thấy đơn hàng với mã: ${orderCode}`,
        orderCode: orderCode,
      });

    } catch (error: any) {
      console.error(" Lỗi khi lấy thông tin đơn hàng:", error);
      setPaymentResult({
        status: "error",
        title: "Lỗi khi lấy thông tin",
        subtitle: "Không thể lấy thông tin đơn hàng từ server",
        orderCode: orderCode,
      });
    }
  };

  const handleGoHome = () => {
    // Clear any remaining payment params
    (globalThis as any).paymentResultParams = null;

    console.log("🏠 handleGoHome() - reset về HomeTab");
    // Reset stack về MainTab và chọn HomeTab
    resetToHomeTab();
  };

  const handleBuyAgain = () => {
    // Clear any remaining payment params
    (globalThis as any).paymentResultParams = null;

    console.log("🛒 handleBuyAgain() - reset về HomeTab");
    // Đưa người dùng về tab Home để mua lại
    resetToHomeTab();
  };

  const handleCheckOrder = () => {
    // Clear any remaining payment params
    (globalThis as any).paymentResultParams = null;

    // Navigate to OrderTracking
    navigation.navigate("OrderTracking" as never);
  };

  const handleRetry = () => {
    setPaymentResult({
      status: "loading",
      title: "Đang kiểm tra thanh toán...",
      subtitle: "Vui lòng chờ trong giây lát",
    });
    checkPaymentResult();
  };



  if (paymentResult.status === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>{paymentResult.title}</Text>
        <Text style={styles.loadingSubtext}>{paymentResult.subtitle}</Text>
        <View style={styles.loadingDots}>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.dot}>•</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Icon Status */}
        <View style={[
          styles.iconContainer,
          paymentResult.status === "success" ? styles.successIcon : styles.errorIcon
        ]}>
          <Text style={styles.iconText}>
            {paymentResult.status === "success" ? "✓" : "✗"}
          </Text>
        </View>

        {/* Title */}
        <Text style={[
          styles.title,
          paymentResult.status === "success" ? styles.successTitle : styles.errorTitle
        ]}>
          {paymentResult.title}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{paymentResult.subtitle}</Text>

        {/* Order Details */}
        {paymentResult.orderCode && (
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>Mã đơn hàng:</Text>
            <Text style={styles.orderCode}>{paymentResult.orderCode}</Text>
          </View>
        )}

        {/* Giá trị đơn hàng (chỉ hiển thị khi thành công) */}
        {paymentResult.status === "success" && paymentResult.amount && (
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>Giá trị đơn hàng:</Text>
            <Text style={[styles.orderCode, { fontSize: 18, fontWeight: "bold", color: PRIMARY }]}>
              {paymentResult.amount.toLocaleString("vi-VN")}₫
            </Text>
          </View>
        )}

        {/* Payment Details (chỉ hiển thị khi thành công) */}
        {paymentResult.status === "success" && (
          <>
            {paymentResult.transactionId && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderLabel}>Mã giao dịch:</Text>
                <Text style={styles.orderCode}>{paymentResult.transactionId}</Text>
              </View>
            )}

            {paymentResult.bankCode && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderLabel}>Ngân hàng:</Text>
                <Text style={styles.orderCode}>{paymentResult.bankCode}</Text>
              </View>
            )}
          </>
        )}

        {/* Error Details (chỉ hiển thị khi có lỗi) */}
        {paymentResult.status === "error" && (
          <>
            {paymentResult.errorCode && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderLabel}>Mã lỗi:</Text>
                <Text style={styles.orderCode}>{paymentResult.errorCode}</Text>
              </View>
            )}

            {paymentResult.errorMessage && (
              <View style={styles.orderDetails}>
                <Text style={styles.orderLabel}>Chi tiết lỗi:</Text>
                <Text style={styles.orderCode}>{paymentResult.errorMessage}</Text>
              </View>
            )}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {paymentResult.status === "success" ? (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleCheckOrder}>
                <Text style={styles.primaryButtonText}>Xem đơn hàng</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.primaryButton} onPress={handleBuyAgain}>
                <Text style={styles.primaryButtonText}>Mua lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRetry}>
                <Text style={styles.secondaryButtonText}>Thử lại</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.secondaryButton, { marginTop: 10 }]} onPress={handleGoHome}>
                <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </>
          )}


        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    textAlign: "center",
    color: PRIMARY,
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
    color: "#666",
  },
  loadingDots: {
    flexDirection: "row",
    marginTop: 20,
  },
  dot: {
    fontSize: 20,
    color: "#1677ff",
    marginHorizontal: 5,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successIcon: {
    backgroundColor: GREEN,
  },
  errorIcon: {
    backgroundColor: RED,
  },
  iconText: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  successTitle: {
    color: GREEN,
  },
  errorTitle: {
    color: RED,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
    lineHeight: 24,
  },
  orderDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderLabel: {
    fontSize: 14,
    color: PRIMARY,
    marginRight: 10,
  },
  orderCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 30,
  },
  primaryButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "500",
  },

});

export default CheckVnPayMent;
