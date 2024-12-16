export const debounce = (func: (...args: unknown[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: unknown[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}; 