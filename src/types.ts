/**
 * 消息类型定义
 * @type {'request' | 'response' | 'event' | 'error'}
 */
export type MessageType = 'request' | 'response' | 'event' | 'error';

/**
 * 基础消息接口
 * @property {string} [id] 消息唯一标识符
 * @property {MessageType} type 消息类型
 * @property {number} timestamp 消息时间戳
 * @property {string} [origin] 消息来源
 */
export interface BaseMessage {
    id?: string;
    type: MessageType;
    timestamp: number;
    origin?: string;
}

/**
 * 请求消息接口
 * @template T 请求参数类型
 * @extends BaseMessage
 * @property {'request'} type 消息类型
 * @property {string} method 请求方法名
 * @property {T} [params] 请求参数
 * @property {string} id 消息唯一标识符
 */
export interface RequestMessage<T = any> extends BaseMessage {
    type: 'request';
    method: string;
    params?: T;
    id: string;
}

/**
 * 响应消息接口
 * @template T 响应数据类型
 * @extends BaseMessage
 * @property {'response'} type 消息类型
 * @property {string} id 消息唯一标识符
 * @property {boolean} success 是否成功
 * @property {T} [data] 响应数据
 * @property {string} [error] 错误信息
 */
export interface ResponseMessage<T = any> extends BaseMessage {
    type: 'response';
    id: string;
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * 事件消息接口
 * @template T 事件数据类型
 * @extends BaseMessage
 * @property {'event'} type 消息类型
 * @property {string} event 事件名称
 * @property {T} [data] 事件数据
 */
export interface EventMessage<T = any> extends BaseMessage {
    type: 'event';
    event: string;
    data?: T;
}

/**
 * 错误消息接口
 * @extends BaseMessage
 * @property {'error'} type 消息类型
 * @property {string} error 错误信息
 * @property {any} [details] 错误详情
 */
export interface ErrorMessage extends BaseMessage {
    type: 'error';
    error: string;
    details?: any;
}

/**
 * 桥接消息联合类型
 * @template T 消息数据类型
 * @type {RequestMessage<T> | ResponseMessage<T> | EventMessage<T> | ErrorMessage}
 */
export type BridgeMessage<T = any> = RequestMessage<T> | ResponseMessage<T> | EventMessage<T> | ErrorMessage;

/**
 * 方法处理器类型
 * @template TParams 参数类型
 * @template TResult 返回类型
 * @type {(params: TParams) => Promise<TResult> | TResult}
 */
export type MethodHandler<TParams = any, TResult = any> = (params: TParams) => Promise<TResult> | TResult;

/**
 * 事件监听器类型
 * @template T 事件数据类型
 * @type {(data: T) => void}
 */
export type EventListener<T = any> = (data: T) => void;

/**
 * Bridge 配置选项
 * @property {string[]} [allowedOrigins] 允许的源域名列表，为空则允许所有
 * @property {number} [timeout] 消息超时时间（毫秒），默认 5000
 * @property {boolean} [debug] 是否启用调试日志
 * @property {(message: any) => boolean} [messageValidator] 自定义消息验证函数
 */
export interface BridgeOptions {
    allowedOrigins?: string[];
    timeout?: number;
    debug?: boolean;
    messageValidator?: (message: any) => boolean;
}
