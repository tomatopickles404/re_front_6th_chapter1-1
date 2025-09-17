export const PRODUCT = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_SORT: "price_asc",
  DEFAULT_PAGE: 1,
};

export const UI = {
  TOAST_AUTO_REMOVE_DELAY_MS: 3000,
  ANIMATION_DURATION_MS: 300,
};

export const STORAGE_KEYS = {
  CART: "shopping_cart",
};

export const EVENT_TYPES = {
  CART_ADDED: "cart:added",
  CART_REMOVED: "cart:removed",
  CART_CLEARED: "cart:cleared",
  PRODUCT_FILTER_CHANGED: "product:filterChanged",
  PRODUCT_LOADED: "product:loaded",
  ROUTE_CHANGED: "route:changed",
};

export const ROUTES = {
  HOME: "/",
  PRODUCT_DETAIL: "/product/:productId",
  NOT_FOUND: "/non-existent-page",
};
