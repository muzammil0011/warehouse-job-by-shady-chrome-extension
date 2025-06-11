import "@/assets/tailwind.css";
import { StyleProvider } from "@ant-design/cssinjs";
import "@ant-design/v5-patch-for-react-19";
import "@fontsource/poppins";
import { theme as AntdTheme, App, ConfigProvider } from "antd";
import { createContext, useContext, type ReactNode } from "react";

import type { MessageInstance } from "antd/es/message/interface";
import type { ModalStaticFunctions } from "antd/es/modal/confirm";
import type { NotificationInstance } from "antd/es/notification/interface";
import type { GlobalToken } from "antd/es/theme/interface";
import { createRoot } from "react-dom/client";

const { theme } = useAppConfig();

interface ThemeProviderProps {
  children?: ReactNode;
  shadowContainer?: HTMLElement | ShadowRoot | null;
  popupContainer?: HTMLElement | null;
  isDarkTheme?: boolean;
  className?: string;
}

interface AntdContextProps {
  notification: NotificationInstance;
  message: MessageInstance;
  modal: Omit<ModalStaticFunctions, "warn">;
  isDarkTheme?: boolean;
  setTheme: (dark: boolean) => void;
  token: GlobalToken;
}

let AntdContext: React.Context<AntdContextProps | null>;

if (!(globalThis as any).__antd_context__) {
  (globalThis as any).__antd_context__ = createContext<AntdContextProps | null>(
    null,
  );
}
AntdContext = (globalThis as any).__antd_context__;

const userTheme = storage.defineItem<boolean>("local:userTheme", {
  fallback: false,
});

const StaticComponents = ({
  children,
  shadowContainer,
  popupContainer,
  isDarkTheme,
}: ThemeProviderProps) => {
  const { token } = AntdTheme.useToken();

  const currentAlgorithm = isDarkTheme
    ? AntdTheme.darkAlgorithm
    : AntdTheme.defaultAlgorithm;

  return (
    <StyleProvider
      container={shadowContainer || document.body}
      hashPriority="high"
      layer
    >
      <ConfigProvider
        theme={{
          algorithm: currentAlgorithm,
          token: {
            colorPrimary: theme?.colorPrimary,
            fontFamily: [theme?.font, token.fontFamily].toString(),
          },
        }}
        getPopupContainer={() => popupContainer || document.body}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};

// Dynamic components (depend on App context)
const DynamicComponents = ({
  children,
  isDarkTheme,
  setTheme,
}: {
  children: ReactNode;
  isDarkTheme: boolean;
  setTheme: (dark: boolean) => void;
}) => {
  const staticContext = App.useApp();
  const { message, notification, modal } = staticContext;
  const { token } = AntdTheme.useToken();

  return (
    <AntdContext.Provider
      value={{ message, notification, modal, isDarkTheme, setTheme, token }}
    >
      {children}
    </AntdContext.Provider>
  );
};

export const ThemeProvider = ({
  children,
  shadowContainer,
  popupContainer,
  className,
}: ThemeProviderProps) => {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(false);

  useEffect(() => {
    userTheme.getValue().then((val) => {
      setIsDarkTheme(val);
      updateBodyClass(val);
    });

    userTheme.watch((val) => {
      setIsDarkTheme(val);
      updateBodyClass(val);
    });
  }, []);

  const updateBodyClass = (isDark: boolean) => {
    document.body.classList.toggle("dark", isDark);
    document.body.classList.toggle("light", !isDark);
  };

  const handleSetTheme = (dark: boolean) => {
    userTheme.setValue(dark);
  };

  return (
    <StaticComponents
      shadowContainer={shadowContainer}
      popupContainer={popupContainer}
      isDarkTheme={isDarkTheme}
    >
      <App className={className}>
        <DynamicComponents isDarkTheme={isDarkTheme} setTheme={handleSetTheme}>
          {children}
        </DynamicComponents>
      </App>
    </StaticComponents>
  );
};

export const useAntd = (): AntdContextProps => {
  const context = useContext(AntdContext);
  if (!context) {
    throw new Error("useAntd must be used within an AntdProvider");
  }
  return context;
};

const applyStyles = async (
  style: ApplyStyles,
  anchor: string,
  shadowHost: HTMLElement,
  uiContainer: HTMLElement,
): Promise<void> => {
  if (style?.root) {
    injectStyleToMainDom(style.root);
  }

  if (style?.anchor) {
    const anchorEl = document.querySelector(anchor) as HTMLElement | null;
    if (anchorEl) {
      Object.assign(anchorEl.style, style.anchor);
    }
  }

  if (style?.anchorParent) {
    const anchorParent = document.querySelector(anchor)
      ?.parentElement as HTMLElement | null;
    if (anchorParent) {
      Object.assign(anchorParent.style, style.anchorParent);
    }
  }

  if (style?.shadowHost) {
    Object.assign(shadowHost.style, style.shadowHost);
  }

  if (style?.uiContainer) {
    Object.assign(uiContainer.style, style.uiContainer);
  }
};

export const createAndMountUI = async (ctx: any, props: CreateAndMountUI) => {
  const {
    anchor,
    position = "inline",
    children,
    style,
    id = "softweb-tuts",
  } = props;

  try {
    const ui = await createShadowRootUi(ctx, {
      name: id,
      position: position,
      anchor: anchor,
      onMount: (uiContainer, shadow, shadowHost) => {
        const cssContainer = shadow.querySelector("head")!;
        shadowHost.id = id;
        if (style) applyStyles(style, anchor, shadowHost, shadowHost);

        const root = createRoot(uiContainer);
        root.render(
          <ThemeProvider shadowContainer={shadow} popupContainer={uiContainer}>
            <StyleProvider container={cssContainer}>{children}</StyleProvider>
          </ThemeProvider>,
        );
        return { root, uiContainer };
      },
      // Ensure removal is only triggered when needed
      onRemove: (elements) => {
        if (elements?.root && elements?.uiContainer) {
          elements?.root.unmount();
          elements?.uiContainer.remove();
        }
      },
    });

    if (!document.getElementById(id)) {
      ui.autoMount();
    }
    return true;
  } catch (error) {
    console.error(`Failed to mount UI to anchor: ${anchor}`, error);
    return false;
  }
};

export { StyleProvider };
