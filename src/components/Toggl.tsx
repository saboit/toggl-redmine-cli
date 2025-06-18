import React, { useState } from "react";
import { CommandsProps } from "./types.js";
import {
  getDateString,
  getDaysFromDate
} from "../lib/helpers.js";
import { Box, Text, useApp } from "ink";
import { useMutation, useQuery } from "@tanstack/react-query";
import { fetchTogglTimeEntries, getProjectNames } from "../lib/toggl.js";
import { prepareRedmineEntries, trackTimeInRedmine } from "../lib/redmine.js";
import { ConfirmInput } from "./ConfirmInput.js";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const days = getDaysFromDate(today);

const TogglInternal = ({
  date,
  totalHours,
}: {
  date: string;
  totalHours: number;
}) => {
  const { exit } = useApp();
  const [shouldTrackRedmine, setShouldTrackRedmine] = useState(false);
  const [reportedHoursSum, setReportedHoursSum] = useState(0);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["toggl", date],
    queryFn: async () => {
      const togglWorkspaceStr = process.env.TOGGL_WORKSPACE_ID!;
      const togglWorkspaceNum = Number.parseInt(togglWorkspaceStr, 10);

      let togglEntries = await fetchTogglTimeEntries(
        date,
        togglWorkspaceNum
      );
      const togglProjectNames = await getProjectNames(togglWorkspaceNum);
      let reportedSecondsSum = 0;
      togglEntries.forEach((entry) => {
        if (!entry.project_id) {
          console.log(`No project id, RM ID expected in: "${entry.description}"`);
        } else {
          let projectName = togglProjectNames[entry.project_id!];
          if(!projectName) {
            console.log(`Toggl project ID ${entry.project_id} does not have a name!`);
            projectName = "UNDEFINED_PROJECT_NAME"
          }
          entry.project_name = projectName;
        }
        reportedSecondsSum += entry.duration || 0;
      });
      setReportedHoursSum(reportedSecondsSum / (60*60));
      return prepareRedmineEntries(togglEntries, totalHours);
    },
    refetchOnWindowFocus: false,
  });

  const { mutate, isSuccess, isPending } = useMutation({
    mutationKey: ["track", date],
    mutationFn: async () => {
      await trackTimeInRedmine(entries);
    },
    onSuccess: () => {
      exit();
    },
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (entries.length === 0) {
    return (
      <Text color="red">No time entries found for the selected date.</Text>
    );
  }

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
            {`Do you want to proceed with tracking ${reportedHoursSum}h time entries in Redmine? y/n`}
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
  const [submittedHours, setSubmittedHours] = useState(() => {
    const parsedValue = parseInt(arg2);
    return isNaN(parsedValue) ? undefined : parsedValue;
  });
  const [totalHours, setTotalHours] = useState(arg2);
  const [shouldTrack, setShouldTrack] = useState(false);
  const { exit } = useApp();

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

  if (submittedHours == null || submittedHours === undefined) {
    const parsedValue = totalHours?.toString() ?? "";
    return (
      <Box>
        <Text>Enter total hours for date "{selectedDate}":</Text>
        <TextInput
          value={parsedValue}
          onChange={(input) => {
            setTotalHours(input);
          }}
          onSubmit={() => {
            const parsedValue = (totalHours && parseInt(totalHours)) || 0;
            setSubmittedHours(parsedValue);
          }}
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
