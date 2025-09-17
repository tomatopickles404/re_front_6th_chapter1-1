import { eventBus } from "../utils/EventBus.js";
import { EVENT_TYPES } from "../constants/index.js";

/**
 * Store 간 통신을 위한 이벤트 서비스
 * Store들이 직접 참조하지 않고 이벤트를 통해 통신
 */
class StoreEventService {
  constructor() {
    this.setupEventHandlers();
  }

  /**
   * 이벤트 핸들러 설정
   */
  setupEventHandlers() {
    // 장바구니 관련 이벤트
    eventBus.on(EVENT_TYPES.CART_ADDED, this.handleCartAdded.bind(this));
    eventBus.on(EVENT_TYPES.CART_REMOVED, this.handleCartRemoved.bind(this));
    eventBus.on(EVENT_TYPES.CART_CLEARED, this.handleCartCleared.bind(this));

    // 상품 관련 이벤트
    eventBus.on(EVENT_TYPES.PRODUCT_FILTER_CHANGED, this.handleProductFilterChanged.bind(this));
    eventBus.on(EVENT_TYPES.PRODUCT_LOADED, this.handleProductLoaded.bind(this));
  }

  /**
   * 장바구니 추가 이벤트 처리
   * @param {Object} data - 상품 데이터
   */
  handleCartAdded(data) {
    // 다른 Store들이 장바구니 변경을 알 수 있도록 이벤트 발행
    console.log("Cart item added:", data);
    // 필요시 추가 로직 (예: 추천 상품 업데이트, 통계 등)
  }

  /**
   * 장바구니 제거 이벤트 처리
   * @param {Object} data - 제거된 상품 데이터
   */
  handleCartRemoved(data) {
    console.log("Cart item removed:", data);
    // 필요시 추가 로직
  }

  /**
   * 장바구니 비우기 이벤트 처리
   */
  handleCartCleared() {
    console.log("Cart cleared");
    // 필요시 추가 로직
  }

  /**
   * 상품 필터 변경 이벤트 처리
   * @param {Object} data - 필터 데이터
   */
  handleProductFilterChanged(data) {
    console.log("Product filter changed:", data);
    // 필요시 추가 로직 (예: URL 업데이트, 히스토리 등)
  }

  /**
   * 상품 로드 완료 이벤트 처리
   * @param {Object} data - 로드된 상품 데이터
   */
  handleProductLoaded(data) {
    console.log("Product loaded:", data);
    // 필요시 추가 로직 (예: 관련 상품 로드, 추천 등)
  }

  /**
   * 이벤트 발행 헬퍼 메서드들
   */
  emitCartAdded(product) {
    eventBus.emit(EVENT_TYPES.CART_ADDED, product);
  }

  emitCartRemoved(product) {
    eventBus.emit(EVENT_TYPES.CART_REMOVED, product);
  }

  emitCartCleared() {
    eventBus.emit(EVENT_TYPES.CART_CLEARED);
  }

  emitProductFilterChanged(filters) {
    eventBus.emit(EVENT_TYPES.PRODUCT_FILTER_CHANGED, filters);
  }

  emitProductLoaded(products) {
    eventBus.emit(EVENT_TYPES.PRODUCT_LOADED, products);
  }
}

// 싱글톤 인스턴스 생성
export const storeEventService = new StoreEventService();
