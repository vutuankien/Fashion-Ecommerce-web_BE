export class ResponseHelper {
    private static safeStringifyMessage(input: unknown): string {
        try {
            if (typeof input === 'string') return input;
            if (input instanceof Error) return input.message || String(input);
            // Try JSON.stringify, handle circular structures
            try {
                return JSON.stringify(input);
            } catch {
                // Fallback to toString
                return String(input);
            }
        } catch {
            return 'Unknown error';
        }
    }

    static Success<T>(data: T, message: string, statusCode: number) {
        return {
            data,
            message,
            statusCode,
        };
    }

    static Error(message: unknown, statusCode: number) {
        return {
            message: this.safeStringifyMessage(message),
            statusCode,
        };
    }
}