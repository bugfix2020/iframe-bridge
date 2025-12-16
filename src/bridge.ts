import type {
    BridgeMessage,
    RequestMessage,
    ResponseMessage,
    EventMessage,
    MethodHandler,
    EventListener,
    BridgeOptions
} from './types';

export class IframeBridge {
    private readonly targetWindow: Window;
    private readonly targetOrigin: string;
    private readonly options: Required<BridgeOptions>;

    private readonly messageListener: (event: MessageEvent) => void;

    private methodHandlers = new Map<string, MethodHandler>();
    private eventListeners = new Map<string, Set<EventListener>>();
    private pendingRequests = new Map<
        string,
        {
            resolve: (value: any) => void;
            reject: (error: Error) => void;
            timer: number;
        }
    >();

    private destroyed = false;

    constructor(targetWindow: Window, targetOrigin: string = '*', options: BridgeOptions = {}) {
        this.targetWindow = targetWindow;
        this.targetOrigin = targetOrigin;
        this.options = {
            allowedOrigins: options.allowedOrigins || [],
            timeout: options.timeout || 5000,
            debug: options.debug || false,
            messageValidator: options.messageValidator || (() => true)
        };

        this.messageListener = this.handleMessage.bind(this);

        this.setupMessageListener();
    }

    /**
     * 设置消息监听器
     */
    private setupMessageListener(): void {
        window.addEventListener('message', this.messageListener, false);
    }

    /**
     * 处理接收到的消息
     */
    private handleMessage(event: MessageEvent): void {
        if (this.destroyed) return;

        // 验证来源
        if (this.options.allowedOrigins.length > 0 && this.options.allowedOrigins.indexOf(event.origin) === -1) {
            this.log('Message from unauthorized origin:', event.origin);
            return;
        }

        // 验证消息格式
        if (!this.isValidMessage(event.data)) {
            this.log('Invalid message format:', event.data);
            return;
        }

        const message = event.data as BridgeMessage;
        this.log('Received message:', message);

        try {
            switch (message.type) {
                case 'request':
                    this.handleRequest(message as RequestMessage);
                    break;
                case 'response':
                    this.handleResponse(message as ResponseMessage);
                    break;
                case 'event':
                    this.handleEvent(message as EventMessage);
                    break;
                case 'error':
                    this.log('Received error:', message);
                    break;
            }
        } catch (error) {
            this.log('Error handling message:', error);
        }
    }

    /**
     * 验证消息格式
     */
    private isValidMessage(data: any): boolean {
        if (!data || typeof data !== 'object') return false;
        if (!data.type || !data.timestamp) return false;
        return this.options.messageValidator(data);
    }

    /**
     * 处理请求消息
     */
    private async handleRequest(message: RequestMessage): Promise<void> {
        const handler = this.methodHandlers.get(message.method);

        if (!handler) {
            this.sendResponse(message.id, false, undefined, `Method '${message.method}' not found`);
            return;
        }

        try {
            const result = await handler(message.params);
            this.sendResponse(message.id, true, result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.sendResponse(message.id, false, undefined, errorMessage);
        }
    }

    /**
     * 处理响应消息
     */
    private handleResponse(message: ResponseMessage): void {
        const pending = this.pendingRequests.get(message.id);
        if (!pending) return;

        clearTimeout(pending.timer);
        this.pendingRequests.delete(message.id);

        if (message.success) {
            pending.resolve(message.data);
        } else {
            pending.reject(new Error(message.error || 'Unknown error'));
        }
    }

    /**
     * 处理事件消息
     */
    private handleEvent(message: EventMessage): void {
        const listeners = this.eventListeners.get(message.event);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(message.data);
                } catch (error) {
                    this.log('Error in event listener:', error);
                }
            });
        }
    }

    /**
     * 发送消息
     */
    private sendMessage(message: BridgeMessage): void {
        if (this.destroyed) {
            throw new Error('Bridge is destroyed');
        }

        this.log('Sending message:', message);
        this.targetWindow.postMessage(message, this.targetOrigin);
    }

    /**
     * 发送响应消息
     */
    private sendResponse(id: string, success: boolean, data?: any, error?: string): void {
        const response: ResponseMessage = {
            type: 'response',
            id,
            success,
            data,
            error,
            timestamp: Date.now()
        };
        this.sendMessage(response);
    }

    /**
     * 生成唯一ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * 日志输出
     */
    private log(...args: any[]): void {
        if (this.options.debug) {
            console.log('[IframeBridge]', ...args);
        }
    }

    // 公共 API

    /**
     * 注册方法处理器
     */
    public registerMethod<TParams = any, TResult = any>(
        method: string,
        handler: MethodHandler<TParams, TResult>
    ): void {
        this.methodHandlers.set(method, handler);
    }

    /**
     * 取消注册方法处理器
     */
    public unregisterMethod(method: string): void {
        this.methodHandlers.delete(method);
    }

    /**
     * 调用远程方法
     */
    public async call<TParams = any, TResult = any>(method: string, params?: TParams): Promise<TResult> {
        return new Promise((resolve, reject) => {
            const id = this.generateId();
            const timer = setTimeout(() => {
                this.pendingRequests.delete(id);
                reject(new Error(`Request timeout: ${method}`));
            }, this.options.timeout);

            this.pendingRequests.set(id, { resolve, reject, timer });

            const request: RequestMessage<TParams> = {
                type: 'request',
                id,
                method,
                params,
                timestamp: Date.now()
            };

            this.sendMessage(request);
        });
    }

    /**
     * 监听事件
     */
    public on<T = any>(event: string, listener: EventListener<T>): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        this.eventListeners.get(event)!.add(listener);
    }

    /**
     * 取消监听事件
     */
    public off<T = any>(event: string, listener: EventListener<T>): void {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.delete(listener);
            if (listeners.size === 0) {
                this.eventListeners.delete(event);
            }
        }
    }

    /**
     * 发送事件
     */
    public emit<T = any>(event: string, data?: T): void {
        const eventMessage: EventMessage<T> = {
            type: 'event',
            event,
            data,
            timestamp: Date.now()
        };
        this.sendMessage(eventMessage);
    }

    /**
     * 销毁 Bridge
     */
    public destroy(): void {
        this.destroyed = true;

        // 清理待处理的请求
        this.pendingRequests.forEach(({ timer, reject }) => {
            clearTimeout(timer);
            reject(new Error('Bridge destroyed'));
        });
        this.pendingRequests.clear();

        // 清理处理器和监听器
        this.methodHandlers.clear();
        this.eventListeners.clear();

        // 移除消息监听器
        window.removeEventListener('message', this.messageListener, false);
    }

    /**
     * 检查 Bridge 是否已销毁
     */
    public isDestroyed(): boolean {
        return this.destroyed;
    }
}
