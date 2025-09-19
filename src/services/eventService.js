import { addEvent } from "../utils/event.js";
import { productStore } from "../stores/productStore.js";
import { cartStore } from "../stores/cartStore.js";
import { router } from "../router/index.js";
import { openCartModal, closeCartModal, renderCartModal } from "../components/CartModal.js";

export function registerProductEvents() {
  // 검색 입력 (실시간)
  addEvent("input", "#search-input", (e) => {
    productStore.state.filters.search = e.target.value.trim();
  });

  // 검색 입력 (Enter 키)
  addEvent("keydown", "#search-input", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      productStore.updateFilters({ search: productStore.state.filters.search });
    }
  });

  // 페이지당 상품 수 변경
  addEvent("change", "#limit-select", (e) => {
    productStore.updateFilters({ limit: Number(e.target.value) });
  });

  // 정렬 변경
  addEvent("change", "#sort-select", (e) => {
    productStore.updateFilters({ sort: e.target.value });
  });

  // 재시도 버튼
  addEvent("click", "#retry-button", () => {
    productStore.fetchProducts();
  });

  // 카테고리 필터 버튼 (1차)
  addEvent("click", ".category1-filter-btn", (e) => {
    e.preventDefault();
    const category1 = e.target.getAttribute("data-category1");
    productStore.updateFilters({ category1, category2: "" });
  });

  // 카테고리 필터 버튼 (2차)
  addEvent("click", ".category2-filter-btn", (e) => {
    e.preventDefault();
    const category2 = e.target.getAttribute("data-category2");
    productStore.updateFilters({ category2 });
  });

  // 브레드크럼 리셋
  addEvent("click", "[data-breadcrumb='reset']", (e) => {
    e.preventDefault();
    productStore.updateFilters({ category1: "", category2: "" });
  });

  // 브레드크럼 카테고리 1
  addEvent("click", "[data-breadcrumb='category1']", (e) => {
    e.preventDefault();
    const category1 = e.target.textContent;
    productStore.updateFilters({ category1, category2: "" });
  });

  // 브레드크럼 카테고리 2
  addEvent("click", "[data-breadcrumb='category2']", (e) => {
    e.preventDefault();
    const category2 = e.target.textContent;
    productStore.updateFilters({ category2 });
  });

  // 상품 클릭 (이미지, 정보 영역)
  addEvent("click", ".product-image, .product-info", (e) => {
    console.log("상품 클릭 이벤트 발생:", e.target);
    e.preventDefault();

    // closest를 사용해서 .product-image 또는 .product-info 요소 찾기
    const targetElement = e.target.closest(".product-image, .product-info");
    const productId = targetElement?.dataset.productId;

    console.log("찾은 요소:", targetElement);
    console.log("상품 ID:", productId);

    if (!productId) {
      console.error("상품 ID를 찾을 수 없습니다");
      return;
    }

    const currentParams = new URLSearchParams(window.location.search);
    const sort = currentParams.get("sort");
    const queryString = sort ? `?sort=${sort}` : "";
    const targetPath = `/product/${productId}${queryString}`;
    console.log("이동할 경로:", targetPath);
    router.navigateTo(targetPath);
  });
}

export function registerHeaderEvents() {
  // 장바구니 아이콘 클릭
  addEvent("click", "#cart-icon-btn", () => {
    openCartModal();
  });
}

export function registerCartEvents() {
  // 장바구니 추가
  addEvent("click", ".add-to-cart-btn", (e) => {
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
        quantity: 1,
      };
      cartStore.addToCart(product);
    }
  });
}

export function registerCartModalEvents() {
  // 모달 닫기 버튼
  addEvent("click", "#cart-modal-close-btn", () => {
    closeCartModal();
  });

  // 배경 클릭으로 모달 닫기
  addEvent("click", ".cart-modal-overlay", (e) => {
    if (e.target.classList.contains("cart-modal-overlay")) {
      closeCartModal();
    }
  });

  // ESC 키로 모달 닫기
  addEvent("keydown", "body", (e) => {
    if (e.key === "Escape" && document.querySelector(".cart-modal-overlay")) {
      closeCartModal();
    }
  });

  // 전체 선택 체크박스
  addEvent("change", "#cart-modal-select-all-checkbox", (e) => {
    const checkboxes = document.querySelectorAll(".cart-item-checkbox");
    checkboxes.forEach((checkbox) => {
      checkbox.checked = e.target.checked;
    });
  });

  // 개별 상품 체크박스
  addEvent("change", ".cart-item-checkbox", () => {
    updateSelectAllCheckbox();
  });

  // 수량 증가 버튼
  addEvent("click", ".quantity-increase-btn", (e) => {
    const productId = e.target.dataset.productId;
    const item = cartStore.state.items.find((item) => item.productId === productId);
    if (item) {
      cartStore.updateQuantity(productId, item.quantity + 1);
      refreshCartModal();
    }
  });

  // 수량 감소 버튼
  addEvent("click", ".quantity-decrease-btn", (e) => {
    const productId = e.target.dataset.productId;
    const item = cartStore.state.items.find((item) => item.productId === productId);
    if (item && item.quantity > 1) {
      cartStore.updateQuantity(productId, item.quantity - 1);
      refreshCartModal();
    }
  });

  // 수량 입력 필드
  addEvent("change", ".quantity-input", (e) => {
    const productId = e.target.dataset.productId;
    const quantity = parseInt(e.target.value) || 1;
    cartStore.updateQuantity(productId, quantity);
    refreshCartModal();
  });

  // 삭제 버튼
  addEvent("click", ".cart-item-remove-btn", (e) => {
    const productId = e.target.dataset.productId;
    cartStore.removeFromCart(productId);
    refreshCartModal();
  });

  // 전체 비우기 버튼
  addEvent("click", "#cart-modal-clear-cart-btn", () => {
    cartStore.clearCart();
    closeCartModal();
  });

  // 구매하기 버튼
  addEvent("click", "#cart-modal-checkout-btn", () => {
    // 구매 로직 구현 (현재는 모달만 닫기)
    closeCartModal();
  });
}

// 헬퍼 함수들
function updateSelectAllCheckbox() {
  const checkboxes = document.querySelectorAll(".cart-item-checkbox");
  const selectAllCheckbox = document.querySelector("#cart-modal-select-all-checkbox");

  if (checkboxes.length === 0) return;

  const allChecked = Array.from(checkboxes).every((checkbox) => checkbox.checked);
  const someChecked = Array.from(checkboxes).some((checkbox) => checkbox.checked);

  selectAllCheckbox.checked = allChecked;
  selectAllCheckbox.indeterminate = someChecked && !allChecked;
}

function refreshCartModal() {
  setTimeout(() => renderCartModal(), 0);
}

export function registerAllEvents() {
  console.log("이벤트 등록 시작");
  registerProductEvents();
  registerHeaderEvents();
  registerCartEvents();
  registerCartModalEvents();
  console.log("이벤트 등록 완료");
}
