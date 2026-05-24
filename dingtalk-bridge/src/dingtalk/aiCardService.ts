/**
 * 钉钉 AI Card 服务 - 封装流式卡片 API
 *
 * 基于 createAndDeliver 统一接口创建并投放卡片
 * 核心流程：
 * 1. createCard() - 创建并投放 AI Card（createAndDeliver 一步完成）
 * 2. streamUpdate() - 流式更新卡片内容
 * 3. finish() - 完成卡片，标记为 finished
 */
import axios, { AxiosError } from 'axios';
import { config } from '../config';
import type { DingtalkAccessTokenResponse } from '../types/dingtalk-api';
import { createSafeLogger } from '../utils/logger';

const logger = createSafeLogger('AICard');

/** AI Card 实例 */
export interface AICardInstance {
  /** 卡片唯一标识 */
  cardInstanceId: string;
  /** Access Token */
  accessToken: string;
  /** Token 过期时间 */
  tokenExpireTime: number;
  /** INPUTING 状态是否已启动 */
  inputingStarted: boolean;
  /** 会话 ID */
  conversationId: string;
  /** 发送者类型 */
  senderType: 'user' | 'group';
  /** 用户 ID */
  userId: string;
}

/** 卡片投放目标 */
interface CardTarget {
  type: 'user' | 'group';
  userId: string;
  openConversationId: string;
}

/** 默认 AI 卡片模板 ID（钉钉官方 AI 卡片模板 - 打字机效果） */
const DEFAULT_CARD_TEMPLATE_ID = '02fcf2f4-5e02-4a85-b672-46d1f715543e.schema';

/** 卡片状态 */
const AICardStatus = {
  PROCESSING: '1',
  INPUTING: '2',
  FINISHED: '3',
  EXECUTING: '4',
  FAILED: '5',
} as const;

/**
 * 钉钉 API 基础 URL
 */
const DINGTALK_API = 'https://api.dingtalk.com';

/**
 * 获取 Access Token
 */
async function getAccessToken(): Promise<string> {
  const { appKey, appSecret } = config.dingtalk;

  if (!appKey || !appSecret) {
    throw new Error('缺少钉钉配置：appKey 或 appSecret');
  }

  const response = await axios.post<DingtalkAccessTokenResponse>(
    `${DINGTALK_API}/v1.0/oauth2/accessToken`,
    { appKey, appSecret },
    { headers: { 'Content-Type': 'application/json' } }
  );

  // 新 API 响应：accessToken 字段（小写）
  if (response.data.accessToken) {
    return response.data.accessToken;
  }
  // 兜底旧格式（errcode 字段）
  if (response.data.errcode !== 0) {
    throw new Error(`获取 access_token 失败：${response.data.errmsg ?? 'unknown'}`);
  }
  return response.data.access_token ?? '';
}

/**
 * 确保 Token 有效（自动刷新过期的 Token）
 */
async function ensureValidToken(card: AICardInstance): Promise<string> {
  // 提前 5 分钟刷新
  if (Date.now() > card.tokenExpireTime - 300 * 1000) {
    card.accessToken = await getAccessToken();
    card.tokenExpireTime = Date.now() + 7200 * 1000;
  }
  return card.accessToken;
}

/**
 * 判断是否为 QPS 限流错误
 */
function isQpsLimitError(err: unknown): boolean {
  const axiosError = err as AxiosError<{ code?: string }>;
  const errorCode = axiosError?.response?.data?.code;
  return (
    axiosError?.response?.status === 403 &&
    typeof errorCode === 'string' &&
    errorCode.includes('QpsLimit')
  );
}

/**
 * 简单的 sleep 函数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 确保 Markdown 表格前有空行，否则钉钉无法正确渲染
 */
function ensureTableBlankLines(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  const tableDividerRegex = /^\s*\|?\s*:?-+:?\s*(\|?\s*:?-+:?\s*)+\|?\s*$/;
  const tableRowRegex = /^\s*\|?.*\|.*\|?\s*$/;

  const isDivider = (line: string) =>
    line && typeof line === 'string' && line.includes('|') && tableDividerRegex.test(line);

  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i];
    const nextLine = lines[i + 1] ?? '';

    if (
      tableRowRegex.test(currentLine) &&
      isDivider(nextLine) &&
      i > 0 &&
      lines[i - 1].trim() !== '' &&
      !tableRowRegex.test(lines[i - 1])
    ) {
      result.push('');
    }
    result.push(currentLine);
  }

  return result.join('\n');
}

/**
 * 构建卡片创建请求体（create 步骤）
 * 参考 dingtalk-openclaw-connector: POST /v1.0/card/instances
 */
function buildCreateBody(cardInstanceId: string, cardTemplateId: string): Record<string, unknown> {
  return {
    cardTemplateId,
    outTrackId: cardInstanceId,
    cardData: {
      cardParamMap: {
        config: JSON.stringify({ autoLayout: true }),
      },
    },
    callbackType: 'STREAM',
    imGroupOpenSpaceModel: { supportForward: true },
    imRobotOpenSpaceModel: { supportForward: true },
  };
}

