import React from "react";
import { render } from "ink-testing-library";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function renderWithQuery(element: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{element}</QueryClientProvider>
  );
}

export async function flushEffects() {
  // React 18 passive effects (useEffect) are scheduled via MessageChannel
  // which fires before setTimeout in browsers, but in Node.js the ordering
  // is not guaranteed within a single setTimeout(0) tick. Two ticks ensure
  // that both the render commit and the effect re-registration (which
  // ink-text-input relies on to update its onSubmit handler) have completed
  // before the next stdin input is processed.
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

export async function waitForFrame(
  frames: readonly string[],
  text: string,
  timeout = 3000
): Promise<void> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (frames[frames.length - 1]?.includes(text)) return;
    await new Promise((r) => setTimeout(r, 20));
  }
  throw new Error(
    `Expected "${text}" within ${timeout}ms.\nLast frame: "${frames[frames.length - 1]}"`
  );
}
