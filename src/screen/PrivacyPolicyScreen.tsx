import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'

const PrivacyPolicyScreen = () => {
    const navigation = useNavigation<any>();
    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
    };
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backIcon}>
                    <Icon name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chính sách & Bảo mật</Text>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                <Text style={styles.sectionTitle}>1. Mục đích thu thập thông tin</Text>
                <Text style={styles.text}>
                    Sports Shop thu thập dữ liệu cá nhân nhằm mục đích xác nhận đơn hàng, giao hàng, liên hệ hỗ trợ khách hàng và gửi thông tin khuyến mãi nếu người dùng đồng ý.
                </Text>

                <Text style={styles.sectionTitle}>2. Loại thông tin thu thập</Text>
                <Text style={styles.text}>
                    - Họ tên, số điện thoại, địa chỉ giao hàng.{'\n'}
                    - Địa chỉ email (nếu có).{'\n'}
                    - Lịch sử mua hàng, thông tin sản phẩm đã đặt.{'\n'}
                    - Địa chỉ IP và loại thiết bị khi truy cập ứng dụng.
                </Text>

                <Text style={styles.sectionTitle}>3. Phạm vi sử dụng thông tin</Text>
                <Text style={styles.text}>
                    Chúng tôi cam kết sử dụng thông tin khách hàng trong phạm vi sau:{'\n'}
                    - Xác nhận và xử lý đơn hàng.{'\n'}
                    - Giao hàng và hỗ trợ khách hàng.{'\n'}
                    - Gửi thông tin khuyến mãi, ưu đãi nếu khách hàng đồng ý nhận tin.{'\n'}
                    - Cải thiện chất lượng dịch vụ và trải nghiệm người dùng.
                </Text>

                <Text style={styles.sectionTitle}>4. Thời gian lưu trữ thông tin</Text>
                <Text style={styles.text}>
                    - Dữ liệu cá nhân sẽ được lưu trữ cho đến khi khách hàng yêu cầu xóa bỏ hoặc người quản trị hệ thống thực hiện việc đó.{'\n'}
                    - Trong mọi trường hợp, thông tin khách hàng sẽ được bảo mật tuyệt đối trên hệ thống của chúng tôi.
                </Text>

                <Text style={styles.sectionTitle}>5. Bảo mật thông tin khách hàng</Text>
                <Text style={styles.text}>
                    - Chúng tôi sử dụng các biện pháp bảo mật như mã hóa, xác thực và tường lửa để đảm bảo thông tin cá nhân không bị truy cập trái phép.{'\n'}
                    - Sports Shop cam kết không bán, trao đổi hay chia sẻ thông tin khách hàng cho bên thứ ba mà không có sự đồng ý từ bạn, trừ khi có yêu cầu pháp lý.
                </Text>

                <Text style={styles.sectionTitle}>6. Quyền của người dùng</Text>
                <Text style={styles.text}>
                    - Khách hàng có quyền yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân bất cứ lúc nào.{'\n'}
                    - Bạn cũng có quyền từ chối nhận các thông tin tiếp thị qua email hoặc tin nhắn.
                </Text>

                <Text style={styles.sectionTitle}>7. Đơn vị thu thập và quản lý thông tin</Text>
                <Text style={styles.text}>
                    CÔNG TY TNHH Sports Shop{'\n'}
                    Địa chỉ: 123 Đường Thời Trang, Q.1, TP.HCM{'\n'}
                    Hotline: 1900 1234{'\n'}
                    Email: support@f7shop.vn
                </Text>

                <Text style={styles.sectionTitle}>8. Thay đổi chính sách</Text>
                <Text style={styles.text}>
                    Chúng tôi có thể cập nhật chính sách bảo mật này bất kỳ lúc nào. Khi có thay đổi, chúng tôi sẽ thông báo trên ứng dụng hoặc qua email.
                </Text>

                <Text style={styles.sectionTitle}>9. Liên hệ</Text>
                <Text style={styles.text}>
                    Mọi thắc mắc hoặc yêu cầu liên quan đến chính sách này, vui lòng liên hệ với chúng tôi qua email hoặc số điện thoại trên.
                </Text>
            </ScrollView>
        </View>

    );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#EEEEEE',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        marginBottom: 10,
        position: 'relative',
        backgroundColor: '#0f766e',
        borderRadius: 8,
    },

    backIcon: {
        position: 'absolute',
        left: 0,
        paddingHorizontal: 10,
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#fff',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
        color: '#0f766e',
    },
    text: {
        fontSize: 16,
        color: '#374151',
        lineHeight: 24,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
});
