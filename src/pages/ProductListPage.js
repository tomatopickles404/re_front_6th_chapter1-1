import { createInfiniteScrollObserver } from "../utils/createInfiniteScrollObserver.js";
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

function render() {
  document.getElementById("root").innerHTML = ProductListPage();
  setupInfiniteScrollObserver();
}
