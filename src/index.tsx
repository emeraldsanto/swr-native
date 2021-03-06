import type { NetInfoState } from '@react-native-community/netinfo';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import type { ComponentProps } from 'react';
import { useCallback } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState } from 'react-native';
import { SWRConfig } from 'swr';

type SWRConfigProps = ComponentProps<typeof SWRConfig>;
type SWRConfigValue = NonNullable<SWRConfigProps['value']>;

export function NativeSWRConfig(props: SWRConfigProps) {
  const net = useNetInfo();

  const isOnline = useCallback<NonNullable<SWRConfigValue['isOnline']>>(
    () => net.isInternetReachable ?? false,
    [net.isInternetReachable]
  );

  const initFocus = useCallback<NonNullable<SWRConfigValue['initFocus']>>((callback) => {
    let { currentState } = AppState

    const onAppStateChange = (nextAppState: AppStateStatus) => {
      /* If it's resuming from background or inactive mode to active one */
      if ((['inactive', 'background'].includes(currentState)) && nextAppState === 'active') {
        callback();
      }

      currentState = nextAppState;
    }

    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove();
  }, []);

  const initReconnect = useCallback<NonNullable<SWRConfigValue['initReconnect']>>((callback) => {
    let { isInternetReachable } = net;

    const onNetInfoChange = (nextState: NetInfoState) => {
      if (nextState.isInternetReachable !== isInternetReachable) {
        callback();
      }

      isInternetReachable = nextState.isInternetReachable;
    }

    const subscription = NetInfo.addEventListener(onNetInfoChange);

    return () => subscription();
  }, [net]);

  return (
    <SWRConfig
      {...props}
      value={{
        initFocus,
        initReconnect,
        isOnline,
        isVisible: () => true,
        provider: () => new Map(),
        ...props.value,
      }}
    />
  )
}