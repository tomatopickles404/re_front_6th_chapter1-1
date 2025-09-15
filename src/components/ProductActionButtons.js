export function ProductActionButtons(product) {
  return /* HTML */ `
    <!-- 액션 버튼 -->
    <div class="p-4">
      <button
        id="add-to-cart-btn"
        data-product-id="${product.productId}"
        class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
      >
        장바구니 담기
      </button>
    </div>

    <!-- 상품 목록으로 이동 -->
    <div class="mb-6">
      <button
        class="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors go-to-product-list"
      >
        상품 목록으로 돌아가기
      </button>
    </div>
  `;
}
