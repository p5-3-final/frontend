export const settingsQueryKeys = {
  all: ["retention"] as const,
  settings: () => [...settingsQueryKeys.all, "settings"] as const,
  retainedLists: () => [...settingsQueryKeys.all, "retained"] as const,
  retained: (page: number) => [...settingsQueryKeys.retainedLists(), page] as const,
};
