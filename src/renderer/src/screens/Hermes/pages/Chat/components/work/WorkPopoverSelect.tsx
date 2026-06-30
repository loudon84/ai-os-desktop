import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";

export type WorkPopoverPlacement = "top" | "bottom";

export type WorkPopoverOption = {
  id: string;
  label: string;
};

type FloatingRect = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

type Props = {
  value?: string;
  options: WorkPopoverOption[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  placement?: WorkPopoverPlacement;
  menuWidth?: number;
  maxMenuHeight?: number;
  onChange: (id: string | undefined) => void;
};

const DEFAULT_MAX_MENU_HEIGHT = 320;

function computeFloatingRect(
  trigger: HTMLElement,
  placement: WorkPopoverPlacement,
  menuWidth: number | undefined,
  maxMenuHeight: number,
): FloatingRect {
  const gap = 8;
  const rect = trigger.getBoundingClientRect();
  const width = menuWidth ?? Math.max(rect.width, 280);

  if (placement === "top") {
    const availableTop = Math.max(rect.top - gap - 8, 160);
    const height = Math.min(maxMenuHeight, availableTop);
    return {
      left: rect.left,
      top: Math.max(8, rect.top - height - gap),
      width,
      maxHeight: height,
    };
  }

  const viewportHeight = window.innerHeight;
  const availableBottom = viewportHeight - rect.bottom - gap - 8;
  const height = Math.min(maxMenuHeight, Math.max(160, availableBottom));
  return {
    left: rect.left,
    top: rect.bottom + gap,
    width,
    maxHeight: height,
  };
}

export function WorkPopoverSelect({
  value,
  options,
  placeholder = "—",
  disabled,
  searchable,
  placement = "bottom",
  menuWidth,
  maxMenuHeight = DEFAULT_MAX_MENU_HEIGHT,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [floatingRect, setFloatingRect] = useState<FloatingRect | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.id === value);
  const filtered =
    searchable && query.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setFloatingRect(
      computeFloatingRect(trigger, placement, menuWidth, maxMenuHeight),
    );
  }, [placement, menuWidth, maxMenuHeight]);

  useLayoutEffect(() => {
    if (!open) {
      setFloatingRect(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition, options.length, filtered.length]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => updatePosition();
    const onScroll = () => updatePosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open || !searchable) return;
    const id = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, searchable]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const panel =
    open && floatingRect
      ? createPortal(
          <div
            ref={panelRef}
            id={listId}
            className="hermes-work-popover-panel"
            role="listbox"
            style={{
              position: "fixed",
              left: floatingRect.left,
              top: floatingRect.top,
              width: floatingRect.width,
              maxHeight: floatingRect.maxHeight,
              zIndex: 99999,
            }}
          >
            {searchable ? (
              <label className="hermes-work-popover-search">
                <Search size={14} aria-hidden />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                />
              </label>
            ) : null}
            <div className="hermes-work-popover-options">
              <button
                type="button"
                className="hermes-work-popover-option"
                role="option"
                aria-selected={!value}
                onClick={() => {
                  onChange(undefined);
                  close();
                }}
              >
                {placeholder}
              </button>
              {filtered.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`hermes-work-popover-option${opt.id === value ? " is-selected" : ""}`}
                  role="option"
                  aria-selected={opt.id === value}
                  onClick={() => {
                    onChange(opt.id);
                    close();
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="hermes-work-popover-select" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="hermes-work-popover-trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
        }}
      >
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={14} aria-hidden />
      </button>
      {panel}
    </div>
  );
}
