import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createChildBridge, createParentBridge, IframeBridge } from '../index';
import type { BridgeOptions, EventListener } from '../types';

export type UseIframeBridgeParams =
    | {
          mode: 'child';
          targetOrigin?: string;
          options?: BridgeOptions;
      }
    | {
          mode: 'parent';
          iframe: HTMLIFrameElement | null | undefined;
          targetOrigin?: string;
          options?: BridgeOptions;
      };

export interface UseIframeBridgeResult {
    bridge: IframeBridge | null;
    ready: boolean;
    call: IframeBridge['call'];
    emit: IframeBridge['emit'];
    on: IframeBridge['on'];
    off: IframeBridge['off'];
    destroy: () => void;
}

export function useIframeBridge(params: UseIframeBridgeParams): UseIframeBridgeResult {
    const bridgeRef = useRef<IframeBridge | null>(null);
    const [ready, setReady] = useState(false);

    const destroy = useCallback(() => {
        if (bridgeRef.current && !bridgeRef.current.isDestroyed()) {
            bridgeRef.current.destroy();
        }
        bridgeRef.current = null;
        setReady(false);
    }, []);

    useEffect(() => {
        destroy();

        try {
            if (params.mode === 'child') {
                bridgeRef.current = createChildBridge(params.targetOrigin, params.options);
                setReady(true);
                return;
            }

            const iframe = params.iframe;
            if (!iframe) {
                return;
            }

            bridgeRef.current = createParentBridge(iframe, params.targetOrigin, params.options);
            setReady(true);
        } catch {
            destroy();
        }

        return () => {
            destroy();
        };
    }, [params, destroy]);

    const bridge = bridgeRef.current;

    const call = useCallback<IframeBridge['call']>(
        async (method: any, p?: any) => {
            if (!bridgeRef.current) {
                throw new Error('Bridge is not ready');
            }
            return bridgeRef.current.call(method, p);
        },
        []
    );

    const emit = useCallback<IframeBridge['emit']>(
        (event: any, data?: any) => {
            if (!bridgeRef.current) {
                throw new Error('Bridge is not ready');
            }
            return bridgeRef.current.emit(event, data);
        },
        []
    );

    const on = useCallback<IframeBridge['on']>(
        (event: string, listener: EventListener<any>) => {
            if (!bridgeRef.current) {
                throw new Error('Bridge is not ready');
            }
            return bridgeRef.current.on(event, listener);
        },
        []
    );

    const off = useCallback<IframeBridge['off']>(
        (event: string, listener: EventListener<any>) => {
            if (!bridgeRef.current) {
                return;
            }
            return bridgeRef.current.off(event, listener);
        },
        []
    );

    return useMemo(
        () => ({
            bridge,
            ready,
            call,
            emit,
            on,
            off,
            destroy
        }),
        [bridge, ready, call, emit, on, off, destroy]
    );
}
