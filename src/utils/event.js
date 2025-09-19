export function addEvent(eventType, selector, handler) {
  console.log(`이벤트 등록: ${eventType} -> ${selector}`);
  document.addEventListener(eventType, (e) => {
    // 클릭된 요소가 선택자와 일치하는지 확인
    if (e.target.matches && e.target.matches(selector)) {
      console.log(`이벤트 매칭: ${selector}`, e.target);
      handler(e);
    } else {
      // 부모 요소에서도 확인 (이벤트 위임)
      const closest = e.target.closest(selector);
      if (closest) {
        console.log(`이벤트 매칭 (closest): ${selector}`, closest);
        handler(e);
      }
    }
  });
}
