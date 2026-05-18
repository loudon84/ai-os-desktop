import { EventEmitter } from "events";
import type {
  ShellViewKind,
  ShellViewLayer,
  ShellViewBounds,
  ShellViewState,
} from "../../../shared/shell/view-contract";

/**
 * View 事件映射
 */
export interface ViewEventMap {
  "view:created": {
    id: string;
    kind: ShellViewKind;
    layer: ShellViewLayer;
  };
  "view:destroyed": {
    id: string;
    kind: ShellViewKind;
    layer: ShellViewLayer;
  };
  "view:activated": {
    id: string;
    kind: ShellViewKind;
    layer: ShellViewLayer;
  };
  "view:deactivated": {
    id: string;
    kind: ShellViewKind;
    layer: ShellViewLayer;
  };
  "view:bounds-changed": {
    id: string;
    kind: ShellViewKind;
    bounds: ShellViewBounds;
  };
  "view:state-changed": {
    id: string;
    state: ShellViewState;
    previousState: ShellViewState;
  };
  "view:brought-to-front": {
    id: string;
    kind: ShellViewKind;
    layer: ShellViewLayer;
  };
}

/**
 * View 事件总线
 *
 * 跨 View、跨 Layer 的事件通知机制。
 */
export class ViewEventBus extends EventEmitter {
  emit<K extends keyof ViewEventMap>(event: K, data: ViewEventMap[K]): boolean {
    return super.emit(event, data);
  }

  on<K extends keyof ViewEventMap>(
    event: K,
    listener: (data: ViewEventMap[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  off<K extends keyof ViewEventMap>(
    event: K,
    listener: (data: ViewEventMap[K]) => void,
  ): this {
    return super.off(event, listener);
  }

  // 便捷方法
  emitViewCreated(
    id: string,
    kind: ShellViewKind,
    layer: ShellViewLayer,
  ): void {
    this.emit("view:created", { id, kind, layer });
  }

  emitViewDestroyed(
    id: string,
    kind: ShellViewKind,
    layer: ShellViewLayer,
  ): void {
    this.emit("view:destroyed", { id, kind, layer });
  }

  emitViewActivated(
    id: string,
    kind: ShellViewKind,
    layer: ShellViewLayer,
  ): void {
    this.emit("view:activated", { id, kind, layer });
  }

  emitViewDeactivated(
    id: string,
    kind: ShellViewKind,
    layer: ShellViewLayer,
  ): void {
    this.emit("view:deactivated", { id, kind, layer });
  }

  emitViewBoundsChanged(
    id: string,
    kind: ShellViewKind,
    bounds: ShellViewBounds,
  ): void {
    this.emit("view:bounds-changed", { id, kind, bounds });
  }

  emitViewStateChanged(
    id: string,
    state: ShellViewState,
    previousState: ShellViewState,
  ): void {
    this.emit("view:state-changed", { id, state, previousState });
  }

  emitViewBroughtToFront(
    id: string,
    kind: ShellViewKind,
    layer: ShellViewLayer,
  ): void {
    this.emit("view:brought-to-front", { id, kind, layer });
  }
}

// 全局单例
export const viewEventBus = new ViewEventBus();
