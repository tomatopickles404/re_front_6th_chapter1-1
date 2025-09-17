import { EVENT_TYPES } from "../constants/index.js";

/**
 * 라우트 파라미터와 상태를 관리하는 서비스
 * window.routeParams 전역 변수 대신 사용
 */
class RouteContextService {
  constructor() {
    this.currentParams = {};
    this.currentPath = "";
    this.subscribers = new Map();
  }

  /**
   * 현재 라우트 파라미터 설정
   * @param {string} path - 현재 경로
   * @param {Object} params - 라우트 파라미터
   */
  setRouteContext(path, params = {}) {
    const previousPath = this.currentPath;
    const previousParams = { ...this.currentParams };

    this.currentPath = path;
    this.currentParams = { ...params };

    // 경로 변경 이벤트 발행
    this.notifySubscribers(EVENT_TYPES.ROUTE_CHANGED, {
      current: { path: this.currentPath, params: this.currentParams },
      previous: { path: previousPath, params: previousParams },
    });
  }

  /**
   * 현재 라우트 파라미터 조회
   * @returns {Object} 현재 파라미터
   */
  getCurrentParams() {
    return { ...this.currentParams };
  }

  /**
   * 현재 경로 조회
   * @returns {string} 현재 경로
   */
  getCurrentPath() {
    return this.currentPath;
  }

  /**
   * 특정 파라미터 값 조회
   * @param {string} key - 파라미터 키
   * @returns {string|undefined} 파라미터 값
   */
  getParam(key) {
    return this.currentParams[key];
  }

  /**
   * 라우트 변경 구독
   * @param {Function} callback - 콜백 함수
   * @returns {Function} 구독 해제 함수
   */
  subscribe(callback) {
    const id = Math.random().toString(36).substr(2, 9);
    this.subscribers.set(id, callback);

    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * 구독자들에게 이벤트 알림
   * @param {string} eventType - 이벤트 타입
   * @param {any} data - 이벤트 데이터
   */
  notifySubscribers(eventType, data) {
    this.subscribers.forEach((callback) => {
      try {
        callback(eventType, data);
      } catch (error) {
        console.error("Route context subscriber error:", error);
      }
    });
  }

  /**
   * 서비스 초기화
   */
  reset() {
    this.currentParams = {};
    this.currentPath = "";
    this.subscribers.clear();
  }
}

// 싱글톤 인스턴스 생성
export const routeContextService = new RouteContextService();
