import { getProducts, getProduct } from "../api/productApi.js";
import { isTestEnvironment } from "../utils/isTestEnvironment.js";
import { cartStore } from "./cartStore.js";

const MAX_STOCK = Number.MAX_SAFE_INTEGER;

export const productDetailStore = {
  state: {
    product: null,
    relatedProducts: [],
    quantity: 1,
    isLoading: true,
    relatedProductsLoading: false,
    error: null,
    reviewCount: 0,
    rating: 0,
  },

  async fetchProductDetail(productId) {
    this.state.isLoading = true;
    this.state.error = null;
    this.state.relatedProducts = []; // 관련 상품 초기화
    this.state.quantity = 1; // 수량 초기화
    this.state.reviewCount = 0;
    this.state.rating = 0;

    if (!isTestEnvironment()) {
      this.render();
    }

    try {
      // 개별 상품 API 사용
      const product = await getProduct(productId);
      this.state.product = product;
      this.state.reviewCount = product?.reviewCount ?? 0;
      this.state.rating = product?.rating ?? 0;

      if (!this.state.product) {
        throw new Error("상품을 찾을 수 없습니다.");
      }

      // 관련 상품 로딩
      this.loadRelatedProducts();
    } catch (err) {
      console.error("Failed to fetch product detail:", err);
      this.state.error = err;
    } finally {
      this.state.isLoading = false;
      this.render();
    }
  },

  async loadRelatedProducts() {
    this.state.relatedProductsLoading = true;
    this.render(); // 로딩 상태 표시

    try {
      // 관련 상품만 효율적으로 가져오기 (같은 카테고리 기준)
      const data = await getProducts({
        category2: this.state.product.category2,
        limit: 20,
      });

      this.state.relatedProducts = data.products
        .filter((p) => p.productId !== this.state.product.productId)
        .slice(0, 19); // 19개만
    } catch (err) {
      console.error("Failed to load related products:", err);
    } finally {
      this.state.relatedProductsLoading = false;
      this.render();
    }
  },

  increaseQuantity() {
    const maxStock = this.state.product?.stock;
    this.state.quantity = Math.min(this.state.quantity + 1, maxStock || MAX_STOCK);

    // DOM 업데이트를 즉시 반영
    this.updateQuantityInput();
  },

  decreaseQuantity() {
    this.state.quantity = Math.max(this.state.quantity - 1, 1);

    // DOM 업데이트를 즉시 반영
    this.updateQuantityInput();
  },

  updateQuantity(newQuantity) {
    // 빈 문자열이나 유효하지 않은 값 처리
    if (!newQuantity || newQuantity === "" || isNaN(newQuantity)) {
      this.state.quantity = 1;
      const quantityInput = document.querySelector("#quantity-input");
      if (quantityInput) {
        quantityInput.value = this.state.quantity;
      }
      return;
    }

    // 입력값을 숫자로 변환하고 범위 제한
    const quantity = parseInt(newQuantity);
    const maxStock = this.state.product?.stock;
    const newQuantityValue = Math.max(1, Math.min(quantity, maxStock || MAX_STOCK));

    // 값이 실제로 변경된 경우에만 업데이트
    if (this.state.quantity !== newQuantityValue) {
      this.state.quantity = newQuantityValue;

      const quantityInput = document.querySelector("#quantity-input");
      if (quantityInput) {
        quantityInput.value = this.state.quantity;
      }
    }
  },

  updateQuantityInput() {
    const quantityInput = document.querySelector("#quantity-input");
    if (quantityInput) {
      quantityInput.value = this.state.quantity;
      // 강제로 DOM 업데이트 트리거
      quantityInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
  },

  addToCart() {
    if (this.state.product) {
      const productWithQuantity = {
        ...this.state.product,
        quantity: this.state.quantity,
      };
      cartStore.addToCart(productWithQuantity);
    }
  },

  reset() {
    this.state.product = null;
    this.state.relatedProducts = [];
    this.state.quantity = 1;
    this.state.isLoading = true;
    this.state.relatedProductsLoading = false;
    this.state.error = null;
  },

  // 렌더링 콜백 (외부에서 주입)
  render: null,
};

window.productDetailStore = productDetailStore;

// 테스트 환경에서 전역 함수로 노출
if (isTestEnvironment()) {
  window.__TEST_PRODUCT_DETAIL_STATE__ = productDetailStore;
}
