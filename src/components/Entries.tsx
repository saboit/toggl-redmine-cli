import React from "react";
import { getDateString } from "../lib/helpers.js";
import { Box, Text } from "ink";
import { useGetTimeEntries, TimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { CommandsProps } from "./types.js";

export const Entries = ({ args }: CommandsProps) => {
  const [arg1] = args ?? [];
  const daysAgo = arg1 ? parseInt(arg1) : 0;
  const date = getDateString(daysAgo);
  const { data, isLoading } = useGetTimeEntries('json', { user_id: "me", spent_on: date }, {
    query: { queryKey: ["entries", date], refetchOnWindowFocus: false },
  });
  const entries: TimeEntry[] = data?.time_entries ?? [];

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (entries.length === 0) {
    return <Text>No time entries found for {date}</Text>;
  }

  return (
    <Box flexDirection="column">
      {entries.map((entry, idx) => {
        return (
          <Text
            key={`${entry.issue!.id}-${idx}`}
          >{`- Issue #${entry.issue!.id}: ${entry.hours}h - ${entry.comments}`}</Text>
        );
      })}
    </Box>
  );
};
