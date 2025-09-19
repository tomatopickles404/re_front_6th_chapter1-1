import { router } from "./router/index.js";
import { routes } from "./router/routes.js";
import { isTestEnvironment } from "./utils/isTestEnvironment.js";
import { registerAllEvents } from "./services/eventService.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker, workerOptions }) => worker.start(workerOptions));

function main() {
  // 이벤트 등록
  registerAllEvents();

  // 라우트 등록
  routes.forEach(({ path, component, initializer }) => {
    router.registerRoute(path, component, initializer);
  });

  router.navigate();
}

// 애플리케이션 시작
if (!isTestEnvironment()) {
  enableMocking().then(main);
} else {
  main();
}
