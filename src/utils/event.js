export function addEvent(eventType, selector, handler) {
  console.log(`이벤트 등록: ${eventType} -> ${selector}`);
  document.addEventListener(eventType, (e) => {
    // closest를 먼저 사용해서 이벤트 위임이 제대로 작동하도록 함
    const target = e.target.closest(selector);
    if (target) {
      console.log(`이벤트 매칭: ${selector}`, target);
      handler(e);
    }
  });
}
