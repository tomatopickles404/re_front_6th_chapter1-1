import { eventBus } from "../utils/EventBus.js";
import { EVENT_TYPES } from "../constants/index.js";

/**
 * Store 상태를 컴포넌트에 제공하는 Provider
 * Store 직접 참조 대신 이벤트 기반으로 상태 관리
 */
class StoreProvider {
  constructor() {
    this.subscribers = new Map();
    this.setupEventListeners();
  }

  /**
   * 이벤트 리스너 설정
   */
  setupEventListeners() {
    // 장바구니 관련 이벤트 구독
    eventBus.on(EVENT_TYPES.CART_ADDED, this.handleCartChange.bind(this));
    eventBus.on(EVENT_TYPES.CART_REMOVED, this.handleCartChange.bind(this));
    eventBus.on(EVENT_TYPES.CART_CLEARED, this.handleCartChange.bind(this));

    // 상품 관련 이벤트 구독
    eventBus.on(EVENT_TYPES.PRODUCT_FILTER_CHANGED, this.handleProductChange.bind(this));
    eventBus.on(EVENT_TYPES.PRODUCT_LOADED, this.handleProductChange.bind(this));
  }

  /**
   * 장바구니 변경 이벤트 처리
   */
  handleCartChange() {
    this.notifySubscribers("cart");
  }

  /**
   * 상품 변경 이벤트 처리
   */
  handleProductChange() {
    this.notifySubscribers("product");
  }

  /**
   * 구독자 등록
   * @param {string} storeType - Store 타입 ('cart', 'product')
   * @param {Function} callback - 콜백 함수
   * @returns {Function} 구독 해제 함수
   */
  subscribe(storeType, callback) {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, { storeType, callback });

    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * 구독자들에게 알림
   * @param {string} storeType - Store 타입
   */
  notifySubscribers(storeType) {
    this.subscribers.forEach(({ storeType: subStoreType, callback }) => {
      if (subStoreType === storeType) {
        try {
          callback();
        } catch (error) {
          console.error("Store provider subscriber error:", error);
        }
      }
    });
  }

  /**
   * 장바구니 상태 조회 (Store 직접 참조 대신)
   * @returns {number} 장바구니 아이템 수
   */
  getCartCount() {
    // 이벤트를 통해 장바구니 상태 요청
    return new Promise((resolve) => {
      const unsubscribe = eventBus.on("cart:countRequested", (count) => {
        unsubscribe();
        resolve(count);
      });

      // Store에 카운트 요청 이벤트 발행
      eventBus.emit("cart:requestCount");
    });
  }

  /**
   * 상품 상태 조회 (Store 직접 참조 대신)
   * @returns {Object} 상품 상태
   */
  getProductState() {
    return new Promise((resolve) => {
      const unsubscribe = eventBus.on("product:stateRequested", (state) => {
        unsubscribe();
        resolve(state);
      });

      // Store에 상태 요청 이벤트 발행
      eventBus.emit("product:requestState");
    });
  }
}

// 싱글톤 인스턴스 생성
export const storeProvider = new StoreProvider();
