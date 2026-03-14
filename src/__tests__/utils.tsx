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
  // React effects are scheduled via MessageChannel (faster than setTimeout).
  // One setTimeout(0) tick is enough to let all pending effects commit.
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
