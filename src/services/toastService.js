import { UI } from "../constants/index.js";

export const toastService = {
  show(message, type = "success") {
    // 기존 토스트 제거
    const existingToast = document.querySelector(".toast-message");
    if (existingToast) {
      existingToast.remove();
    }

    // 타입별 스타일 설정
    const typeStyles = {
      success: "bg-green-500 text-white",
      info: "bg-blue-500 text-white",
      error: "bg-red-500 text-white",
    };

    // 새 토스트 생성
    const toast = document.createElement("div");
    toast.className = `toast-message fixed bottom-4 left-1/2 transform -translate-x-1/2 ${typeStyles[type]} px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between min-w-64`;

    // 메시지 텍스트
    const messageText = document.createElement("span");
    messageText.textContent = message;
    toast.appendChild(messageText);

    // 닫기 버튼
    const closeButton = document.createElement("button");
    closeButton.className = "ml-3 text-white hover:text-gray-200 focus:outline-none";
    closeButton.innerHTML = `
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    `;
    closeButton.addEventListener("click", () => {
      if (toast.parentNode) {
        toast.remove();
      }
    });
    toast.appendChild(closeButton);

    document.body.appendChild(toast);

    // 자동 제거 (상수 사용)
    const autoRemoveTimer = setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, UI.TOAST_AUTO_REMOVE_DELAY_MS);

    // 닫기 버튼 클릭 시 타이머 취소
    closeButton.addEventListener("click", () => {
      clearTimeout(autoRemoveTimer);
    });
  },
};
