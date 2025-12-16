import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIframeBridge } from '../react';

describe('useIframeBridge', () => {
    it('child mode becomes ready and can emit()', async () => {
        const postMessage = vi.fn();

        Object.defineProperty(window, 'parent', {
            value: { postMessage } as unknown as Window,
            configurable: true
        });

        const { result, unmount } = renderHook(() =>
            useIframeBridge({
                mode: 'child',
                targetOrigin: '*',
                options: { debug: false }
            })
        );

        await waitFor(() => {
            expect(result.current.ready).toBe(true);
        });

        result.current.emit('userAction', { a: 1 });

        expect(postMessage).toHaveBeenCalledTimes(1);
        const message = postMessage.mock.calls[0]![0] as any;
        expect(message.type).toBe('event');
        expect(message.event).toBe('userAction');
        expect(message.data).toEqual({ a: 1 });

        unmount();
    });

    it('parent mode becomes ready when iframe is provided', async () => {
        const postMessage = vi.fn();
        const iframe = document.createElement('iframe');

        Object.defineProperty(iframe, 'contentWindow', {
            value: { postMessage } as unknown as Window,
            configurable: true
        });

        const { result, unmount } = renderHook(() =>
            useIframeBridge({
                mode: 'parent',
                iframe,
                targetOrigin: '*',
                options: { debug: false }
            })
        );

        await waitFor(() => {
            expect(result.current.ready).toBe(true);
        });

        result.current.emit('parentEvent', { hello: true });

        expect(postMessage).toHaveBeenCalledTimes(1);
        const message = postMessage.mock.calls[0]![0] as any;
        expect(message.type).toBe('event');
        expect(message.event).toBe('parentEvent');

        unmount();
    });

    it('parent mode without iframe stays not ready; emit throws; off is no-op', async () => {
        const { result, unmount } = renderHook(() =>
            useIframeBridge({
                mode: 'parent',
                iframe: null,
                targetOrigin: '*'
            })
        );

        await waitFor(() => {
            expect(result.current.ready).toBe(false);
        });

        expect(() => result.current.emit('x', 1)).toThrow(/not ready/i);
        expect(() => result.current.off('x', () => {})).not.toThrow();

        unmount();
    });
});
