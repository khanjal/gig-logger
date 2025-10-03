export interface ApiMessage {
    message: string;
    level: string;
    type: string;
    time?: number;
}

export interface MessageProcessingResult {
    success: boolean;
    errorMessage?: string;
    filteredMessages: ApiMessage[];
    allMessages: ApiMessage[];
}

export interface MessageFilterOptions {
    /** Filter messages by type (e.g., 'SAVE_DATA', 'LOAD_DATA') */
    messageType?: string;
    /** Levels to consider as errors (defaults to ['ERROR']) */
    errorLevels?: string[];
    /** Whether to require at least one message of the specified type */
    requireMessages?: boolean;
}

export class ApiMessageHelper {
    /**
     * Processes messages from API response and determines success based on error levels
     * @param messages Array of messages from the API response
     * @param options Filtering and processing options
     * @returns Object containing success status, error message, and filtered messages
     */
    static processApiMessages(messages: ApiMessage[], options: MessageFilterOptions = {}): MessageProcessingResult {
        const {
            messageType,
            errorLevels = ['ERROR'],
            requireMessages = false
        } = options;

        if (!messages || !Array.isArray(messages)) {
            return {
                success: false,
                errorMessage: 'No response messages received',
                filteredMessages: [],
                allMessages: []
            };
        }

        // Filter messages by type if specified
        const filteredMessages = messageType 
            ? messages.filter((msg: ApiMessage) => msg.type === messageType)
            : messages;
        
        // Check for error messages in the filtered set
        const errorMessage = filteredMessages.find((msg: ApiMessage) => 
            errorLevels.includes(msg.level)
        );

        // Determine success
        const hasErrors = !!errorMessage;
        const hasRequiredMessages = !requireMessages || filteredMessages.length > 0;
        
        return {
            success: !hasErrors && hasRequiredMessages,
            errorMessage: errorMessage?.message,
            filteredMessages: filteredMessages,
            allMessages: messages
        };
    }

    /**
     * Convenience method for processing sheet save responses
     * @param messages Array of messages from postSheetData response
     * @returns Processed result focused on SAVE_DATA messages
     */
    static processSheetSaveResponse(messages: ApiMessage[]): MessageProcessingResult {
        return this.processApiMessages(messages, {
            messageType: 'SAVE_DATA',
            errorLevels: ['ERROR']
        });
    }

    /**
     * Convenience method for processing sheet load responses
     * @param messages Array of messages from getSheetData response
     * @returns Processed result focused on LOAD_DATA messages
     */
    static processSheetLoadResponse(messages: ApiMessage[]): MessageProcessingResult {
        return this.processApiMessages(messages, {
            messageType: 'LOAD_DATA',
            errorLevels: ['ERROR']
        });
    }
}