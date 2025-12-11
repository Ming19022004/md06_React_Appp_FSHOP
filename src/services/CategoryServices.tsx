import API from '../api';

export const fetchCategories = async () => {
    try {
        const res = await API.get('/categories/active');
        return res.data || [];
    } catch (err) {
        console.error('❌ Lỗi lấy danh mục', err);
        return [];
    }
};
