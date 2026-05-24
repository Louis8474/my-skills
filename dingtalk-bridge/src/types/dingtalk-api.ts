/**
 * 钉钉 API 响应类型定义
 *
 * 将第三方 API 的 any 响应转换为强类型接口，
 * 消除 no-unsafe-* 的 ESLint 警告。
 */

/** 钉钉 OAuth2 Access Token 响应（新 API） */
export interface DingtalkAccessTokenResponse {
  accessToken?: string;
  expireIn?: number;
  errcode?: number;
  errmsg?: string;
  access_token?: string;
}

/** 钉钉 Stream 消息数据结构 */
export interface StreamMessageData {
  msgtype: string;
  senderId?: string;
  senderNick?: string;
  text?: { content: string } | string;
  content?: string;
  conversationId?: string;
  sessionWebhook?: string;
  chatType?: string;
  voice?: { mediaId: string; duration: number; format: string };
  picture?: { downloadCode: string; downloadUrl: string };
  video?: { mediaId: string };
  file?: { mediaId: string; fileName?: string };
  [key: string]: unknown;
}

/** 钉钉消息拉取 API 响应项 */
export interface DingtalkMessageItem {
  msgUuid?: string;
  bizId?: string;
  conversationId?: string;
  senderId?: string;
  senderNick?: string;
  text?: string | { content: string };
  content?: string;
  msgType?: string;
  createTime?: number;
  sendTime?: number;
  [key: string]: unknown;
}

/** 钉钉消息拉取 API 响应 */
export interface DingtalkFetchMessagesResponse {
  code?: string;
  success?: boolean;
  message?: string;
  errmsg?: string;
  result?: {
    items?: DingtalkMessageItem[];
    hasMore?: boolean;
    nextCursor?: string;
    [key: string]: unknown;
  };
  hasMore?: boolean;
  nextCursor?: string;
  [key: string]: unknown;
}

/** 钉钉群消息拉取 API 响应 */
export interface DingtalkGroupMessagesResponse {
  errcode: number;
  errmsg?: string;
  result?: {
    messages?: DingtalkMessageItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
