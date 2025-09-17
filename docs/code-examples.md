# 코드 예시 문서

## 📝 리팩토링 전후 코드 비교

이 문서는 리팩토링 전후의 주요 코드 변경사항을 구체적인 예시로 보여줍니다.

---

## 1. 상수 관리 개선

### Before: 매직 넘버 사용

```javascript
// src/stores/productStore.js
export const productStore = {
  state: {
    filters: {
      page: 1, // 매직 넘버
      limit: 20, // 매직 넘버
      sort: "price_asc", // 하드코딩된 문자열
    },
  },
  // ...
};

// src/stores/cartStore.js
export const cartStore = {
  saveToLocalStorage() {
    localStorage.setItem("shopping_cart", JSON.stringify(this.state.items)); // 매직 문자열
  },
  // ...
};

// src/services/toastService.js
export const toastService = {
  show(message, type = "success") {
    // 3초 후 자동 제거 - 매직 넘버
    const autoRemoveTimer = setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  },
};
```

### After: 의미 있는 상수 사용

```javascript
// src/constants/index.js
export const PRODUCT = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT: "price_asc",
  DEFAULT_PAGE: 1,
};

export const UI = {
  TOAST_AUTO_REMOVE_DELAY_MS: 3000,
  ANIMATION_DURATION_MS: 300,
};

export const STORAGE_KEYS = {
  CART: "shopping_cart",
};

// src/stores/productStore.js
import { PRODUCT } from "../constants/index.js";

export const productStore = {
  state: {
    filters: {
      page: PRODUCT.DEFAULT_PAGE,
      limit: PRODUCT.DEFAULT_LIMIT,
      sort: PRODUCT.DEFAULT_SORT,
    },
  },
  // ...
};

// src/stores/cartStore.js
import { STORAGE_KEYS } from "../constants/index.js";

export const cartStore = {
  saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.state.items));
  },
  // ...
};

// src/services/toastService.js
import { UI } from "../constants/index.js";

export const toastService = {
  show(message, type = "success") {
    const autoRemoveTimer = setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, UI.TOAST_AUTO_REMOVE_DELAY_MS);
  },
};
```

---

## 2. 전역 상태 제거

### Before: 전역 변수 사용

```javascript
// src/router/index.js
const router = () => {
  const path = getAppPath(window.location.pathname);
  const match = matchRoute(path);

  if (match) {
    const { route, params } = match;

    // 전역 파라미터 설정 - 문제점!
    window.routeParams = params;

    document.getElementById("root").innerHTML = route.component();
    // ...
  }
};

// src/pages/ProductDetailPage.js
export function initializeProductDetailPage() {
  // URL에서 productId 추출 - 전역 변수 의존!
  const productId = window.routeParams?.productId;

  if (productId) {
    productDetailStore.fetchProductDetail(productId);
  }
}

// src/utils/EventBus.js
export const eventBus = new EventBus();

// 전역으로 노출 - 문제점!
if (typeof window !== "undefined") {
  window.eventBus = eventBus;
}
```

### After: 서비스 기반 상태 관리

```javascript
// src/services/routeContextService.js
class RouteContextService {
  constructor() {
    this.currentParams = {};
    this.currentPath = "";
    this.subscribers = new Map();
  }

  setRouteContext(path, params = {}) {
    this.currentPath = path;
    this.currentParams = { ...params };

    // 구독자들에게 알림
    this.notifySubscribers(EVENT_TYPES.ROUTE_CHANGED, {
      current: { path: this.currentPath, params: this.currentParams },
    });
  }

  getParam(key) {
    return this.currentParams[key];
  }

  subscribe(callback) {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }
}

export const routeContextService = new RouteContextService();

// src/router/index.js
import { routeContextService } from "../services/routeContextService.js";

const router = () => {
  const path = getAppPath(window.location.pathname);
  const match = matchRoute(path);

  if (match) {
    const { route, params } = match;

    // 라우트 컨텍스트 서비스를 통한 파라미터 설정
    routeContextService.setRouteContext(path, params);

    document.getElementById("root").innerHTML = route.component();
    // ...
  }
};

// src/pages/ProductDetailPage.js
import { routeContextService } from "../services/routeContextService.js";

export function initializeProductDetailPage() {
  // 라우트 컨텍스트 서비스에서 productId 추출
  const productId = routeContextService.getParam("productId");

  if (productId) {
    productDetailStore.fetchProductDetail(productId);
  }
}

// src/utils/EventBus.js
export const eventBus = new EventBus();

// 전역 노출 제거 - 의존성 주입 방식으로 변경
```

---

## 3. Store 간 결합도 개선

### Before: 직접 참조

