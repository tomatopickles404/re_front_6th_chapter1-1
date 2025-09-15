const BASE_PATH = import.meta.env.PROD ? "/front_6th_chapter1-1" : "";

export const getAppPath = (fullPath = window.location.pathname) => {
  return fullPath.startsWith(BASE_PATH) ? fullPath.slice(BASE_PATH.length) || "/" : fullPath;
};

export const getFullPath = (appPath) => {
  return BASE_PATH + appPath;
};
