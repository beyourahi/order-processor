export interface CSVParseResult {
    data: string[][];
    errors: Array<{
        type: string;
        code: string;
        message: string;
        row?: number | undefined;
    }>;
    meta: {
        delimiter: string;
        linebreak: string;
        aborted: boolean;
        truncated: boolean;
        cursor: number;
    };
}
