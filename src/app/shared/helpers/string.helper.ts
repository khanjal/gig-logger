export class StringHelper {
    static truncate(text: string, length: number = 20, suffix: string = '...'): string {
        if (text?.length > length) {
            let truncated: string = text.substring(0, length).trim() + suffix;
            return truncated;
        }
    
        return text;
    }
}