```javascript
// src/pages/ProductListPage.js
import { productStore } from "../stores/productStore.js";
import { cartStore } from "../stores/cartStore.js";

export function ProductListPage() {
  const { isLoading, filters, products, error, totalCount } = productStore.state;

  return /* HTML */ `
    <div class="min-h-screen bg-gray-50">
      ${Header()}
      <main class="max-w-md mx-auto px-4 py-4">
        ${Filters({ isLoading, filters })}
        <div class="mb-6">${ProductGrid({ isLoading, products, error, totalCount, limit: filters.limit })}</div>
      </main>
    </div>
  `;
}

// src/components/Header.js
import { cartStore } from "../stores/cartStore.js";

export function Header() {
  return /* HTML */ `
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-md mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" data-link="">쇼핑몰</a>
          </h1>
          <div class="flex items-center space-x-2">
            <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
              <!-- 장바구니 아이콘 -->
              ${cartStore.getCartCount() > 0
                ? `
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  ${cartStore.getCartCount()}
                </span>
              `
                : ""}
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

// src/stores/cartStore.js
export const cartStore = {
  addToCart(product) {
    const existingItem = this.state.items.find((item) => item.productId === product.productId);
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      this.state.items.push({ ...product, quantity: product.quantity || 1 });
    }
    this.saveToLocalStorage();
    this.updateCartBadge();
    toastService.show("장바구니에 추가되었습니다", "success");
  },
  // ...
};
```

### After: 이벤트 기반 통신

```javascript
// src/services/storeEventService.js
class StoreEventService {
  constructor() {
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    eventBus.on(EVENT_TYPES.CART_ADDED, this.handleCartAdded.bind(this));
    eventBus.on(EVENT_TYPES.CART_REMOVED, this.handleCartRemoved.bind(this));
    eventBus.on(EVENT_TYPES.CART_CLEARED, this.handleCartCleared.bind(this));
  }

  emitCartAdded(product) {
    eventBus.emit(EVENT_TYPES.CART_ADDED, product);
  }

  emitCartRemoved(product) {
    eventBus.emit(EVENT_TYPES.CART_REMOVED, product);
  }

  emitCartCleared() {
    eventBus.emit(EVENT_TYPES.CART_CLEARED);
  }
}

export const storeEventService = new StoreEventService();

// src/stores/cartStore.js
import { storeEventService } from "../services/storeEventService.js";

export const cartStore = {
  addToCart(product) {
    const existingItem = this.state.items.find((item) => item.productId === product.productId);
    if (existingItem) {
      existingItem.quantity += product.quantity || 1;
    } else {
      this.state.items.push({ ...product, quantity: product.quantity || 1 });
    }
    this.saveToLocalStorage();
    this.updateCartBadge();
    toastService.show("장바구니에 추가되었습니다", "success");

    // 이벤트 발행으로 다른 Store들에게 알림
    storeEventService.emitCartAdded(product);
  },

  removeFromCart(productId) {
    const item = this.state.items.find((item) => item.productId === productId);
    this.state.items = this.state.items.filter((item) => item.productId !== productId);
    this.saveToLocalStorage();
    this.updateCartBadge();
    if (item) {
      toastService.show(`${item.title}이(가) 장바구니에서 삭제되었습니다`, "info");
      // 이벤트 발행으로 다른 Store들에게 알림
      storeEventService.emitCartRemoved(item);
    }
  },
  // ...
};

// src/services/storeProvider.js
class StoreProvider {
  constructor() {
    this.subscribers = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on(EVENT_TYPES.CART_ADDED, this.handleCartChange.bind(this));
    eventBus.on(EVENT_TYPES.CART_REMOVED, this.handleCartChange.bind(this));
    eventBus.on(EVENT_TYPES.CART_CLEARED, this.handleCartChange.bind(this));
  }

  subscribe(storeType, callback) {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, { storeType, callback });
    return () => this.subscribers.delete(id);
  }

  getCartCount() {
    return new Promise((resolve) => {
      const unsubscribe = eventBus.on("cart:countRequested", (count) => {
        unsubscribe();
        resolve(count);
      });
      eventBus.emit("cart:requestCount");
    });
  }
}

export const storeProvider = new StoreProvider();
```

---

## 4. 이벤트 타입 정의

### Before: 하드코딩된 이벤트명

```javascript
// 여러 파일에서 하드코딩된 이벤트명 사용
eventBus.emit("cart:added", product);
eventBus.emit("cart:removed", product);
eventBus.emit("product:filterChanged", filters);

// 문제점: 오타 가능성, 일관성 부족
```

### After: 중앙화된 이벤트 타입

```javascript
// src/constants/index.js
export const EVENT_TYPES = {
  CART_ADDED: "cart:added",
  CART_REMOVED: "cart:removed",
  CART_CLEARED: "cart:cleared",
  PRODUCT_FILTER_CHANGED: "product:filterChanged",
  PRODUCT_LOADED: "product:loaded",
  ROUTE_CHANGED: "route:changed",
};

// 사용 예시
import { EVENT_TYPES } from "../constants/index.js";

eventBus.emit(EVENT_TYPES.CART_ADDED, product);
eventBus.emit(EVENT_TYPES.CART_REMOVED, product);
eventBus.emit(EVENT_TYPES.PRODUCT_FILTER_CHANGED, filters);

