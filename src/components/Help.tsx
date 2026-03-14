import { Box, Text } from "ink";
import React, { useState, useEffect } from "react";

export const Help = () => {
  return (
    <Box flexDirection="column">
      <Box flexDirection="column">
        <Text>{"📖 Usage:"}</Text>
        <Text>
          {"🚀 create-task <taskName> <projectName> - Create a new task"}
        </Text>
        <Text>{"🔍 search <query> - Search for issues"}</Text>
        <Text>
          {
            "⏱️  toggl <daysAgo> <hours> - Import time entries from Toggl to Redmine"
          }
        </Text>
        <Text>
          {
            "⏱️  track <issueID> <hours> <comment> <daysAgo> - Track hours directly to a task in Redmine"
          }
        </Text>
        <Text>
          {
            "📅 get-entries <daysAgo> - Fetch and print your tracked time entries in Redmine"
          }
        </Text>
        <Text>
          {"❌ delete <daysAgo> - Delete a time entry for a specific day"}
        </Text>
        <Text>
          {"📅 print-monthly-summary - Print a summary of your tracked hours for the current"}
        </Text>
        <Text>
          {"🔗 import-jira-issue [KEY...] - Import Jira issue(s) into Redmine (e.g. PROJ-123)"}
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text>{"⚙️  Options:"}</Text>
        <Text>{"-h, --help  Show help"}</Text>
      </Box>
    </Box>
  );
};
