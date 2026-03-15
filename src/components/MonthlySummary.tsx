import React from "react";
import { Box, Text } from "ink";
import { useQuery } from "@tanstack/react-query";
import { getTimeEntries } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import { getDaysFromDate } from "../lib/helpers.js";

const today = new Date();
const year = today.getFullYear();
const month = today.getMonth();
const days = getDaysFromDate();

export const MonthlySummary = () => {
  const { data = [], isLoading } = useQuery({
    queryKey: ["monthly-summary", month, year],
    queryFn: () => {
      return Promise.all(
        days.map(async (day) => {
          const date = new Date(year, month, day);
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
          date.setDate(date.getDate() + 1);
          const dateString = date.toISOString().split("T")[0];
          const result = await getTimeEntries('json', { user_id: "me", spent_on: dateString });
          const totalHours = result.time_entries.reduce(
            (acc, entry) => acc + entry.hours,
            0
          );
          const isHoliday =
            dayName.toLowerCase() === "saturday" ||
            dayName.toLowerCase() === "sunday";
          const dayIcon = isHoliday ? "💤" : totalHours >= 7.5 ? "✔️" : "⚠️";
          return `${dateString} - ${dayName.padEnd(15)} ${Math.round(
            totalHours
          )} ${dayIcon}`;
        })
      );
    },
  });

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box flexDirection="column">
      {data.map((entry, idx) => {
        return (
          <Text key={idx} color="green">
            {entry}
          </Text>
        );
      })}
    </Box>
  );
};
