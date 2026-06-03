// Output download name: `formatted-orders-<courier>.xlsx` (courier lowercased).
const FILE_PREFIX = "formatted-orders";
const FILE_EXTENSION = ".xlsx";

export const generateFileName = (courierName: string): string => {
    return `${FILE_PREFIX}-${courierName.toLowerCase()}${FILE_EXTENSION}`;
};
