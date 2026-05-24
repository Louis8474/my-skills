/**
 * 媒体下载器测试
 */
import axios from 'axios';
import { MediaDownloader } from '../mediaDownloader';

jest.mock('axios', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockedAxios = axios as unknown as { get: jest.Mock };

describe('MediaDownloader', () => {
  let mockDingtalkService: any;
  let downloader: MediaDownloader;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockDingtalkService = {
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
    };
    downloader = new MediaDownloader(mockDingtalkService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should delegate to dingtalkService on first call', async () => {
      const token = await downloader.getAccessToken();
      expect(token).toBe('test-token');
      expect(mockDingtalkService.getAccessToken).toHaveBeenCalledTimes(1);
    });

    it('should cache token on subsequent calls', async () => {
      await downloader.getAccessToken();
      const token2 = await downloader.getAccessToken();
      expect(token2).toBe('test-token');
      expect(mockDingtalkService.getAccessToken).toHaveBeenCalledTimes(1);
    });
  });

  describe('downloadMedia', () => {
    it('should download media and return buffer with metadata', async () => {
      const testBuffer = Buffer.from('test audio data');
      mockedAxios.get.mockResolvedValueOnce({
        data: testBuffer,
        headers: { 'content-type': 'audio/amr' },
      });

      const result = await downloader.downloadMedia('media123');
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.mimeType).toBe('audio/amr');
      expect(result.fileName).toContain('media123');
      expect(result.size).toBe(testBuffer.length);
    });

    it('should use format parameter for extension', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('data'),
        headers: { 'content-type': 'audio/mpeg' },
      });

      const result = await downloader.downloadMedia('media456', 'wav');
      expect(result.fileName).toContain('.wav');
    });
  });
});
