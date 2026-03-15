import React, { Fragment, useEffect, useState } from "react";
import { CommandsProps } from "./types.js";
import { getDateString } from "../lib/helpers.js";
import { useGetTimeEntries, useDeleteTimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { TimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine";

type DeleteOption = 'all' | 'select';


const DeleteAllEntries = ({ date, entries }: { date: string, entries: TimeEntry[] }) => {
  const { mutate, isPending, isSuccess, isError, error } = useDeleteTimeEntry();
  useEffect(() => {
    if (entries.length > 0) {
      entries.forEach(entry => {
        mutate({ timeEntryId: entry.id, format: 'json' });
      });
    }
  }, [entries, mutate]);

  return (
    <Box flexDirection="column">
      <Text color="yellow">Deleting all entries from {date}...</Text>
      {isPending && <Text color="yellow">Deleting...</Text>}
      {isSuccess && <Text color="green">Entries deleted successfully</Text>}
      {isError && <Text color="red">{`Error: ${error && 'errors' in error ? error.errors.join(', ') : 'Unknown error'}`}</Text>}
    </Box>
  );
}

export const DeleteEntry = ({ args }: CommandsProps) => {
  const [arg1] = args ?? [];
  const daysAgoDelete = arg1 ? parseInt(arg1) : 0;
  const [deleteOption, setDeleteOption] = useState<DeleteOption>()
  const date = getDateString(daysAgoDelete);
  const {
    data,
    isFetching,
  } = useGetTimeEntries('json', { user_id: "me", spent_on: date }, {
    query: { queryKey: ["delete", date] },
  });
  const entries = data?.time_entries ?? [];

  const { mutate, isPending, isSuccess, isError, error } = useDeleteTimeEntry();

  const options = entries.map((entry, idx) => {
    return {
      key: `${entry.issue!.id}-${idx}`,
      value: entry.id,
      label: `Issue #${entry.issue!.id}: ${entry.hours}h - ${entry.comments}`,
    };
  });

  const handleSelect = (item: { value: number }) => {
    mutate({ timeEntryId: item.value, format: 'json' });
  };

  const isEmpty = options.length === 0;
  if (!deleteOption) {
    return (
      <Box flexDirection="column">
        {entries.map((entry, idx) => (
          <Text key={`${entry.id}-${idx}`}>
            Issue #{entry.issue!.id}: {entry.hours}h - {entry.comments}
          </Text>
        ))}
        <Text color="yellow">Delete entries from {date} ({new Date(date).toLocaleDateString("en-US", { weekday: "long" })})?</Text>
        <SelectInput
          items={[
            { label: "Delete all", value: "all" },
            { label: "Select entry to delete", value: "select" },
          ]}
          onSelect={(item) => setDeleteOption(item.value as DeleteOption)}
        />
      </Box>
    );
  }

  if (deleteOption === 'all') {
    return <DeleteAllEntries date={date} entries={entries as TimeEntry[]} />
  }

  return (
    <Box flexDirection="column">
      {isFetching && <Text color="yellow">Fetching entries...</Text>}
      {!isFetching && isEmpty && <Text color="red">No entries found</Text>}
      {!isEmpty && (
        <Fragment>
          <Text color="red">Select entry to delete:</Text>
          <SelectInput items={options} onSelect={handleSelect} />
        </Fragment>
      )}
      {isError && <Text color="red">{`Error: ${error && 'errors' in error ? error.errors.join(', ') : 'Unknown error'}`}</Text>}
      {isPending && <Text color="yellow">Deleting...</Text>}
      {isSuccess && <Text color="green">Entry deleted successfully</Text>}
    </Box>
  );
};
