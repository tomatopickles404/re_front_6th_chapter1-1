import { cartStore } from "../stores/cartStore.js";
import { Footer } from "../components/Footer.js";
import { ProductDetailHeader, setupProductDetailHeaderEventListeners } from "../components/ProductDetailHeader.js";
import { ProductDetailBreadcrumb } from "../components/ProductDetailBreadcrumb.js";
import { ProductDetailInfo } from "../components/ProductDetailInfo.js";
import { ProductQuantitySelector } from "../components/ProductQuantitySelector.js";
import { ProductActionButtons } from "../components/ProductActionButtons.js";
import { RelatedProducts } from "../components/RelatedProducts.js";
import { productDetailStore } from "../stores/productDetailStore.js";

function renderLoading() {
  return /* HTML */ `
    <div class="min-h-screen bg-gray-50">
      ${ProductDetailHeader()}
      <main class="max-w-md mx-auto px-4 py-4">
        <div class="py-20 bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">상품 정보를 불러오는 중...</p>
          </div>
        </div>
      </main>
      ${Footer()}
    </div>
  `;
}

export function ProductDetailPage() {
  const { product, relatedProducts, quantity, isLoading, relatedProductsLoading, error, reviewCount, rating } =
    productDetailStore.state;

  if (isLoading) {
    return renderLoading();
  }

  if (error || !product) {
    return /* HTML */ `
      <div class="min-h-screen bg-gray-50">
        <div class="text-center py-10">
          <p class="text-red-500 mb-4">상품을 불러오는데 실패했습니다.</p>
          <button onclick="window.history.back()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            뒤로 가기
          </button>
        </div>
      </div>
    `;
  }

  return /* HTML */ `
    <div class="min-h-screen bg-gray-50">
      ${ProductDetailHeader()}
      <main class="max-w-md mx-auto px-4 py-4">
        ${ProductDetailBreadcrumb(product)} ${ProductDetailInfo(product, rating, reviewCount)}
        ${ProductQuantitySelector(product, quantity)} ${ProductActionButtons(product)}
        ${RelatedProducts(relatedProducts, relatedProductsLoading)}
      </main>
      ${Footer()}
    </div>
  `;
}

export function initializeProductDetailPage() {
  // 장바구니 데이터 로드
  cartStore.loadFromLocalStorage();

  // URL에서 productId 추출 (window.routeParams 사용)
  const productId = window.routeParams?.productId;

  if (productId) {
    // 렌더링 콜백 설정
    productDetailStore.render = render;
    productDetailStore.fetchProductDetail(productId);
  } else {
    console.error("Product ID not found in route params");
  }

  // 이벤트 리스너는 render 함수에서 설정됨
}

function setupEventListeners() {
  // ProductDetailHeader 이벤트 리스너 설정
  setupProductDetailHeaderEventListeners();

  // 기존 이벤트 리스너 제거 (중복 방지)
  const existingListener = document._productDetailListener;
  if (existingListener) {
    document.removeEventListener("click", existingListener);
  }

  // 새로운 이벤트 리스너 생성
  const clickListener = (e) => {
    // 수량 증가 버튼
    if (e.target.closest("#quantity-increase")) {
      productDetailStore.increaseQuantity();
      // DOM 업데이트 확인
      const quantityInput = document.querySelector("#quantity-input");
      if (quantityInput) {
        quantityInput.value = productDetailStore.state.quantity;
      }
    }

    // 수량 감소 버튼
    if (e.target.closest("#quantity-decrease")) {
      productDetailStore.decreaseQuantity();
      // DOM 업데이트 확인
      const quantityInput = document.querySelector("#quantity-input");
      if (quantityInput) {
        quantityInput.value = productDetailStore.state.quantity;
      }
    }

    // 장바구니 담기 버튼
    if (e.target.closest("#add-to-cart-btn")) {
      productDetailStore.addToCart();
    }

    // 관련 상품 클릭
    if (e.target.closest(".related-product-card")) {
      const card = e.target.closest(".related-product-card");
      const productId = card.dataset.productId;
      window.history.pushState({}, "", `/product/${productId}`);
      window.dispatchEvent(new Event("popstate"));
    }

    // 상품 목록으로 돌아가기 버튼
    if (e.target.closest(".go-to-product-list")) {
      // 현재 정렬 상태를 URL에 포함
      const currentParams = new URLSearchParams(window.location.search);
      const sort = currentParams.get("sort");
      const queryString = sort ? `?sort=${sort}` : "";

      window.history.pushState({}, "", `/${queryString}`);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  // 이벤트 리스너 등록
  document.addEventListener("click", clickListener);
  document._productDetailListener = clickListener;

  // input의 value 관력 이벤트는 직접 바인딩 (이벤트 위임이 어려움)
  const quantityInput = document.querySelector("#quantity-input");
  if (quantityInput) {
    // 기존 이벤트 리스너 제거 (중복 방지)
    const newQuantityInput = quantityInput.cloneNode(true);
    quantityInput.parentNode.replaceChild(newQuantityInput, quantityInput);

    // 새로운 이벤트 리스너 추가
    newQuantityInput.addEventListener("change", (e) => {
      productDetailStore.updateQuantity(e.target.value);
    });

    newQuantityInput.addEventListener("blur", (e) => {
      productDetailStore.updateQuantity(e.target.value);
    });

    newQuantityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        productDetailStore.updateQuantity(e.target.value);
        e.target.blur();
      }
    });
  }
}

function render() {
  document.getElementById("root").innerHTML = ProductDetailPage();

  // DOM이 완전히 렌더링된 후에 이벤트 리스너 설정
  setTimeout(() => {
    setupEventListeners();
  }, 0);
}
