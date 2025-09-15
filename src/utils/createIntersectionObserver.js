/**
 * @param {Function} callback 요소가 뷰포트에 들어왔을 때 호출되는 함수
 * @param {Object} options IntersectionObserver 옵션
 * @returns {Object} { observe, unobserve, disconnect }
 */
export function createIntersectionObserver(callback, options = {}) {
  let observer = null;
  let currentObservedNode = null; // 현재 관찰 중인 노드를 저장

  const observe = (node) => {
    if (!node) {
      console.warn("Intersection Observer: Node to observe is null or undefined.");
      return;
    }

    // 이미 같은 노드를 관찰 중이면 불필요한 재설정 방지
    if (currentObservedNode === node && observer) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        callback();
      }
    }, options);

    // 요소 관찰 시작
    observer.observe(node);
    currentObservedNode = node; // 현재 관찰 중인 노드 업데이트
  };

  const unobserve = (node) => {
    // 💡 추가: 특정 요소 관찰 중지
    if (observer && node) {
      observer.unobserve(node);
      if (currentObservedNode === node) {
        currentObservedNode = null; // 관찰 해제된 노드 초기화
      }
    }
  };

  // cleanup 함수 제공
  const disconnect = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
      currentObservedNode = null;
    }
  };

  return { observe, unobserve, disconnect }; // 💡 unobserve 노출
}
