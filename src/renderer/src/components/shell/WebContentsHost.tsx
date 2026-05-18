import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface WebContentsHostProps {
  layerId: string;
  className?: string;
}

export function WebContentsHost({
  layerId,
  className,
}: WebContentsHostProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const activatedRef = useRef(false);
  const [error, setError] = useState(false);
  const { t } = useTranslation("shellView");

  const readBounds = useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }, []);

  const syncBounds = useCallback(async () => {
    const bounds = readBounds();
    if (!bounds || bounds.width < 1 || bounds.height < 1) return;

    try {
      if (!activatedRef.current) {
        await window.shellView.activate(layerId);
        activatedRef.current = true;
      }
      await window.shellView.setBounds(layerId, bounds);
      setError(false);
    } catch (err) {
      console.error("[WebContentsHost] shellView API error:", err);
      setError(true);
    }
  }, [readBounds, layerId]);

  useEffect(() => {
    let disposed = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedSync = (): void => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!disposed) void syncBounds();
      }, 16);
    };

    void syncBounds();

    const el = ref.current;
    if (el) {
      const observer = new ResizeObserver(() => {
        debouncedSync();
      });
      observer.observe(el);

      window.addEventListener("resize", debouncedSync);

      return () => {
        disposed = true;
        observer.disconnect();
        window.removeEventListener("resize", debouncedSync);
        if (debounceTimer) clearTimeout(debounceTimer);
        activatedRef.current = false;
        void window.shellView.hide(layerId).catch(() => {});
      };
    }

    return () => {
      disposed = true;
      activatedRef.current = false;
      void window.shellView.hide(layerId).catch(() => {});
    };
  }, [syncBounds, layerId]);

  if (error) {
    return (
      <div className={className ?? "h-full w-full min-h-0 flex items-center justify-center"}>
        <div className="text-center space-y-2">
          <p className="text-sm text-red-500">{t("viewLoadFailed")}</p>
          <button
            type="button"
            className="text-xs text-blue-500 hover:underline"
            onClick={() => {
              setError(false);
              activatedRef.current = false;
              void syncBounds();
            }}
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return <div ref={ref} className={className ?? "h-full w-full min-h-0"} />;
}
