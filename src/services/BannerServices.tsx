import API from "../api";

export const fetchBanners = async () => {
    try {
        const res = await API.get('/banners');
        return res.data;
    } catch (err) {
        console.error('❌ Lỗi lấy banner',err);
        return [];
    }
};