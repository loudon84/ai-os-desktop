import { useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useI18n } from "../../components/useI18n";
import type { ProfileEntrySummary } from "../../../../shared/profile-runtime/profile-runtime-contract";
import type { View } from "../../types/desktop-shell";
import { buildMainWorkspaceTabs } from "./main-page-tabs";
import type { ExternalBrowserTab, MainWorkspaceTab } from "./main-page-types";
import { FIXED_TAB_IDS, isDraggableTabId, sortTabsByOrder } from "./tab-order";

interface MainViewTabsProps {
  activeView: View;
  profileEntries: ProfileEntrySummary[];
  externalTabs: ExternalBrowserTab[];
  tabOrder: string[];
  onTabOrderChange: (order: string[]) => void;
  onNavigate: (view: View) => void;
  onCloseTab: (id: View) => void;
}

interface TabItem extends MainWorkspaceTab {
  draggable: boolean;
}

function SortableTabButton({
  tab,
  label,
  isActive,
  onNavigate,
  onCloseTab,
}: {
  tab: TabItem;
  label: string;
  isActive: boolean;
  onNavigate: (view: View) => void;
  onCloseTab: (id: View) => void;
}): React.JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id, disabled: !tab.draggable });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`MainViewTabs__sortable ${isDragging ? "MainViewTabs__sortable--dragging" : ""}`}
    >
      {tab.draggable ? (
        <button
          type="button"
          className="MainViewTabs__drag-handle no-drag"
          aria-label="Drag tab"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={12} />
        </button>
      ) : null}
      <button
        type="button"
        className={`MainViewTabs__item ${isActive ? "active" : ""}`}
        title={label}
        onClick={() => onNavigate(tab.id)}
      >
        <span>{label}</span>
      </button>
      {tab.closeable ? (
        <button
          type="button"
          className="MainViewTabs__close no-drag"
          aria-label="Close tab"
          onClick={(event) => {
            event.stopPropagation();
            onCloseTab(tab.id);
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}

export function MainViewTabs({
  activeView,
  profileEntries,
  externalTabs,
  tabOrder,
  onTabOrderChange,
  onNavigate,
  onCloseTab,
}: MainViewTabsProps): React.JSX.Element {
  const { t } = useI18n();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { fixedTabs, draggableTabs } = useMemo(() => {
    const workspaceTabs = buildMainWorkspaceTabs(profileEntries);
    const fixed = workspaceTabs.filter((tab) =>
      (FIXED_TAB_IDS as readonly string[]).includes(tab.id),
    );
    const profileDraggable: TabItem[] = workspaceTabs
      .filter((tab) => isDraggableTabId(tab.id))
      .map((tab) => ({ ...tab, draggable: true }));

    const externalItems: TabItem[] = externalTabs.map((tab) => ({
      id: tab.id as View,
      title: tab.title,
      closeable: true,
      source: "external" as const,
      draggable: true,
    }));

    const merged = [...profileDraggable, ...externalItems];
    const sorted = sortTabsByOrder(merged, tabOrder);

    return { fixedTabs: fixed, draggableTabs: sorted };
  }, [profileEntries, externalTabs, tabOrder]);

  const draggableIds = draggableTabs.map((tab) => String(tab.id));

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = draggableIds.indexOf(String(active.id));
    const newIndex = draggableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    onTabOrderChange(arrayMove(draggableIds, oldIndex, newIndex));
  };

  const renderLabel = (tab: TabItem): string =>
    tab.titleKey ? t(tab.titleKey) : (tab.title ?? tab.id);

  return (
    <nav className="MainViewTabs no-drag" aria-label="Workspace tabs">
      {fixedTabs.map((tab) => {
        const item: TabItem = { ...tab, draggable: false };
        const label = renderLabel(item);
        return (
          <button
            key={tab.id}
            type="button"
            className={`MainViewTabs__item ${activeView === tab.id ? "active" : ""}`}
            title={label}
            onClick={() => onNavigate(tab.id)}
          >
            <span>{label}</span>
          </button>
        );
      })}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draggableIds} strategy={horizontalListSortingStrategy}>
          {draggableTabs.map((tab) => (
            <SortableTabButton
              key={tab.id}
              tab={tab}
              label={renderLabel(tab)}
              isActive={activeView === tab.id}
              onNavigate={onNavigate}
              onCloseTab={onCloseTab}
            />
          ))}
        </SortableContext>
      </DndContext>
    </nav>
  );
}