/**
 * 构建卡片投放请求体（deliver 步骤）
 * 参考 dingtalk-openclaw-connector: POST /v1.0/card/instances/deliver
 */
function buildDeliverBody(cardInstanceId: string, target: CardTarget): Record<string, unknown> {
  if (target.type === 'group') {
    return {
      outTrackId: cardInstanceId,
      userIdType: 1,
      openSpaceId: `dtv1.card//IM_GROUP.${target.openConversationId}`,
      imGroupOpenDeliverModel: {
        robotCode: String(config.dingtalk.appKey),
      },
    };
  }

  return {
    outTrackId: cardInstanceId,
    userIdType: 1,
    openSpaceId: `dtv1.card//IM_ROBOT.${target.userId}`,
    imRobotOpenDeliverModel: {
      spaceType: 'IM_ROBOT',
      robotCode: String(config.dingtalk.appKey),
      extension: {
        dynamicSummary: 'true',
      },
    },
  };
}

/**
 * AI Card 服务类
 */
export class AICardService {
  /**
   * 创建并投放 AI Card（使用 createAndDeliver 一步完成）
   *
   * @param conversationId - 会话 ID
   * @param senderType - 发送者类型（user 单聊 / group 群聊）
   * @param userId - 用户 ID（createAndDeliver 必需）
   * @returns AI Card 实例，失败时返回 null
   */
  async createCard(
    conversationId: string,
    senderType: 'user' | 'group',
    userId: string = ''
  ): Promise<AICardInstance | null> {
    const target: CardTarget =
      senderType === 'group'
        ? { type: 'group', userId, openConversationId: conversationId }
        : { type: 'user', userId: userId || conversationId, openConversationId: conversationId };

    const targetDesc =
      senderType === 'group' ? `群聊 ${conversationId}` : `用户 ${userId || conversationId}`;

    try {
      const token = await getAccessToken();
      const cardInstanceId = `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const cardTemplateId = config.streaming.cardTemplateId || DEFAULT_CARD_TEMPLATE_ID;

      logger.log(`开始创建卡片：${targetDesc}, outTrackId=${cardInstanceId}`);

      // 步骤 1: 创建卡片实例 (参考: dingtalk-openclaw-connector POST /v1.0/card/instances)
      const createBody = buildCreateBody(cardInstanceId, cardTemplateId);
      await axios.post(`${DINGTALK_API}/v1.0/card/instances`, createBody, {
        headers: {
          'x-acs-dingtalk-access-token': token,
          'Content-Type': 'application/json',
        },
      });

      // 步骤 2: 投放卡片到目标用户/群 (参考: dingtalk-openclaw-connector POST /v1.0/card/instances/deliver)
      const deliverBody = buildDeliverBody(cardInstanceId, target);
      await axios.post(`${DINGTALK_API}/v1.0/card/instances/deliver`, deliverBody, {
        headers: {
          'x-acs-dingtalk-access-token': token,
          'Content-Type': 'application/json',
        },
      });

      logger.log(`卡片创建并投放成功：${cardInstanceId}`);

      return {
        cardInstanceId,
        accessToken: token,
        tokenExpireTime: Date.now() + 7200 * 1000,
        inputingStarted: false,
        conversationId,
        senderType,
        userId: target.userId,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`创建卡片失败 (${targetDesc}): ${errorMessage}`);

      if (axios.isAxiosError(err) && err.response) {
        const responseData = err.response.data as Record<string, unknown> | undefined;
        logger.error(
          `错误响应：status=${err.response.status}, code=${(responseData as Record<string, unknown>)?.code}, message=${JSON.stringify((responseData as Record<string, unknown>)?.message)}`
        );
      } else if (axios.isAxiosError(err) && err.request) {
        logger.error(`网络错误：无法连接到钉钉 API`);
      }

      return null;
    }
  }

  /**
   * 流式更新卡片内容
   *
   * @param card - AI Card 实例
   * @param content - 要更新的内容
   * @param finished - 是否已完成（默认 false）
   */
  async streamUpdate(
    card: AICardInstance,
    content: string,
    finished: boolean = false
  ): Promise<void> {
    if (!card) {
      logger.warn('streamUpdate 收到 null card，跳过更新');
      return;
    }

    try {
      await ensureValidToken(card);

      // 如果 INPUTING 状态未启动，先切换到 INPUTING
      if (!card.inputingStarted) {
        const statusBody = {
          outTrackId: card.cardInstanceId,
          cardData: {
            cardParamMap: {
              flowStatus: AICardStatus.INPUTING,
              msgContent: content,
              staticMsgContent: '',
              sys_full_json_obj: JSON.stringify({ order: ['msgContent'] }),
              config: JSON.stringify({ autoLayout: true }),
            },
          },
        };

        logger.log(
          `切换 INPUTING 状态：outTrackId=${card.cardInstanceId}, contentLen=${content.length}`
        );

        try {
          await this.putWithRetry(
            `${DINGTALK_API}/v1.0/card/instances`,
            statusBody,
            card.accessToken,
            'INPUTING'
          );
          logger.log('INPUTING 状态切换成功');
        } catch (inputErr) {
          const inputAxiosErr = inputErr as AxiosError;
          logger.error(
            `INPUTING 状态切换失败：status=${inputAxiosErr?.response?.status}, data=${JSON.stringify(inputAxiosErr?.response?.data)}`
          );
          // INPUTING 失败不阻断后续流式更新
        }

        card.inputingStarted = true;
      }

      // 构建流式更新请求体
      // 参考: https://open.dingtalk.com/document/development/api-streamingupdate
      // key: 需要流式更新的变量名（对应卡片模板中的变量）
      // content: 流式更新的内容（API 要求字段名为 content，不是 msgContent）
      const fixedContent = ensureTableBlankLines(content);
      const body = {
        outTrackId: card.cardInstanceId,
        guid: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        key: 'msgContent',
        content: fixedContent,
        isFull: true,
        isFinalize: finished,
        isError: false,
      };

      logger.log(
        `流式更新：contentLen=${content.length}, isFinalize=${finished}, outTrackId=${card.cardInstanceId}`
      );

      const response = await axios.put(`${DINGTALK_API}/v1.0/card/streaming`, body, {
        headers: {
          'x-acs-dingtalk-access-token': card.accessToken,
          'Content-Type': 'application/json',
        },
      });
      logger.log(`流式更新响应：status=${response.status}, data=${JSON.stringify(response.data)}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const axiosErr = err as AxiosError;
      const status = axiosErr?.response?.status;
      const errData = axiosErr?.response?.data;
      logger.error(
        `流式更新失败：status=${status}, message=${errorMessage}, data=${JSON.stringify(errData)}, cardInstanceId=${card.cardInstanceId}, contentLen=${content.length}, finished=${finished}`
      );

      if (isQpsLimitError(err)) {
        logger.warn('触发 QPS 限流，退避 2 秒后重试...');
        await sleep(2000);
        try {
          await this.streamUpdate(card, content, finished);
          logger.log('QPS 限流重试成功');
        } catch (_retryErr) {
          logger.error('QPS 限流重试失败，跳过本次更新');
        }
      } else if (status === 400) {
        // 400 通常表示请求体格式错误或卡片状态不正确
        logger.error(
          `流式更新 400 错误详情：inputingStarted=${card.inputingStarted}, cardInstanceId=${card.cardInstanceId}, contentLen=${content.length}`
        );
      } else {
        logger.error(`非 QPS 错误，跳过本次更新：${errorMessage}`);
      }
    }
  }

