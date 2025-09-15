import { ProductListPage, initializeProductListPage } from "../pages/ProductListPage";
import { ProductDetailPage, initializeProductDetailPage } from "../pages/ProductDetailPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const routes = [
  {
    path: "/",
    component: ProductListPage,
    initializer: initializeProductListPage,
  },
  {
    path: "/product/:productId",
    component: ProductDetailPage,
    initializer: initializeProductDetailPage,
  },
  {
    path: "/non-existent-page",
    component: NotFoundPage,
  },
];
