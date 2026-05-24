/**
 * 媒体处理器 - 处理下载的媒体文件，生成文本描述
 */
import { MediaDownloader } from './mediaDownloader';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('MediaProcessor');

export interface ProcessedMedia {
  type: 'voice' | 'image' | 'video' | 'file';
  text: string;
  meta: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    duration?: number;
    width?: number;
    height?: number;
  };
}

export class MediaProcessor {
  private downloader: MediaDownloader;
  private enabled: boolean;

  constructor(downloader: MediaDownloader, enabled: boolean = true) {
    this.downloader = downloader;
    this.enabled = enabled;
  }

  async processVoice(mediaId: string, duration?: string, format?: string): Promise<ProcessedMedia> {
    if (!this.enabled) {
      return {
        type: 'voice',
        text: '[语音消息] 用户发送了语音消息（媒体处理未启用）',
        meta: {},
      };
    }

    try {
      const media = await this.downloader.downloadMedia(mediaId, format || 'amr');
      const durationSec = duration ? Math.round(parseInt(duration, 10) / 1000) : 0;

      const text =
        durationSec > 0
          ? `[语音消息] 用户发送了 ${durationSec} 秒的语音消息（格式: ${media.mimeType}，大小: ${this.formatSize(media.size)}）`
          : `[语音消息] 用户发送了语音消息（格式: ${media.mimeType}，大小: ${this.formatSize(media.size)}）`;

      return {
        type: 'voice',
        text,
        meta: {
          fileName: media.fileName,
          fileSize: media.size,
          mimeType: media.mimeType,
          duration: durationSec,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process voice:', msg);
      return {
        type: 'voice',
        text: `[语音消息] 用户发送了语音消息（处理失败: ${msg}）`,
        meta: { duration: duration ? parseInt(duration, 10) / 1000 : 0 },
      };
    }
  }

  async processImage(downloadCode: string, downloadUrl?: string): Promise<ProcessedMedia> {
    if (!this.enabled) {
      return {
        type: 'image',
        text: '[图片消息] 用户发送了一张图片（媒体处理未启用）',
        meta: {},
      };
    }

    try {
      let media;
      if (downloadUrl) {
        logger.log(`Downloading image from URL: ${downloadUrl.substring(0, 50)}...`);
        const response = await fetch(downloadUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        media = {
          buffer,
          mimeType: response.headers.get('content-type') || 'image/jpeg',
          fileName: `image_${downloadCode.substring(0, 8)}.jpg`,
          size: buffer.length,
        };
      } else {
        media = await this.downloader.downloadMedia(downloadCode, 'jpg');
      }

      return {
        type: 'image',
        text: `[图片消息] 用户发送了一张图片（格式: ${media.mimeType}，大小: ${this.formatSize(media.size)}）`,
        meta: {
          fileName: media.fileName,
          fileSize: media.size,
          mimeType: media.mimeType,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process image:', msg);
      return {
        type: 'image',
        text: `[图片消息] 用户发送了一张图片（处理失败: ${msg}）`,
        meta: {},
      };
    }
  }

  async processVideo(mediaId: string): Promise<ProcessedMedia> {
    if (!this.enabled) {
      return {
        type: 'video',
        text: '[视频消息] 用户发送了视频消息（媒体处理未启用）',
        meta: {},
      };
    }

    try {
      const media = await this.downloader.downloadMedia(mediaId, 'mp4');

      return {
        type: 'video',
        text: `[视频消息] 用户发送了视频（格式: ${media.mimeType}，大小: ${this.formatSize(media.size)}）`,
        meta: {
          fileName: media.fileName,
          fileSize: media.size,
          mimeType: media.mimeType,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process video:', msg);
      return {
        type: 'video',
        text: `[视频消息] 用户发送了视频消息（处理失败: ${msg}）`,
        meta: {},
      };
    }
  }

  async processFile(mediaId: string, fileName: string): Promise<ProcessedMedia> {
    if (!this.enabled) {
      return {
        type: 'file',
        text: `[文件消息] 用户发送了文件: ${fileName}（媒体处理未启用）`,
        meta: { fileName },
      };
    }

    try {
      const ext = fileName.split('.').pop() || 'bin';
      const media = await this.downloader.downloadMedia(mediaId, ext);

      return {
        type: 'file',
        text: `[文件消息] 用户发送了文件: ${fileName}（大小: ${this.formatSize(media.size)}）`,
        meta: {
          fileName,
          fileSize: media.size,
          mimeType: media.mimeType,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error('Failed to process file:', msg);
      return {
        type: 'file',
        text: `[文件消息] 用户发送了文件: ${fileName}（处理失败: ${msg}）`,
        meta: { fileName },
      };
    }
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }
}
