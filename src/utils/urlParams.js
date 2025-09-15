export function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const regex = /([^&=]+)=([^&]*)/g;
  let m;

  while ((m = regex.exec(queryString))) {
    params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
  }
  return params;
}

export function setQueryParams(params) {
  const queryString = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .map((key) => {
      const value = encodeURIComponent(params[key]);
      return `${encodeURIComponent(key)}=${value}`;
    })
    .join("&");

  const newUrl = `${window.location.pathname}${queryString ? "?" + queryString : ""}${window.location.hash}`;
  window.history.pushState({ path: newUrl }, "", newUrl);
}
