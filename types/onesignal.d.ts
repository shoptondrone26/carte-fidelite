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
      /** true si abonné aux push */
      optedIn: boolean;
      optIn: () => Promise<void>;
      optOut: () => Promise<void>;
      addEventListener?: (event: "change", listener: () => void) => void;
      removeEventListener?: (event: "change", listener: () => void) => void;
    };
  };
  Notifications: {
    /** true si la permission navigateur est accordée */
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
