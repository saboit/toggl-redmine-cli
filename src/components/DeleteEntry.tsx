import React, { Fragment, useState } from "react";
import { CommandsProps } from "./types.js";
import { getDateString } from "../lib/helpers.js";
import { useGetTimeEntries, useDeleteTimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { Box, Text } from "ink";
import SelectInput from "ink-select-input";
import { TimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine";
import { deleteTimeEntry } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { useMutation } from "@tanstack/react-query";

type DeleteOption = 'all' | 'select';

interface BatchDeleteResult {
  successCount: number;
  failedCount: number;
  errors: string[];
}

const DeleteAllEntries = ({ date, entries }: { date: string, entries: TimeEntry[] }) => {
  const { mutate, isPending, isSuccess, isError, data, error } = useMutation<BatchDeleteResult, Error, void>({
    mutationKey: ["deleteAll", date],
    mutationFn: async () => {
      const result: BatchDeleteResult = { successCount: 0, failedCount: 0, errors: [] };

      for (const entry of entries) {
        try {
          await deleteTimeEntry(entry.id, 'json');
          result.successCount++;
        } catch (err: unknown) {
          result.failedCount++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push(`Entry #${entry.id}: ${errorMsg}`);
        }
      }

      // Throw if all failed to trigger error state
      if (result.successCount === 0 && result.failedCount > 0) {
        throw new Error(`Failed to delete all ${result.failedCount} entries`);
      }

      return result;
    },
  });

  // Trigger mutation on first render only
  React.useEffect(() => {
    mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box flexDirection="column">
      <Text color="yellow">Deleting all entries from {date}...</Text>
      {isPending && <Text color="yellow">Deleting {entries.length} entries...</Text>}
      {isSuccess && (
        <Box flexDirection="column">
          <Text color="green">
            {data!.successCount} entries deleted successfully
          </Text>
          {data!.failedCount > 0 && (
            <>
              <Text color="red">{data!.failedCount} entries failed to delete</Text>
              {data!.errors.map((err, idx) => (
                <Text key={idx} color="red">  - {err}</Text>
              ))}
            </>
          )}
        </Box>
      )}
      {isError && <Text color="red">{`Error: ${error.message}`}</Text>}
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
