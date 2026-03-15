import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CommandsProps } from "./types.js";
import { fetchJiraIssue, JiraIssue } from "../lib/jira.js";
import { fetchAllProjects } from "../lib/redmine.js";
import { getSearch, createIssue } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { ConfirmInput } from "./ConfirmInput.js";
import { useEventCallback } from "../lib/hooks.js";


interface LoadedData {
  jiraIssue: JiraIssue;
  redmineProjects: { id: number; name: string }[];
  existingRedmineId: number | null;
}

export const JiraIssueImporter = ({
  jiraKey,
  onDone,
  onSkip,
}: {
  jiraKey: string;
  onDone: (issueId: number) => void;
  onSkip?: () => void;
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data, isLoading, isError, error } = useQuery<LoadedData>({
    queryKey: ["jira-import", jiraKey],
    queryFn: async () => {
      const [jiraIssue, redmineProjects, searchData] = await Promise.all([
        fetchJiraIssue(jiraKey),
        fetchAllProjects(),
        getSearch('json', { q: jiraKey, offset: 0, limit: 20 }),
      ]);
      const existing = searchData.results.find((r) => r.title.includes(jiraKey));
      return {
        jiraIssue,
        redmineProjects,
        existingRedmineId: existing?.id ?? null,
      };
    },
  });

  const { mutate, isPending, isSuccess, isError: isMutationError, error: mutationError, data: created } = useMutation({
    mutationFn: async () => {
      const project = data!.redmineProjects.find((p) => p.id === selectedProjectId)!;
      const { summary } = data!.jiraIssue.fields;
      const result = await createIssue('json', {
        issue: {
          project_id: project.id,
          subject: `[${jiraKey}] ${summary}`,
          description: `Imported from Jira: ${jiraKey}`,
        },
      });
      return result.issue as { id: number; subject: string };
    },
  });

  const doneEvent = useEventCallback((id: number) => {
    onDone(id);
  })

  const redmineExistingId = data?.existingRedmineId;

  // Both must be before any early returns to satisfy Rules of Hooks.
  // useEffect ensures the frame renders first before onDone() advances the parent.
  useEffect(() => {
    if (redmineExistingId) doneEvent(redmineExistingId);
  }, [redmineExistingId, doneEvent]);

  useEffect(() => {
    if (isSuccess) doneEvent(created!.id);
  }, [created, doneEvent, isSuccess]);

  if (isLoading) {
    return <Text>Fetching {jiraKey}...</Text>;
  }

  if (isError) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: {(error as Error).message}</Text>
        {onSkip && (
          <Box flexDirection="column">
            <Text>Skip this entry? (y/n)</Text>
            <ConfirmInput onPress={(confirmed) => { if (confirmed) onSkip(); }} />
          </Box>
        )}
      </Box>
    );
  }

  const { jiraIssue, redmineProjects, existingRedmineId } = data!;
  const { summary, status, assignee, priority, issuetype } = jiraIssue.fields;

  if (existingRedmineId) {
    return <Text color="yellow">{jiraKey} already exists in Redmine as issue #{existingRedmineId}</Text>;
  }

  if (isSuccess) {
    return <Text color="green">Created Redmine issue #{created!.id}: {created!.subject}</Text>;
  }

  if (isMutationError) {
    return <Text color="red">Failed to create issue: {(mutationError as Error).message}</Text>;
  }

  if (isPending) {
    return <Text>Creating Redmine issue...</Text>;
  }

  const selectedProject = redmineProjects.find((p) => p.id === selectedProjectId);

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginBottom={1}>
        <Text bold>{jiraKey}: {summary}</Text>
        <Text dimColor>Type: {issuetype.name}  Status: {status.name}  Priority: {priority?.name ?? "—"}  Assignee: {assignee?.displayName ?? "Unassigned"}</Text>
      </Box>

      {!selectedProjectId ? (
        <>
          <Text>Select Redmine project to import into:</Text>
          <SelectInput
            items={redmineProjects.map((p) => ({ label: p.name, value: p.id }))}
            onSelect={(item) => setSelectedProjectId(item.value)}
          />
        </>
      ) : (
        <Box flexDirection="column">
          <Text>Create <Text bold>[{jiraKey}] {summary}</Text> in <Text bold>{selectedProject!.name}</Text>? (y/n)</Text>
          <ConfirmInput
            onPress={(confirmed) => {
              if (confirmed) {
                mutate();
              } else {
                setSelectedProjectId(null);
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};

const JIRA_KEY_RE = /^[A-Z]+-\d+$/;

const KeysInput = ({ onSubmit }: { onSubmit: (keys: string[]) => void }) => {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (input: string) => {
    const tokens = input.split(/[\s,]+/).filter(Boolean);
    const invalid = tokens.filter((t) => !JIRA_KEY_RE.test(t));

    if (tokens.length === 0) {
      setError("Please enter at least one Jira key (e.g. PROJ-123)");
      return;
    }
    if (invalid.length > 0) {
      setError(`Invalid key(s): ${invalid.join(", ")}`);
      return;
    }
    onSubmit(tokens);
  };

  return (
    <Box flexDirection="column">
      <Text>Enter Jira issue key(s) separated by spaces:</Text>
      <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};

export const ImportJiraIssue = ({ args }: CommandsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keys, setKeys] = useState<string[]>(() =>
    (args ?? []).filter((key) => JIRA_KEY_RE.test(key))
  );

  if (keys.length === 0) {
    return <KeysInput onSubmit={setKeys} />;
  }

  if (currentIndex >= keys.length) {
    return <Text color="green">Done — processed {keys.length} issue(s).</Text>;
  }

  return (
    <Box flexDirection="column">
      {keys.length > 1 && (
        <Text dimColor>[{currentIndex + 1}/{keys.length}] {keys[currentIndex]}</Text>
      )}
      <JiraIssueImporter
        jiraKey={keys[currentIndex]}
        onDone={() => setCurrentIndex((i) => i + 1)}
      />
    </Box>
  );
};
