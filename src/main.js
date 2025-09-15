import { Router } from "./router/index.js";
import { routes } from "./router/routes.js";
import { isTestEnvironment } from "./utils/isTestEnvironment.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker, workerOptions }) => worker.start(workerOptions));

export const router = Router();

function main() {
  routes.forEach((route) => {
    router.registerRoute(route.path, route.component, route.initializer);
  });

  router.router();
}

// 애플리케이션 시작
if (!isTestEnvironment()) {
  enableMocking().then(main);
} else {
  main();
}
