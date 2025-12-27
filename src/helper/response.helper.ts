export class ResponseHelper {
    static Success<T>(data: T, message: string, statusCode: number) {
        return {
            data,
            message,
            statusCode,
        };
    }

    static Error<T>(message: string, statusCode: number) {
       return {
           message,
           statusCode,
       };
    }
}