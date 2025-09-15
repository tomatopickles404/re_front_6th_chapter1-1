import { productStore } from "../stores/productStore.js";
import { cartStore } from "../stores/cartStore.js";
import { router } from "../main.js";

export const eventService = {
  setupGlobalEventDelegation() {
    // 전역 클릭 이벤트 위임
    document.addEventListener("click", this.handleGlobalClick.bind(this));
    // 전역 변경 이벤트 위임
    document.addEventListener("change", this.handleGlobalChange.bind(this));
    // 전역 키보드 이벤트 위임
    document.addEventListener("keydown", this.handleGlobalKeydown.bind(this));
  },

  handleGlobalClick(e) {
    // 장바구니 추가 버튼
    if (e.target.matches(".add-to-cart-btn")) {
      e.preventDefault();
      const productId = e.target.dataset.productId;
      const productCard = e.target.closest(".product-card");

      if (productCard) {
        const product = {
          productId,
          title: productCard.querySelector("h3").textContent,
          brand: productCard.querySelector("p").textContent,
          image: productCard.querySelector("img").src,
          lprice: parseInt(productCard.querySelector(".text-lg").textContent.replace(/[^0-9]/g, "")),
        };

        cartStore.addToCart(product);
      }
    }

    // 재시도 버튼
    if (e.target.matches("#retry-button")) {
      productStore.fetchProducts();
    }

    // 카테고리 필터 버튼 (미래 기능 준비)
    if (e.target.matches(".category1-filter-btn")) {
      const category1 = e.target.dataset.category1;
      productStore.updateFilters({ category1 });
    }

    // 브레드크럼 리셋 (미래 기능 준비)
    if (e.target.matches('[data-breadcrumb="reset"]')) {
      productStore.updateFilters({ category1: "", category2: "" });
    }
  },

  handleGlobalChange(e) {
    // 검색 입력
    if (e.target.matches("#search-input")) {
      productStore.state.filters.search = e.target.value.trim();
    }

    // 페이지당 상품 수 선택
    if (e.target.matches("#limit-select")) {
      productStore.updateFilters({ limit: Number(e.target.value) });
    }

    // 정렬 선택
    if (e.target.matches("#sort-select")) {
      productStore.updateFilters({ sort: e.target.value });
    }
  },

  handleGlobalKeydown(e) {
    // 검색창에서 Enter 키
    if (e.target.matches("#search-input") && e.key === "Enter") {
      e.preventDefault();
      productStore.updateFilters({ search: productStore.state.filters.search });
    }

    // ESC 키로 모달 닫기 (미래 기능 준비)
    if (e.key === "Escape") {
      // modalService.close() - 미래에 구현
    }
  },

  handleProductImageClick(e) {
    const productId = e.target.dataset.productId;
    router.navigateTo(`/product/${productId}`);
  },
};
