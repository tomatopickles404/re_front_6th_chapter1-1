export const isTestEnvironment = () => typeof import.meta.env.MODE !== "undefined" && import.meta.env.MODE === "test";
