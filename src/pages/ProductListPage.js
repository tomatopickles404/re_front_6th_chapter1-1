import { createInfiniteScrollObserver } from "../utils/createInfiniteScrollObserver.js";
import { setupHeaderEventListeners } from "../components/Header.js";
import { isTestEnvironment } from "../utils/isTestEnvironment.js";
import { productStore } from "../stores/productStore.js";
import { cartStore } from "../stores/cartStore.js";
import { Header } from "../components/Header.js";
import { Footer } from "../components/Footer.js";
import { ProductGrid } from "../components/ProductGrid.js";
import { Filters } from "../components/Filters.js";

let infiniteScrollObserverInstance = null;

// 테스트 환경에서 상태를 초기화하는 함수
export function resetState() {
  productStore.reset();
  cartStore.reset();

  if (infiniteScrollObserverInstance) {
    infiniteScrollObserverInstance.destroy();
    infiniteScrollObserverInstance = null;
  }
}

// 테스트 환경에서 전역 함수로 노출
if (isTestEnvironment()) {
  window.__TEST_STATE_RESET__ = resetState;
  window.__TEST_CART_STATE__ = cartStore;
  window.__TEST_SHOW_TOAST__ = (message, type) => {
    import("../services/toastService.js").then(({ toastService }) => {
      toastService.show(message, type);
    });
  };
}

const setupInfiniteScrollObserver = () => {
  // 이미 인스턴스가 존재하면 다시 생성하지 않음 (단 한 번만 초기화)
  if (!infiniteScrollObserverInstance) {
    infiniteScrollObserverInstance = createInfiniteScrollObserver(productStore.updateFetchProducts.bind(productStore), {
      getIsLoading: () => productStore.state.isLoading,
      hasMore: () => productStore.state.products.length < productStore.state.totalCount,
    });
  }
  // init 호출: 초기 또는 DOM 변경 시 트리거 요소 관찰 시작
  infiniteScrollObserverInstance.init();
};

export function ProductListPage() {
  const { isLoading, filters, products, error, totalCount } = productStore.state;

  return /* HTML */ `
    <div class="min-h-screen bg-gray-50">
      ${Header()}
      <main class="max-w-md mx-auto px-4 py-4">
        ${Filters({ isLoading, filters })}
        <div class="mb-6">${ProductGrid({ isLoading, products, error, totalCount, limit: filters.limit })}</div>
      </main>
      <!-- 무한 스크롤 트리거 -->
      <div class="infinite-scroll-trigger"></div>
      ${Footer()}
    </div>
  `;
}

export function initializeProductListPage() {
  // 세션스토리지에서 장바구니 데이터 로드
  cartStore.loadFromLocalStorage();

  // URL 파라미터에서 초기 상태 복원
  productStore.initializeFromURL();

  // 렌더링 콜백 설정
  productStore.render = render;

  render();
  setupInfiniteScrollObserver();
  productStore.fetchProducts();
  cartStore.updateCartBadge();
}

function setupEventListeners() {
  const { error, filters } = productStore.state;

  if (error) {
    document.querySelector("#retry-button")?.addEventListener("click", () => productStore.fetchProducts());
  }

  // Header 이벤트 리스너 설정
  setupHeaderEventListeners();

  const searchInput = document.querySelector("#search-input");
  const performSearch = () => {
    filters.page = 1;
    productStore.updateFilters({ search: filters.search });
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filters.search = e.target.value.trim();
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });
  }

  document.querySelector("#limit-select")?.addEventListener("change", (e) => {
    productStore.updateFilters({ limit: Number(e.target.value) });
  });

  document.querySelector("#sort-select")?.addEventListener("change", (e) => {
    productStore.updateFilters({ sort: e.target.value });
  });

  // 카테고리 필터 버튼 클릭 이벤트
  document.querySelectorAll(".category1-filter-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const category1 = button.getAttribute("data-category1");
      productStore.updateFilters({ category1, category2: "" });
    });
  });

  // 2차 카테고리 필터 버튼 클릭 이벤트
  document.querySelectorAll(".category2-filter-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const category2 = button.getAttribute("data-category2");
      productStore.updateFilters({ category2 });
    });
  });

  // 전체 카테고리 리셋 버튼 클릭 이벤트
  document.querySelector("[data-breadcrumb='reset']")?.addEventListener("click", (e) => {
    e.preventDefault();
    productStore.updateFilters({ category1: "", category2: "" });
  });

  // 브레드크럼 카테고리 클릭 이벤트
  document.querySelector("[data-breadcrumb='category1']")?.addEventListener("click", (e) => {
    e.preventDefault();
    const category1 = e.target.textContent;
    productStore.updateFilters({ category1, category2: "" });
  });

  document.querySelector("[data-breadcrumb='category2']")?.addEventListener("click", (e) => {
    e.preventDefault();
    const category2 = e.target.textContent;
    productStore.updateFilters({ category2 });
  });

  // 장바구니 버튼 클릭 이벤트
  document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = button.getAttribute("data-product-id");
      const productCard = button.closest(".product-card");
      const product = {
        productId,
        title: productCard.querySelector("h3").textContent,
        brand: productCard.querySelector("p").textContent,
        image: productCard.querySelector("img").src,
        lprice: parseInt(productCard.querySelector(".text-lg").textContent.replace(/[^0-9]/g, "")),
        quantity: 1,
      };
      cartStore.addToCart(product);
    });
  });

  // 상품 클릭 이벤트 (이미지, 정보 영역)
  document.querySelectorAll(".product-image, .product-info").forEach((element) => {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = element.dataset.productId;

      // 현재 정렬 상태를 URL에 포함
      const currentParams = new URLSearchParams(window.location.search);
      const sort = currentParams.get("sort");
      const queryString = sort ? `?sort=${sort}` : "";

      // SPA 방식으로 상세 페이지로 이동
      window.history.pushState({}, "", `/product/${productId}${queryString}`);
      window.dispatchEvent(new Event("popstate"));
    });
  });
}

function render() {
  document.getElementById("root").innerHTML = ProductListPage();
  setupEventListeners();
  setupInfiniteScrollObserver();
}
