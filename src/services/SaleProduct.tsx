// import API from "../api";
//
// export const fetchSaleProducts = async () => {
//     try {
//         const res = await API.get('/sale-products');
//         return res.data || [];
//     } catch (err) {
//         console.error('❌ Lỗi lấy sản phẩm khuyến mãi', err);
//         return [];
//     }
// };
// // lấy tất cả sản phẩm khuyến mãi (có isDiscount = true)
// export const fetDiscountProducts = async () => {
//     try{
//         const res = await API.get('/sale-products');
//         //console.log('Kết quả API /sale-products:', res.data);
//
//         const products = res.data.data;// đây mới là mang sản phẩm
//
//         if (!Array.isArray(products)){
//             throw new Error('API không trả về danh sách sản phẩm hợp lệ ');
//         }
//
//         //lọc sản phẩm có isDiscount = true
//         const discountProducts = products.filter(
//             (product: any) => product.isDiscount === true
//         );
//
//         return discountProducts;
//     }catch (error){
//         console.error('Lỗi khi lấy sản phẩm khuyến mãi:',error);
//         return [];
//     }
// };