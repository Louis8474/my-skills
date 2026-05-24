import { MediaProcessor } from '../mediaProcessor';
import type { ProcessedMedia } from '../mediaProcessor';

// Mock MediaDownloader
const mockDownload = jest.fn();
const mockDownloader = {
  downloadMedia: mockDownload,
  getAccessToken: jest.fn().mockResolvedValue('test-token'),
} as any;

describe('MediaProcessor', () => {
  let processor: MediaProcessor;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new MediaProcessor(mockDownloader, true);
  });

  test('processes voice message when enabled', async () => {
    mockDownload.mockResolvedValue({
      buffer: Buffer.from('audio-data'),
      mimeType: 'audio/amr',
      fileName: 'media_test.amr',
      size: 1024,
    });

    const result = await processor.processVoice('media-123', '5000', 'amr');

    expect(result.type).toBe('voice');
    expect(result.text).toContain('语音消息');
    expect(result.text).toContain('5 秒');
    expect(result.meta.duration).toBe(5);
    expect(result.meta.mimeType).toBe('audio/amr');
  });

  test('returns placeholder when disabled', async () => {
    const disabledProcessor = new MediaProcessor(mockDownloader, false);
    const result = await disabledProcessor.processVoice('media-123');

    expect(result.type).toBe('voice');
    expect(result.text).toContain('媒体处理未启用');
    expect(mockDownload).not.toHaveBeenCalled();
  });

  test('handles download failure gracefully', async () => {
    mockDownload.mockRejectedValue(new Error('Network error'));

    const result = await processor.processVoice('media-123');

    expect(result.type).toBe('voice');
    expect(result.text).toContain('处理失败');
  });

  test('processes image message', async () => {
    // Use downloadCode path (without URL) to avoid real fetch TLS handle leak
    mockDownload.mockResolvedValue({
      buffer: Buffer.from('image-data'),
      mimeType: 'image/jpeg',
      fileName: 'image_test.jpg',
      size: 2048,
    });

    const result = await processor.processImage('code-123');

    expect(result.type).toBe('image');
    expect(result.text).toContain('图片消息');
  });

  test('processes image without URL', async () => {
    mockDownload.mockResolvedValue({
      buffer: Buffer.from('image-data'),
      mimeType: 'image/jpeg',
      fileName: 'image_test.jpg',
      size: 2048,
    });

    const result = await processor.processImage('code-123');

    expect(result.type).toBe('image');
    expect(result.text).toContain('图片消息');
  });

  test('processes video message', async () => {
    mockDownload.mockResolvedValue({
      buffer: Buffer.from('video-data'),
      mimeType: 'video/mp4',
      fileName: 'media_test.mp4',
      size: 10240,
    });

    const result = await processor.processVideo('media-123');

    expect(result.type).toBe('video');
    expect(result.text).toContain('视频消息');
  });

  test('processes file message', async () => {
    mockDownload.mockResolvedValue({
      buffer: Buffer.from('file-data'),
      mimeType: 'application/pdf',
      fileName: 'document.pdf',
      size: 5120,
    });

    const result = await processor.processFile('media-123', 'document.pdf');

    expect(result.type).toBe('file');
    expect(result.text).toContain('document.pdf');
  });

  test('formats file sizes correctly', async () => {
    mockDownload.mockResolvedValue({
      buffer: Buffer.alloc(1024 * 1024 * 2),
      mimeType: 'video/mp4',
      fileName: 'large.mp4',
      size: 1024 * 1024 * 2,
    });

    const result = await processor.processVideo('media-123');
    expect(result.text).toContain('2.0MB');
  });
});
