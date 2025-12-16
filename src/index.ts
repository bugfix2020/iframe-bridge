export * from './types';
export { IframeBridge } from './bridge';
import { IframeBridge } from './bridge';
import type { BridgeOptions } from './types';

// 便捷工具函数

/**
 * 创建父窗口的 Bridge 实例
 * @param iframe iframe 元素
 * @param targetOrigin 目标源域名
 * @param options 配置选项
 */
export function createParentBridge(iframe: HTMLIFrameElement, targetOrigin?: string, options?: BridgeOptions) {
    if (!iframe.contentWindow) {
        throw new Error('Iframe contentWindow is not available');
    }
    return new IframeBridge(iframe.contentWindow, targetOrigin, options);
}

/**
 * 创建子窗口的 Bridge 实例
 * @param targetOrigin 目标源域名
 * @param options 配置选项
 */
export function createChildBridge(targetOrigin?: string, options?: BridgeOptions) {
    if (!window.parent || window.parent === window) {
        throw new Error('This function should be called from within an iframe');
    }
    return new IframeBridge(window.parent, targetOrigin, options);
}

/**
 * 检查当前环境是否在 iframe 中
 */
export function isInIframe(): boolean {
    return window !== window.parent;
}
