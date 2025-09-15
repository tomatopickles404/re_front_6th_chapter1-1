class EventBus {
  constructor() {
    this.events = {};
  }

  // 이벤트 구독
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    // 구독 해제 함수 반환 (메모리 누수 방지)
    return () => this.off(event, callback);
  }

  // 이벤트 발행
  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // 이벤트 구독 해제
  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter((cb) => cb !== callback);
    }
  }

  // 특정 이벤트의 모든 구독 해제
  offAll(event) {
    delete this.events[event];
  }

  // 모든 이벤트 구독 해제
  clear() {
    this.events = {};
  }

  // 이벤트 리스너 수 확인
  getListenerCount(event) {
    return this.events[event] ? this.events[event].length : 0;
  }
}

// 싱글톤 인스턴스 생성
export const eventBus = new EventBus();

// 전역으로 노출 (개발 편의성)
if (typeof window !== "undefined") {
  window.eventBus = eventBus;
}
