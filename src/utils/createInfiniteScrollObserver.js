import { createIntersectionObserver } from "./createIntersectionObserver.js";

/**
 * @param {Function} onLoadMore 더 로드할 때 호출되는 함수
 * @param {Object} options 설정 옵션
 * @param {string} [options.rootMargin="200px"] - Intersection Observer의 rootMargin.
 * @param {number} [options.threshold=0.1] - Intersection Observer의 threshold.
 * @param {boolean} [options.enabled=true] - 초기 활성화 상태.
 * @param {Function} [options.getIsLoading] - 현재 데이터 로딩 중인지 여부를 반환하는 함수. 로딩 중일 때는 onLoadMore를 호출하지 않습니다.
 * @param {Function} [options.hasMore] - 더 로드할 데이터가 있는지 여부를 반환하는 함수. 더 이상 데이터가 없으면 onLoadMore를 호출하지 않습니다.
 * @returns {Object} { init, destroy, updateTrigger, enable, disable }
 */
export function createInfiniteScrollObserver(onLoadMore, options = {}) {
  const {
    rootMargin = "200px",
    threshold = 0.1,
    enabled = true,
    getIsLoading = () => false, // 기본값: 항상 로딩 중이 아님
    hasMore = () => true, // 기본값: 항상 더 많은 데이터가 있음
  } = options;

  let isEnabled = enabled;
  let currentTriggerElement = null; // 현재 관찰 중인 트리거 요소

  const { observe, unobserve, disconnect } = createIntersectionObserver(
    () => {
      // 💡 핵심 로직: 로딩 중이 아니며, 활성화되어 있고, 더 불러올 데이터가 있을 때만 onLoadMore 호출
      if (isEnabled && !getIsLoading() && hasMore() && onLoadMore) {
        onLoadMore();
      } else if (!hasMore()) {
        // 더 이상 불러올 데이터가 없으면 옵저버 연결 해제
        disconnect();
      }
    },
    {
      rootMargin,
      threshold,
    },
  );

  /**
   * 무한 스크롤 옵저버를 초기화하거나 새로운 트리거 요소를 관찰합니다.
   * DOM이 처음 렌더링될 때, 또는 트리거 요소가 DOM에서 완전히 교체될 때 사용됩니다.
   * @param {string} [selector=".infinite-scroll-trigger"] - 관찰할 트리거 요소의 CSS 선택자.
   */
  const init = (selector = ".infinite-scroll-trigger") => {
    const element = document.querySelector(selector);
    if (element) {
      // 이전 요소와 다르면 unobserve 후 새 요소 observe
      if (currentTriggerElement && currentTriggerElement !== element) {
        unobserve(currentTriggerElement);
      }
      currentTriggerElement = element;
      observe(element);
    } else {
      // 트리거 요소가 없을 경우 (예: 모든 상품을 로드했을 때) 옵저버 연결 해제
      if (currentTriggerElement) {
        // 이전에 관찰 중인 요소가 있었다면
        disconnect();
        console.log("Infinite scroll trigger element not found, disconnecting observer.");
      }
      currentTriggerElement = null;
    }
  };

  /**
   * 현재 관찰 중인 트리거 요소를 다시 확인하고, 필요 시 재관찰합니다.
   * 주로 DOM 업데이트 후 같은 선택자의 요소가 내용만 변경되었을 때 유용합니다.
   * (현재 createIntersectionObserver의 observe가 이미 이 역할을 포함하므로, init과 동일하게 동작)
   * @param {string} [selector=".infinite-scroll-trigger"] - 관찰할 트리거 요소의 CSS 선택자.
   */
  const updateTrigger = (selector = ".infinite-scroll-trigger") => {
    init(selector); // init이 이미 재연결 로직을 포함하므로 init 호출
  };

  const enable = () => {
    isEnabled = true;
    if (currentTriggerElement && !getIsLoading() && hasMore()) {
      observe(currentTriggerElement); // 활성화 시 다시 관찰 시작
    }
  };

  const disable = () => {
    isEnabled = false;
    if (currentTriggerElement) {
      unobserve(currentTriggerElement); // 비활성화 시 관찰 중지
    }
  };

  const destroy = () => {
    disconnect();
    currentTriggerElement = null;
    isEnabled = false;
  };

  return {
    init,
    updateTrigger,
    enable,
    disable,
    destroy,
  };
}
