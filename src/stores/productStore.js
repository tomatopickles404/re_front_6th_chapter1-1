import { getProducts } from "../api/productApi.js";
import { getQueryParams, setQueryParams } from "../utils/urlParams.js";
import { isTestEnvironment } from "../utils/isTestEnvironment.js";
import { PRODUCT } from "../constants/index.js";
import { storeEventService } from "../services/storeEventService.js";

export const productStore = {
  state: {
    products: [],
    isLoading: true,
    error: null,
    totalCount: 0,
    filters: {
      page: PRODUCT.DEFAULT_PAGE,
      limit: PRODUCT.DEFAULT_LIMIT,
      search: "",
      category1: "",
      category2: "",
      sort: PRODUCT.DEFAULT_SORT,
    },
  },

  async fetchProducts(append = false) {
    this.state.isLoading = true;
    this.state.error = null;

    if (!isTestEnvironment()) {
      this.render();
    }

    try {
      const data = await getProducts(this.state.filters);
      this.state.products = append ? [...this.state.products, ...data.products] : data.products;
      this.state.totalCount = data.pagination.total;
    } catch (err) {
      console.error("Failed to fetch products:", err);
      this.state.error = err;
    } finally {
      this.state.isLoading = false;
      this.render();

      // 이벤트 발행으로 다른 Store들에게 알림
      storeEventService.emitProductLoaded(this.state.products);
    }
  },

  updateFetchProducts() {
    this.state.filters.page = this.state.filters.page + 1;
    setQueryParams(this.state.filters);
    this.fetchProducts(true);
  },

  updateFilters(newFilters) {
    this.state.filters = { ...this.state.filters, ...newFilters, page: 1 };
    setQueryParams(this.state.filters);
    this.fetchProducts();

    // 이벤트 발행으로 다른 Store들에게 알림
    storeEventService.emitProductFilterChanged(this.state.filters);
  },

  reset() {
    this.state.products = [];
    this.state.isLoading = true;
    this.state.error = null;
    this.state.totalCount = 0;
    this.state.filters = {
      page: PRODUCT.DEFAULT_PAGE,
      limit: PRODUCT.DEFAULT_LIMIT,
      search: "",
      category1: "",
      category2: "",
      sort: PRODUCT.DEFAULT_SORT,
      ...getQueryParams(),
    };
  },

  initializeFromURL() {
    const urlParams = getQueryParams();
    this.state.filters = {
      ...this.state.filters,
      ...urlParams,
      page: 1,
    };
    // 숫자 파라미터들을 올바른 타입으로 변환
    if (urlParams.limit) {
      this.state.filters.limit = Number(urlParams.limit);
    }
  },

  // 렌더링 콜백 (외부에서 주입)
  render: null,
};
