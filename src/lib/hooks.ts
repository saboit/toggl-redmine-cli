import { useCallback, useEffect, useRef } from "react";

export function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args: any[]) => ref.current(...args), []) as T;
}
