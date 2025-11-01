import API from "../api";

export const fetchAllProducts = async () => {
    try {
        const res = await API.get('/products');
        return res.data.data;
    } catch (err) {
        console.error('❌ Lỗi lấy sản phẩm', err);
        return [];
    }
};

export const fetchProductById = async (id: string) => {
    try {
        const res = await API.get(`/products/${id}`);
        return res.data.data;
    } catch (err) {
        console.error(`❌ Lỗi lấy sản phẩm ${id}`, err);
        return null;
    }
};