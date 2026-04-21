import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { ModelsTimeEntry as TogglTimeEntry } from "@saboit/toggl-redmine-bridge/api-toggl-hooks";
import { extractJiraKey } from "../lib/redmine.js";
import { JiraIssueImporter } from "./ImportJiraIssue.js";
import { ConfirmInput } from "./ConfirmInput.js";

type ResolvedMap = Map<number, number>;

type EntryPhase = "ask-jira" | "importing-jira" | "ask-manual";

const SingleOrphanResolver = ({
  entry,
  onResolve,
}: {
  entry: TogglTimeEntry;
  onResolve: (issueId?: number) => void;
}) => {
  const jiraKey = extractJiraKey(entry.description || "");
  const [phase, setPhase] = useState<EntryPhase>(jiraKey ? "ask-jira" : "ask-manual");
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const durationHours = ((entry.duration ?? 0) / 3600).toFixed(2);

  return (
    <Box flexDirection="column">
      <Text>
        Entry without Redmine issue:{" "}
        <Text color="yellow">"{entry.description}"</Text> ({durationHours}h)
      </Text>

      {phase === "ask-jira" && (
        <Box flexDirection="column">
          <Text>
            Jira key detected: <Text bold>{jiraKey}</Text>. Import to Redmine? (y/n)
          </Text>
          <ConfirmInput
            onPress={(confirmed) => {
              if (confirmed) {
                setPhase("importing-jira");
              } else {
                setPhase("ask-manual");
              }
            }}
          />
        </Box>
      )}

      {phase === "importing-jira" && (
        <JiraIssueImporter
          jiraKey={jiraKey!}
          onDone={(issueId) => onResolve(issueId)}
          onSkip={() => setPhase("ask-manual")}
        />
      )}

      {phase === "ask-manual" && (
        <Box flexDirection="column">
          <Text>Enter Redmine issue # to link (or press Enter to skip):</Text>
          <TextInput
            value={manualInput}
            onChange={(val) => {
              setManualInput(val);
              setManualError(null);
            }}
            onSubmit={(val) => {
              if (!val.trim()) {
                onResolve(undefined);
                return;
              }
              const id = parseInt(val.replace("#", "").trim(), 10);
              if (isNaN(id)) {
                setManualError("Invalid issue number");
                return;
              }
              onResolve(id);
            }}
          />
          {manualError && <Text color="red">{manualError}</Text>}
        </Box>
      )}
    </Box>
  );
};

export const OrphanEntryResolver = ({
  orphans,
  onDone,
}: {
  orphans: TogglTimeEntry[];
  onDone: (resolved: ResolvedMap) => void;
}) => {
  const [index, setIndex] = useState(0);
  const [resolved, setResolved] = useState<ResolvedMap>(new Map());

  const advance = (issueId?: number) => {
    const entry = orphans[index];
    const next = new Map(resolved);
    if (issueId !== undefined) {
      next.set(entry.id!, issueId);
    }
    if (index + 1 >= orphans.length) {
      onDone(next);
    } else {
      setResolved(next);
      setIndex(index + 1);
    }
  };

  if (index >= orphans.length) {
    return null;
  }

  return (
    <Box flexDirection="column">
      {orphans.length > 1 && (
        <Text dimColor>
          [{index + 1}/{orphans.length}] entries without Redmine issue
        </Text>
      )}
      <SingleOrphanResolver
        key={orphans[index].id}
        entry={orphans[index]}
        onResolve={advance}
      />
    </Box>
  );
};
