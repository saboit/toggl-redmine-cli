import React, { useMemo, useState } from "react";
import { CommandsProps } from "./types.js";
import {
  getDateString,
  getDaysFromDate
} from "../lib/helpers.js";
import { Box, Text, useApp } from "ink";
import { useMutation } from "@tanstack/react-query";
import { prepareRedmineEntries, getOrphanEntries } from "../lib/redmine.js";
import { ConfirmInput } from "./ConfirmInput.js";
import SelectInput from "ink-select-input";
import { createTimeEntry, } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { useGetMyTimeEntries } from "@saboit/toggl-redmine-bridge/api-toggl-hooks";
import { OrphanEntryResolver } from "./OrphanEntryResolver.js";

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const days = getDaysFromDate(today);

const TogglInternal = ({
  date,
  totalHours,
}: {
  date: string;
  totalHours?: number;
}) => {
  const { exit } = useApp();
  const [orphansResolved, setOrphansResolved] = useState(false);
  const [shouldTrackRedmine, setShouldTrackRedmine] = useState(false);
  const [resolvedIssueIds, setResolvedIssueIds] = useState<Map<number, number>>(new Map());
  const { data: timeEntries, isLoading } = useGetMyTimeEntries({ start_date: date, end_date: date });

  const timeEntriesForDate = useMemo(
    () => timeEntries?.filter((entry) => entry.start?.startsWith(date)) ?? [],
    [date, timeEntries]
  );

  const orphans = useMemo(() => getOrphanEntries(timeEntriesForDate), [timeEntriesForDate]);

  const entries = useMemo(
    () => prepareRedmineEntries(timeEntriesForDate, totalHours ?? 0, resolvedIssueIds),
    [timeEntriesForDate, totalHours, resolvedIssueIds]
  );

  const { mutate, isSuccess, isPending } = useMutation({
    mutationKey: ["track", date],
    mutationFn: async () => {
      for (const entry of entries) {
        try {
          const result = await createTimeEntry('json', entry as any);
          const created = result.time_entry;
          console.log(`Redmine entry "${created.id} ${created.comments}" CREATED ${created.issue?.id}`);
        } catch (error: any) {
          const msg = `Redmine entry "${entry.time_entry.issue_id} ${entry.time_entry.comments}" ERROR ${error.message}`;
          console.log(msg);
          throw error;
        }
      }
    },
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!orphansResolved && orphans.length > 0) {
    return (
      <OrphanEntryResolver
        orphans={orphans}
        onDone={(resolved) => {
          setResolvedIssueIds(resolved);
          setOrphansResolved(true);
        }}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <Text color="red">No time entries found for the selected date.</Text>
    );
  }

  const hoursToReport = totalHours ?? entries.reduce((sum, entry) => sum + (entry.time_entry.hours || 0), 0);

  return (
    <Box flexDirection="column">
      <Text>Time entries to be tracked in Redmine:</Text>
      {entries.map((entry, idx) => {
        const issueId = entry.time_entry.issue_id;
        const hours = entry.time_entry.hours;
        const comments = entry.time_entry.comments;
        return (
          <Text key={`${issueId}-${idx}`}>
            {`- Issue #${issueId}: ${hours}h - ${comments}`}
          </Text>
        );
      })}
      {!shouldTrackRedmine && (
        <Box flexDirection="column">
          <Text>
            {`Do you want to proceed with tracking ${hoursToReport.toFixed(2)}h time entries in Redmine? y/n`}
          </Text>
          <ConfirmInput
            onPress={(checked) => {
              if (checked) {
                setShouldTrackRedmine(checked);
                mutate();
              } else {
                exit();
              }
            }}
          />
        </Box>
      )}
      {isPending && <Text>Tracking time entries...</Text>}
      {isSuccess && <Text>Time entries tracked successfully!</Text>}
    </Box>
  );
};

const options = days
  .map((day) => {
    const date = new Date(year, month, day);
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    date.setDate(date.getDate() + 1);
    const dateString = date.toISOString().split("T")[0];
    return {
      label: `${dateString} - ${dayName}`,
      value: dateString,
    };
  })
  .reverse();

export const Toggl = ({ args }: CommandsProps) => {
  const [arg1, arg2] = args ?? [];
  const daysAgo = parseInt(arg1);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (isNaN(daysAgo)) {
      return undefined;
    }
    return getDateString(daysAgo);
  });

  const [totalHours, _setTotalHours] = useState(arg2);
  const [shouldTrack, setShouldTrack] = useState(false);
  const { exit } = useApp();

  const parsedValue = parseInt(arg2);
  const submittedHours = isNaN(parsedValue) ? undefined : parsedValue;

  if (!selectedDate) {
    return (
      <Box flexDirection="column">
        <Text>Select a date:</Text>
        <SelectInput
          items={options}
          limit={10}
          onSelect={(item) => setSelectedDate(item.value)}
        />
      </Box>
    );
  }

  if (!shouldTrack) {
    return (
      <Box>
        <Text>
          Track {totalHours} hours for date "{selectedDate}"? (y/n)
        </Text>
        <ConfirmInput
          onPress={(checked) => {
            if (!checked) {
              exit();
              return;
            }
            setShouldTrack(checked);
          }}
        />
      </Box>
    );
  }

  return <TogglInternal date={selectedDate} totalHours={submittedHours} />;
};
