export const videoQueryKeys = {
  all: ["videos"] as const,
  list: (page: number) => [...videoQueryKeys.all, "list", page] as const,
};
