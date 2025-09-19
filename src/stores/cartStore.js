import { toastService } from "../services/toastService.js";
import { STORAGE_KEYS } from "../constants/index.js";
import { storeEventService } from "../services/storeEventService.js";
import { eventBus } from "../utils/EventBus.js";

export const cartStore = {
  state: {
    items: [],
  },

  // 이벤트 리스너 설정
  init() {
    // 카운트 요청 이벤트 처리
    eventBus.on("cart:requestCount", () => {
      eventBus.emit("cart:countRequested", this.getCartCount());
    });
  },

  getCartCount() {
    return this.state.items.length;
  },

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

  removeSelectedItems(selectedProductIds) {
    const removedItems = this.state.items.filter((item) => selectedProductIds.includes(item.productId));
    this.state.items = this.state.items.filter((item) => !selectedProductIds.includes(item.productId));
    this.saveToLocalStorage();
    this.updateCartBadge();
    if (removedItems.length > 0) {
      toastService.show(`선택한 ${removedItems.length}개 상품이 삭제되었습니다`, "info");
    }
  },

  clearCart() {
    const itemCount = this.state.items.length;
    this.state.items = [];
    this.saveToLocalStorage();
    this.updateCartBadge();
    if (itemCount > 0) {
      toastService.show("장바구니가 비워졌습니다", "info");
      // 이벤트 발행으로 다른 Store들에게 알림
      storeEventService.emitCartCleared();
    }
  },

  updateQuantity(productId, quantity) {
    const item = this.state.items.find((item) => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        this.saveToLocalStorage();
        this.updateCartBadge();
      }
    }
  },

  saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(this.state.items));
  },

  loadFromLocalStorage() {
    const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
    if (savedCart) {
      try {
        const parsedItems = JSON.parse(savedCart);
        // 배열인지 확인하고, 아니면 빈 배열로 초기화
        this.state.items = Array.isArray(parsedItems) ? parsedItems : [];
      } catch (error) {
        console.error("장바구니 데이터 파싱 오류:", error);
        this.state.items = [];
      }
    }
  },

  updateCartBadge() {
    const cartIcon = document.querySelector("#cart-icon-btn");
    if (cartIcon) {
      const count = this.getCartCount();
      let badge = cartIcon.querySelector(".cart-badge");

      if (count > 0) {
        if (!badge) {
          badge = document.createElement("span");
          badge.className =
            "cart-badge absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center";
          cartIcon.appendChild(badge);
        }
        badge.textContent = count;
      } else if (badge) {
        badge.remove();
      }
    }
  },

  reset() {
    this.state.items = [];
    this.saveToLocalStorage();
    this.updateCartBadge();
  },

  // 테스트를 위한 완전한 상태 초기화
  clearAll() {
    this.state.items = [];
    localStorage.removeItem(STORAGE_KEYS.CART);
    this.updateCartBadge();
  },
};

// Store 초기화
cartStore.init();
cartStore.loadFromLocalStorage();
