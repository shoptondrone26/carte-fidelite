export type OneSignalWeb = {
  init: (options: {
    appId: string;
    serviceWorkerPath?: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }) => Promise<void>;
  login: (externalId: string) => Promise<void>;
  logout: () => Promise<void>;
  User: {
    PushSubscription: {
      id?: string | null;
      optedIn?: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
    };
  };
  Notifications: {
    permission: boolean;
    requestPermission: () => Promise<void>;
  };
  Slidedown?: {
    promptPush: (options?: { force?: boolean }) => Promise<void>;
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalWeb) => void | Promise<void>>;
    OneSignal?: OneSignalWeb;
  }
}

export {};
