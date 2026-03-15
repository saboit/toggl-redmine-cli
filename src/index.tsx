#!/usr/bin/env node
import { configure } from "./configure.js";
import React, { type JSX, useState } from "react";
import { Box, render, Text, useStdout } from "ink";
import { Help } from "./components/Help.js";
import { Entries } from "./components/Entries.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandsProps } from "./components/types.js";
import { Search } from "./components/Search.js";
import { Toggl } from "./components/Toggl.js";
import { MonthlySummary } from "./components/MonthlySummary.js";
import { DeleteEntry } from "./components/DeleteEntry.js";
import { CreateTask } from "./components/CreateTask.js";
import SelectInput from "ink-select-input";
import { Projects } from "./components/Projects.js";
import { ImportJiraIssue } from "./components/ImportJiraIssue.js";
import BigText from "ink-big-text";
import fs from "fs";

configure();

const OutputMap: Record<string, (props: CommandsProps) => JSX.Element> = {
  "--help": Help,
  "-h": Help,
  "get-entries": Entries,
  search: Search,
  toggl: Toggl,
  "print-monthly-summary": MonthlySummary,
  delete: DeleteEntry,
  "create-task": CreateTask,
  "projects": Projects,
  "import-jira-issue": ImportJiraIssue,
};

const InvalidCommand = () => <Text>Invalid command</Text>;

const packageJson = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"));

const version = packageJson.version;

const App = () => {
  const [command, ...args] = process.argv.slice(2);
  const [selectedCommand, setCommand] = useState(command);
  const { write } = useStdout();

  if (!selectedCommand) {
    const options = Object.keys(OutputMap).map((key) => {
      return {
        value: key,
        label: key,
      };
    });
    return (
      <Box flexDirection="column">
        <BigText text={`Toggl Redmine CLI v${version}`} />
        <Text color="green">Select a command:</Text>
        <SelectInput
          items={options}
          onSelect={(i) => {
            write('\x1Bc'); // Clear the console
            setCommand(i.value);
          }}
        />
      </Box>
    );
  }

  const Component = OutputMap[selectedCommand] ?? InvalidCommand;

  return <Component args={args} />
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Optional: exponential backoff
    },
  },
});

render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
