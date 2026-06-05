import type { JSX } from 'solid-js'
import type { Options } from 'sortablejs'
import { For, onCleanup, onMount } from 'solid-js'
import Sortable from 'sortablejs'

interface SortableListProps<T> {
  items: readonly T[]
  renderItem: (item: T, index: number) => JSX.Element
  onChange?: (next: T[]) => void
  class?: string
  itemClass?: string
  animation?: number
  handle?: string
  getItemKey?: (item: T, index: number) => string
  resolveItem?: (key: string) => T | undefined
  options?: Omit<Options, 'onEnd' | 'animation' | 'draggable' | 'dataIdAttr' | 'handle'>
}

export default function SortableList<T>(props: SortableListProps<T>) {
  let el!: HTMLDivElement

  // 检查目标列表中是否已存在相同 key，避免跨列表拖入重复项
  function hasChildKey(key: string) {
    return ([...el.children] as HTMLDivElement[])
      .some(child => child.dataset.key === key)
  }

  // 将排序后的 DOM 节点恢复成当前受控列表的顺序，避免 Sortable 持续接管 DOM
  function restoreDom(children: HTMLDivElement[]) {
    const currentOrder = new Map(
      props.items.map((item, index) => [
        props.getItemKey?.(item, index) ?? String(index),
        index,
      ]),
    )

    const restored = children
      .filter(child => currentOrder.has(child.dataset.key ?? ''))
      .sort((left, right) => {
        const leftIndex = currentOrder.get(left.dataset.key ?? '') ?? 0
        const rightIndex = currentOrder.get(right.dataset.key ?? '') ?? 0
        return leftIndex - rightIndex
      })

    el.replaceChildren(...restored)
  }

  // 按当前 DOM 顺序提取条目，并在跨列表拖拽时补回源列表中不存在的对象
  function getNextItems() {
    const currentItems = new Map(
      props.items.map((item, index) => [
        props.getItemKey?.(item, index) ?? String(index),
        item,
      ]),
    )

    return ([...el.children] as HTMLDivElement[])
      .map((child) => {
        const key = child.dataset.key ?? ''
        return currentItems.get(key) ?? props.resolveItem?.(key)
      })
      .filter((item): item is T => item !== undefined)
  }

  // 根据当前 DOM 顺序生成新列表，并把 DOM 恢复到受控状态
  function syncFromDom() {
    const children = [...el.children] as HTMLDivElement[]
    const newItems = getNextItems()
    restoreDom(children)
    props.onChange?.(newItems)
  }

  onMount(() => {
    const sortable = Sortable.create(el, {
      animation: props.animation ?? 150,
      draggable: '[data-sortable-item]',
      handle: props.handle,
      ...props.options,
      // 跨列表拖入前先拦截重复 key，避免目标列表出现重复项
      onMove(evt) {
        if (evt.to !== el || evt.from === el)
          return

        const draggedKey = (evt.dragged as HTMLDivElement | undefined)?.dataset.key ?? ''
        if (draggedKey && hasChildKey(draggedKey))
          return false
      },
      // 目标列表接收跨列表拖入后，同步一次受控数据
      onAdd() {
        syncFromDom()
      },
      // 同列表内部排序完成后，同步一次受控数据
      onUpdate(evt) {
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex == null || newIndex == null || oldIndex === newIndex)
          return

        syncFromDom()
      },
    })
    onCleanup(() => sortable.destroy())
  })

  return (
    <div ref={el} class={props.class}>
      <For each={props.items}>
        {(item, index) => (
          <div
            class={props.itemClass ?? 'drag-item'}
            data-sortable-item
            data-index={index()}
            data-key={props.getItemKey?.(item, index()) ?? String(index())}
          >
            {props.renderItem(item, index())}
          </div>
        )}
      </For>
    </div>
  )
}
