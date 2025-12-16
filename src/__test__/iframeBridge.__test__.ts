import { describe, expect, it, vi } from 'vitest';
import { IframeBridge } from '../bridge';
import { createChildBridge, createParentBridge, isInIframe } from '../index';

describe('IframeBridge', () => {
    it('call() posts request and resolves on response', async () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow, '*', { timeout: 2000 });

        const promise = bridge.call<{ a: number }, { ok: boolean }>('sum', { a: 1 });

        expect(postMessage).toHaveBeenCalledTimes(1);
        const request = postMessage.mock.calls[0]![0] as any;
        expect(request.type).toBe('request');
        expect(request.method).toBe('sum');

        window.dispatchEvent(
            new MessageEvent('message', {
                data: {
                    type: 'response',
                    id: request.id,
                    success: true,
                    data: { ok: true },
                    timestamp: Date.now()
                },
                origin: 'https://any.origin'
            })
        );

        await expect(promise).resolves.toEqual({ ok: true });
        bridge.destroy();
    });

    it('emit() posts an event message', () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow);

        bridge.emit('hello', { a: 1 });

        expect(postMessage).toHaveBeenCalledTimes(1);
        const message = postMessage.mock.calls[0]![0] as any;
        expect(message.type).toBe('event');
        expect(message.event).toBe('hello');
        expect(message.data).toEqual({ a: 1 });

        bridge.destroy();
    });

    it('registerMethod() handles request and posts a success response', async () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow);

        bridge.registerMethod('add', async (params: { a: number }) => ({ v: params.a + 1 }));

        window.dispatchEvent(
            new MessageEvent('message', {
                data: {
                    type: 'request',
                    id: 'req-1',
                    method: 'add',
                    params: { a: 1 },
                    timestamp: Date.now()
                },
                origin: 'https://any.origin'
            })
        );

        await Promise.resolve();

        const response = postMessage.mock.calls.find(call => (call[0] as any)?.type === 'response')?.[0] as any;
        expect(response).toBeTruthy();
        expect(response.success).toBe(true);
        expect(response.data).toEqual({ v: 2 });

        bridge.destroy();
    });

    it('unregisterMethod() makes method unavailable', async () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow);

        bridge.registerMethod('m', async () => 1);
        bridge.unregisterMethod('m');

        window.dispatchEvent(
            new MessageEvent('message', {
                data: {
                    type: 'request',
                    id: 'req-2',
                    method: 'm',
                    timestamp: Date.now()
                },
                origin: 'https://any.origin'
            })
        );

        await Promise.resolve();

        const response = postMessage.mock.calls.find(call => (call[0] as any)?.type === 'response')?.[0] as any;
        expect(response).toBeTruthy();
        expect(response.success).toBe(false);
        expect(String(response.error || '')).toMatch(/not found/i);

        bridge.destroy();
    });

    it('ignores invalid message payloads', () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow);

        window.dispatchEvent(new MessageEvent('message', { data: null as any, origin: 'https://any.origin' }));
        window.dispatchEvent(
            new MessageEvent('message', {
                data: { type: 'event' },
                origin: 'https://any.origin'
            })
        );

        expect(postMessage).toHaveBeenCalledTimes(0);
        bridge.destroy();
    });

    it('on()/off() handles event messages', () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow);

        const listener = vi.fn();
        bridge.on('hello', listener);

        window.dispatchEvent(
            new MessageEvent('message', {
                data: {
                    type: 'event',
                    event: 'hello',
                    data: { a: 1 },
                    timestamp: Date.now()
                },
                origin: 'https://any.origin'
            })
        );

        expect(listener).toHaveBeenCalledTimes(1);

        bridge.off('hello', listener);

        window.dispatchEvent(
            new MessageEvent('message', {
                data: {
                    type: 'event',
                    event: 'hello',
                    data: { a: 2 },
                    timestamp: Date.now()
                },
                origin: 'https://any.origin'
            })
        );

        expect(listener).toHaveBeenCalledTimes(1);
        bridge.destroy();
    });

    it('destroy() removes the window message listener', () => {
        const addSpy = vi.spyOn(window, 'addEventListener');
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;

        const bridge = new IframeBridge(targetWindow);

        const added = addSpy.mock.calls.find(call => call[0] === 'message');
        expect(added).toBeTruthy();

        const handler = added![1] as any;
        bridge.destroy();

        expect(removeSpy).toHaveBeenCalledWith('message', handler, false);

        addSpy.mockRestore();
        removeSpy.mockRestore();
    });

    it('call() rejects on timeout', async () => {
        vi.useFakeTimers();

        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow, '*', { timeout: 10 });

        const promise = bridge.call('slow');
        vi.advanceTimersByTime(20);

        await expect(promise).rejects.toThrow(/timeout/i);

        bridge.destroy();
        vi.useRealTimers();
    });

    it('destroy() rejects pending call()', async () => {
        const postMessage = vi.fn();
        const targetWindow = { postMessage } as unknown as Window;
        const bridge = new IframeBridge(targetWindow, '*', { timeout: 2000 });

        const promise = bridge.call('pending');
        bridge.destroy();

        await expect(promise).rejects.toThrow(/destroyed/i);
    });

    it('createParentBridge throws when iframe has no contentWindow', () => {
        const iframe = document.createElement('iframe');

        Object.defineProperty(iframe, 'contentWindow', {
            value: null,
            configurable: true
        });

        expect(() => createParentBridge(iframe)).toThrow(/contentWindow/i);
    });

    it('createChildBridge throws when not inside iframe', () => {
        const originalParent = window.parent;
        Object.defineProperty(window, 'parent', { value: window, configurable: true });

        expect(() => createChildBridge('*')).toThrow(/within an iframe/i);

        Object.defineProperty(window, 'parent', { value: originalParent, configurable: true });
    });

    it('isInIframe reflects window.parent', () => {
        const originalParent = window.parent;

        Object.defineProperty(window, 'parent', { value: window, configurable: true });
        expect(isInIframe()).toBe(false);

        Object.defineProperty(window, 'parent', { value: {} as any, configurable: true });
        expect(isInIframe()).toBe(true);

        Object.defineProperty(window, 'parent', { value: originalParent, configurable: true });
    });
});
