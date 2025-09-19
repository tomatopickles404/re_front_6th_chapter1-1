import { getAppPath, getFullPath } from "../utils/path.js";
import { routeContextService } from "../services/routeContextService.js";

function Router() {
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
    navigate();
  };

  // 동적 경로 매칭 함수
  const matchRoute = (path) => {
    console.log("라우터 매칭 시도:", path);
    console.log("등록된 라우트:", Object.keys(routes));

    // 정확한 매칭 먼저 시도
    if (routes[path]) {
      console.log("정확한 매칭 성공:", path);
      return { route: routes[path], params: {} };
    }

    // 동적 경로 매칭 시도
    for (const routePath in routes) {
      if (routePath.includes(":")) {
        console.log("동적 라우트 매칭 시도:", routePath);
        const pattern = routePath.replace(/:[^/]+/g, "([^/]+)");
        const regex = new RegExp(`^${pattern}$`);
        console.log("정규식 패턴:", pattern);
        const match = path.match(regex);
        console.log("매칭 결과:", match);

        if (match) {
          const params = {};
          const paramNames = routePath.match(/:[^/]+/g) || [];
          console.log("파라미터 이름들:", paramNames);
          paramNames.forEach((paramName, index) => {
            const key = paramName.slice(1); // ':' 제거
            params[key] = match[index + 1];
            console.log(`파라미터 설정: ${key} = ${match[index + 1]}`);
          });

          console.log("최종 파라미터:", params);
          return { route: routes[routePath], params };
        }
      }
    }

    console.log("매칭 실패");
    return null;
  };

  const navigate = () => {
    const path = getAppPath(window.location.pathname);
    const match = matchRoute(path);

    if (match) {
      const { route, params } = match;

      // 라우트 컨텍스트 서비스를 통한 파라미터 설정
      routeContextService.setRouteContext(path, params);

      // 컴포넌트 렌더링
      document.getElementById("root").innerHTML = route.component();

      // 초기화 함수 실행
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

  // 클릭 이벤트 위임
  window.addEventListener("popstate", navigate);
  document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (e) => {
      if (e.target.matches("[data-link]")) {
        e.preventDefault();
        navigateTo(e.target.href);
      }
    });
    navigate();
  });

  return {
    registerRoute,
    setNotFoundComponent,
    navigateTo,
    navigate,
  };
}

export const router = Router();
