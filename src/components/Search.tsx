import React, { useState } from "react";
import { Box, Text } from "ink";
import { useGetSearch, Search as SearchResult } from "@saboit/toggl-redmine-bridge/api-redmine-hooks";
import TextInput from "ink-text-input";

export const Search = () => {
  const [currentValue, setCurrentValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading } = useGetSearch('json', { q: searchQuery, offset: 0, limit: 20 }, {
    query: { enabled: searchQuery.length > 0 },
  });
  const results: SearchResult[] = data?.results ?? [];

  const handleChange = (value: string) => {
    setCurrentValue(value);
  };

  return (
    <Box flexDirection="column">
      <Box flexDirection="column" marginTop={1}>
        {isLoading && <Text>Loading...</Text>}
        {results.map((issue, idx) => {
          return (
            <Text
              key={`${issue.id}-${idx}`}
            >{`- Issue #${issue.id}: ${issue.title}`}</Text>
          );
        })}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text>Search for issues:</Text>
        <TextInput
          value={currentValue}
          onChange={handleChange}
          onSubmit={(value: string) => {
            setSearchQuery(value);
          }}
        />
      </Box>
    </Box>
  );
};