  /**
   * 完成 AI Card
   *
   * @param card - AI Card 实例
   * @param finalContent - 最终内容
   */
  async finish(card: AICardInstance, finalContent: string): Promise<void> {
    if (!card) {
      logger.warn('finish 收到 null card，跳过');
      return;
    }

    try {
      await ensureValidToken(card);

      const fixedContent = ensureTableBlankLines(finalContent);

      logger.log(
        `开始 finish：最终内容长度=${fixedContent.length}, outTrackId=${card.cardInstanceId}`
      );

      // 1. 先发送最终内容（isFinalize=true）
      await this.streamUpdate(card, fixedContent, true);

      // 2. 设置 FINISHED 状态
      const body = {
        outTrackId: card.cardInstanceId,
        cardData: {
          cardParamMap: {
            flowStatus: AICardStatus.FINISHED,
            msgContent: fixedContent,
            staticMsgContent: '',
            sys_full_json_obj: JSON.stringify({ order: ['msgContent'] }),
            config: JSON.stringify({ autoLayout: true }),
          },
        },
        cardUpdateOptions: { updateCardDataByKey: true },
      };

      await this.putWithRetry(
        `${DINGTALK_API}/v1.0/card/instances`,
        body,
        card.accessToken,
        'FINISHED'
      );

      logger.log(`卡片完成：${card.cardInstanceId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`完成卡片失败：${errorMessage}`);

      if (axios.isAxiosError(err) && err.response) {
        logger.error(
          `完成失败详情：status=${err.response.status}, data=${JSON.stringify(err.response.data)}`
        );
      }

      throw err;
    }
  }

  /**
   * 带重试的 PUT 请求（用于 QPS 限流场景）
   */
  private async putWithRetry(
    url: string,
    body: Record<string, unknown>,
    token: string,
    operation: string,
    maxRetries: number = 1
  ): Promise<void> {
    const doPut = async () => {
      await axios.put(url, body, {
        headers: {
          'x-acs-dingtalk-access-token': token,
          'Content-Type': 'application/json',
        },
      });
    };

    try {
      await doPut();
    } catch (err) {
      if (isQpsLimitError(err)) {
        logger.warn(`${operation} 触发 QPS 限流，退避 2 秒后重试...`);
        await sleep(2000);

        for (let i = 0; i < maxRetries; i++) {
          try {
            await doPut();
            logger.log(`${operation} 重试成功`);
            return;
          } catch (_retryErr) {
            logger.error(`${operation} 重试失败 (${i + 1}/${maxRetries})`);
          }
        }
      }
      throw err;
    }
  }
}
