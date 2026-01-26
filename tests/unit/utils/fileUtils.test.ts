import {
  downloadFile,
  formatDateForFilename,
  formatDateTimeForFilename
} from '@/utils/fileUtils';

// Mock browser APIs
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();
const mockClick = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();

beforeAll(() => {
  global.URL.createObjectURL = mockCreateObjectURL;
  global.URL.revokeObjectURL = mockRevokeObjectURL;
  global.document.createElement = jest.fn(() => ({
    click: mockClick,
    href: '',
    download: ''
  })) as any;
  global.document.body.appendChild = mockAppendChild;
  global.document.body.removeChild = mockRemoveChild;
  global.setTimeout = jest.fn((fn) => {
    fn();
    return 1 as any;
  }) as any;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateObjectURL.mockReturnValue('blob:http://localhost/test');
});

describe('fileUtils', () => {
  describe('formatDateForFilename', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 15); // January 15, 2026
      const result = formatDateForFilename(date);
      expect(result).toBe('2026-01-15');
    });

    it('pads single digit month and day with zeros', () => {
      const date = new Date(2026, 0, 5); // January 5, 2026
      const result = formatDateForFilename(date);
      expect(result).toBe('2026-01-05');
    });

    it('handles end of year correctly', () => {
      const date = new Date(2026, 11, 31); // December 31, 2026
      const result = formatDateForFilename(date);
      expect(result).toBe('2026-12-31');
    });
  });

  describe('formatDateTimeForFilename', () => {
    it('formats date and time as YYYY-MM-DD-HHMMSS', () => {
      const date = new Date(2026, 0, 15, 14, 30, 45);
      const result = formatDateTimeForFilename(date);
      expect(result).toBe('2026-01-15-143045');
    });

    it('pads hours, minutes, and seconds with zeros', () => {
      const date = new Date(2026, 0, 15, 5, 3, 7);
      const result = formatDateTimeForFilename(date);
      expect(result).toBe('2026-01-15-050307');
    });

    it('handles midnight correctly', () => {
      const date = new Date(2026, 0, 15, 0, 0, 0);
      const result = formatDateTimeForFilename(date);
      expect(result).toBe('2026-01-15-000000');
    });
  });

  describe('downloadFile', () => {
    it('creates blob from string content and triggers download', () => {
      const content = 'test content';
      const filename = 'test.csv';
      const mimeType = 'text/csv';

      downloadFile(content, filename, mimeType);

      // Verify blob was created
      expect(global.document.createElement).toHaveBeenCalledWith('a');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it('handles Blob content directly', () => {
      const blob = new Blob(['test'], { type: 'text/csv' });
      const filename = 'test.csv';
      const mimeType = 'text/csv';

      downloadFile(blob, filename, mimeType);

      expect(mockCreateObjectURL).toHaveBeenCalledWith(blob);
      expect(mockClick).toHaveBeenCalled();
    });

    it('sets correct download attribute on link element', () => {
      const linkElement = {
        click: mockClick,
        href: '',
        download: ''
      };
      (global.document.createElement as jest.Mock).mockReturnValue(linkElement);

      downloadFile('content', 'test.csv', 'text/csv');

      expect(linkElement.download).toBe('test.csv');
    });

    it('revokes object URL after download', () => {
      const url = 'blob:http://localhost/test';
      mockCreateObjectURL.mockReturnValue(url);

      downloadFile('content', 'test.csv', 'text/csv');

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(url);
    });

    it('throws error if download fails', () => {
      mockAppendChild.mockImplementation(() => {
        throw new Error('DOM error');
      });

      expect(() => {
        downloadFile('content', 'test.csv', 'text/csv');
      }).toThrow('Failed to download file');
    });

    it('handles errors gracefully with descriptive message', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreateObjectURL.mockImplementation(() => {
        throw new Error('URL creation failed');
      });

      expect(() => {
        downloadFile('content', 'test.csv', 'text/csv');
      }).toThrow('Failed to download file: URL creation failed');

      consoleErrorSpy.mockRestore();
    });
  });
});
