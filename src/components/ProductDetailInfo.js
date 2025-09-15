export function ProductDetailInfo(product, rating, reviewCount) {
  return /* HTML */ `
    <div class="bg-white rounded-lg shadow-sm mb-6">
      <!-- 상품 이미지 -->
      <div class="p-4">
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover product-detail-image" />
        </div>
        <!-- 상품 정보 -->
        <div>
          <p class="text-sm text-gray-600 mb-1">${product.brand || ""}</p>
          <h1 class="text-xl font-bold text-gray-900 mb-3">${product.title}</h1>
          <!-- 평점 및 리뷰 -->
          <div class="flex items-center mb-3">
            <div class="flex items-center">
              ${Array.from({ length: 5 }, (_, i) => {
                const isFilled = i < Math.floor(rating);
                const isHalf = i === Math.floor(rating) && rating % 1 > 0;
                const color = isFilled || isHalf ? "text-yellow-400" : "text-gray-300";
                return `<svg class="w-4 h-4 ${color}" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>`;
              }).join("")}
            </div>
            <span class="ml-2 text-sm text-gray-600"
              >${rating ?? 0} (${reviewCount?.toLocaleString() ?? 0}개 리뷰)</span
            >
          </div>
          <!-- 가격 -->
          <div class="mb-4">
            <span class="text-2xl font-bold text-blue-600">${Number(product.lprice)?.toLocaleString()}원</span>
          </div>
          <!-- 재고 -->
          <div class="text-sm text-gray-600 mb-4">재고 ${product?.stock?.toLocaleString()}개</div>
          <!-- 설명 -->
          <div class="text-sm text-gray-700 leading-relaxed mb-6">
            ${product?.description || product?.title}에 대한 상세 설명입니다. 브랜드의 우수한 품질을 자랑하는 상품으로,
            고객 만족도가 높은 제품입니다.
          </div>
        </div>
      </div>
    </div>
  `;
}
