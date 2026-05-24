/**
 * Web Admin API 类型定义
 */

/** API 响应格式 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/** 项目信息 */
export interface ProjectInfo {
  name: string;
  status: string;
  agentType: string;
  platforms: string[];
  enabled: boolean;
  sessionCount: number;
  lastActivityAt: number;
}
