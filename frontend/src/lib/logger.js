export const logError = (error) => {
  if (import.meta.env.MODE === "development") {
    console.error(error);
  }
};