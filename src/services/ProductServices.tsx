import API from "../api";

export const fetchAllProducts = async () => {
    try {
        const res = await API.get('/products/active');
        const allProducts = res.data; 
        const filteredProducts = Array.isArray(allProducts) ? allProducts.filter((item: any) => {
            return !item.isHidden && item.status !== 'inactive';
        }) : [];
        return filteredProducts; 
    } catch (err) {
        console.error('❌ Lỗi lấy sản phẩm', err);
        return [];
    }
};

export const fetchProductById = async (id: string) => {
    try {
        const res = await API.get(`/products/${id}`);
        return res.data;
    } catch (err) {
        console.error(`❌ Lỗi lấy sản phẩm ${id}`, err);
        return null;
    }
};