// 장점: 오타 방지, 자동완성 지원, 일관성 보장
```

---

## 5. 라우트 관리 개선

### Before: 전역 변수 의존

```javascript
// src/pages/ProductDetailPage.js
export function initializeProductDetailPage() {
  // 전역 변수에 의존 - 문제점!
  const productId = window.routeParams?.productId;

  if (productId) {
    productDetailStore.fetchProductDetail(productId);
  } else {
    console.error("Product ID not found in route params");
  }
}

// 문제점:
// - 전역 상태 오염
// - 타입 안전성 부족
// - 테스트 어려움
// - 예측 불가능한 동작
```

### After: 서비스 기반 관리

```javascript
// src/services/routeContextService.js
class RouteContextService {
  constructor() {
    this.currentParams = {};
    this.currentPath = "";
    this.subscribers = new Map();
  }

  setRouteContext(path, params = {}) {
    const previousPath = this.currentPath;
    const previousParams = { ...this.currentParams };

    this.currentPath = path;
    this.currentParams = { ...params };

    // 구독자들에게 경로 변경 알림
    this.notifySubscribers(EVENT_TYPES.ROUTE_CHANGED, {
      current: { path: this.currentPath, params: this.currentParams },
      previous: { path: previousPath, params: previousParams },
    });
  }

  getCurrentParams() {
    return { ...this.currentParams };
  }

  getParam(key) {
    return this.currentParams[key];
  }

  subscribe(callback) {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);
    return () => this.subscribers.delete(id);
  }
}

// src/pages/ProductDetailPage.js
import { routeContextService } from "../services/routeContextService.js";

export function initializeProductDetailPage() {
  // 서비스를 통한 안전한 파라미터 조회
  const productId = routeContextService.getParam("productId");

  if (productId) {
    productDetailStore.fetchProductDetail(productId);
  } else {
    console.error("Product ID not found in route params");
  }
}

// 장점:
// - 타입 안전성
// - 테스트 용이성
// - 예측 가능한 동작
// - 구독 기반 반응형 업데이트
```

---

## 6. 테스트 개선 예시

### Before: 전역 상태 의존 테스트

```javascript
// 테스트에서 전역 상태에 의존 - 문제점!
describe("ProductDetailPage", () => {
  beforeEach(() => {
    // 전역 상태 설정 - 테스트 간 간섭 가능성
    window.routeParams = { productId: "123" };
  });

  afterEach(() => {
    // 전역 상태 정리 - 누락 가능성
    delete window.routeParams;
  });

  it("should fetch product detail", () => {
    initializeProductDetailPage();
    // 전역 상태에 의존한 테스트
    expect(window.routeParams.productId).toBe("123");
  });
});
```

### After: 서비스 기반 테스트

```javascript
// 테스트에서 서비스 사용 - 개선!
describe("ProductDetailPage", () => {
  let mockRouteContextService;

  beforeEach(() => {
    // 서비스 모킹 - 격리된 테스트
    mockRouteContextService = {
      getParam: jest.fn(),
    };

    // 의존성 주입으로 테스트
    jest.doMock("../services/routeContextService.js", () => ({
      routeContextService: mockRouteContextService,
    }));
  });

  it("should fetch product detail", () => {
    mockRouteContextService.getParam.mockReturnValue("123");

    initializeProductDetailPage();

    expect(mockRouteContextService.getParam).toHaveBeenCalledWith("productId");
  });
});

// 장점:
// - 테스트 간 격리
// - 의존성 모킹 용이
// - 예측 가능한 테스트
// - 전역 상태 오염 방지
```

---

## 📋 마이그레이션 체크리스트

### 코드 변경 체크리스트

- [ ] **상수 추출**

  - [ ] `limit: 20` → `PRODUCT.DEFAULT_LIMIT`
  - [ ] `setTimeout(..., 3000)` → `UI.TOAST_AUTO_REMOVE_DELAY_MS`
  - [ ] `"shopping_cart"` → `STORAGE_KEYS.CART`

- [ ] **전역 상태 제거**

  - [ ] `window.routeParams` → `routeContextService.getParam()`
  - [ ] `window.eventBus` → 의존성 주입 방식

- [ ] **이벤트 기반 통신**

  - [ ] Store 직접 참조 → `storeEventService.emit*()`
  - [ ] 하드코딩된 이벤트명 → `EVENT_TYPES.*`

- [ ] **서비스 레이어 도입**
  - [ ] `routeContextService` 사용
  - [ ] `storeProvider` 사용
  - [ ] `storeEventService` 사용

### 테스트 업데이트 체크리스트

- [ ] 전역 상태 의존 테스트 → 서비스 모킹 테스트
- [ ] Store 직접 참조 테스트 → 이벤트 기반 테스트
- [ ] 매직 넘버 테스트 → 상수 기반 테스트

---

**문서 작성자**: 389팀 Common AI Development Assistant  
**최종 업데이트**: 2024년 12월 19일
