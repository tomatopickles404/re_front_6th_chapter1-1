import { getAppPath, getFullPath } from "../utils/path.js";

export function Router() {
  const routes = {};
  let notFoundComponent = "";

  const registerRoute = (path, component, initializer = null) => {
    routes[path] = { component, initializer };
  };

  const setNotFoundComponent = (component) => {
    notFoundComponent = component;
  };

  const navigateTo = (path) => {
    window.history.pushState(null, null, getFullPath(path));
    router();
  };

  // 동적 경로 매칭 함수
  const matchRoute = (path) => {
    // 정확한 매칭 먼저 시도
    if (routes[path]) {
      return { route: routes[path], params: {} };
    }

    // 동적 경로 매칭 시도
    for (const routePath in routes) {
      if (routePath.includes(":")) {
        const pattern = routePath.replace(/:[^/]+/g, "([^/]+)");
        const regex = new RegExp(`^${pattern}$`);
        const match = path.match(regex);

        if (match) {
          const params = {};
          const paramNames = routePath.match(/:[^/]+/g) || [];
          paramNames.forEach((paramName, index) => {
            const key = paramName.slice(1); // ':' 제거
            params[key] = match[index + 1];
          });

          return { route: routes[routePath], params };
        }
      }
    }

    return null;
  };

  const router = () => {
    const path = getAppPath(window.location.pathname);
    const match = matchRoute(path);

    if (match) {
      const { route, params } = match;

      // 전역 파라미터 설정 (컴포넌트에서 사용할 수 있도록)
      window.routeParams = params;

      document.getElementById("root").innerHTML = route.component();

      if (route.initializer) {
        route.initializer();
      }
    } else {
      // 404 처리
      if (notFoundComponent) {
        document.getElementById("root").innerHTML = notFoundComponent();
      }
    }
  };

  window.addEventListener("popstate", router);
  document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
      if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigateTo(e.target.href);
      }
    });
    router();
  });

  return {
    registerRoute,
    setNotFoundComponent,
    navigateTo,
    router,
  };
}
