import { ApiMessageHelper, ApiMessage } from './api-message.helper';

describe('ApiMessageHelper', () => {
  const makeMessage = (overrides: Partial<ApiMessage> = {}): ApiMessage => ({
    message: overrides.message ?? 'Test message',
    level: overrides.level ?? 'INFO',
    type: overrides.type ?? 'GENERAL',
    time: overrides.time,
  });

  describe('processApiMessages', () => {
    it('returns failure when messages is null', () => {
      const result = ApiMessageHelper.processApiMessages(null as any);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('No response messages received');
      expect(result.filteredMessages).toEqual([]);
    });

    it('returns failure when messages is not an array', () => {
      const result = ApiMessageHelper.processApiMessages({} as any);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('No response messages received');
    });

    it('returns success when no errors exist', () => {
      const messages = [
        makeMessage({ level: 'INFO', message: 'Operation completed' }),
        makeMessage({ level: 'SUCCESS', message: 'Data saved' }),
      ];
      
      const result = ApiMessageHelper.processApiMessages(messages);
      
      expect(result.success).toBeTrue();
      expect(result.errorMessage).toBeUndefined();
      expect(result.filteredMessages.length).toBe(2);
    });

    it('returns failure when error level message exists', () => {
      const messages = [
        makeMessage({ level: 'INFO' }),
        makeMessage({ level: 'ERROR', message: 'Failed to save' }),
      ];
      
      const result = ApiMessageHelper.processApiMessages(messages);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('Failed to save');
    });

    it('filters messages by type when specified', () => {
      const messages = [
        makeMessage({ type: 'SAVE_DATA', level: 'INFO' }),
        makeMessage({ type: 'LOAD_DATA', level: 'INFO' }),
        makeMessage({ type: 'SAVE_DATA', level: 'SUCCESS' }),
      ];
      
      const result = ApiMessageHelper.processApiMessages(messages, { messageType: 'SAVE_DATA' });
      
      expect(result.filteredMessages.length).toBe(2);
      expect(result.filteredMessages.every(m => m.type === 'SAVE_DATA')).toBeTrue();
    });

    it('uses custom error levels', () => {
      const messages = [
        makeMessage({ level: 'WARNING', message: 'This is a warning' }),
      ];
      
      const result = ApiMessageHelper.processApiMessages(messages, { errorLevels: ['WARNING', 'ERROR'] });
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('This is a warning');
    });

    it('requires messages when requireMessages is true', () => {
      const messages = [
        makeMessage({ type: 'OTHER_TYPE' }),
      ];
      
      const result = ApiMessageHelper.processApiMessages(messages, {
        messageType: 'SAVE_DATA',
        requireMessages: true,
      });
      
      expect(result.success).toBeFalse();
      expect(result.filteredMessages.length).toBe(0);
    });
  });

  describe('processSheetSaveResponse', () => {
    it('returns failure when no messages provided', () => {
      const result = ApiMessageHelper.processSheetSaveResponse(null as any);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('No response messages received');
    });

    it('returns failure when no SAVE_DATA messages exist', () => {
      const messages = [
        makeMessage({ type: 'OTHER_TYPE', level: 'INFO' }),
      ];
      
      const result = ApiMessageHelper.processSheetSaveResponse(messages);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('No save status messages received from server');
    });

    it('returns success when SAVE_DATA messages exist without errors', () => {
      const messages = [
        makeMessage({ type: 'SAVE_DATA', level: 'INFO', message: 'Saving...' }),
        makeMessage({ type: 'SAVE_DATA', level: 'SUCCESS', message: 'Saved' }),
      ];
      
      const result = ApiMessageHelper.processSheetSaveResponse(messages);
      
      expect(result.success).toBeTrue();
      expect(result.filteredMessages.length).toBe(2);
    });

    it('returns failure when SAVE_DATA has error', () => {
      const messages = [
        makeMessage({ type: 'SAVE_DATA', level: 'ERROR', message: 'Save failed' }),
      ];
      
      const result = ApiMessageHelper.processSheetSaveResponse(messages);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('Save failed');
    });

    it('returns failure when no success or error messages', () => {
      const messages = [
        makeMessage({ type: 'SAVE_DATA', level: 'DEBUG', message: 'Processing...' }),
      ];
      
      const result = ApiMessageHelper.processSheetSaveResponse(messages);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('Save operation status unclear - no success or error messages');
    });
  });

  describe('processSheetLoadResponse', () => {
    it('filters to LOAD_DATA messages', () => {
      const messages = [
        makeMessage({ type: 'LOAD_DATA', level: 'INFO' }),
        makeMessage({ type: 'SAVE_DATA', level: 'INFO' }),
      ];
      
      const result = ApiMessageHelper.processSheetLoadResponse(messages);
      
      expect(result.filteredMessages.length).toBe(1);
      expect(result.filteredMessages[0].type).toBe('LOAD_DATA');
    });

    it('detects errors in load messages', () => {
      const messages = [
        makeMessage({ type: 'LOAD_DATA', level: 'ERROR', message: 'Load failed' }),
      ];
      
      const result = ApiMessageHelper.processSheetLoadResponse(messages);
      
      expect(result.success).toBeFalse();
      expect(result.errorMessage).toBe('Load failed');
    });
  });
});
