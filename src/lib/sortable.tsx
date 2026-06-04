import type { JSX } from 'solid-js'
import type { Options, SortableEvent } from 'sortablejs'
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
  options?: Omit<Options, 'onEnd' | 'animation' | 'draggable' | 'dataIdAttr' | 'handle'>
}

export default function SortableList<T>(props: SortableListProps<T>) {
  let el!: HTMLDivElement

  onMount(() => {
    const sortable = Sortable.create(el, {
      animation: props.animation ?? 150,
      draggable: '[data-sortable-item]',
      handle: props.handle,
      ...props.options,
      onEnd(evt: SortableEvent) {
        // 根据拖拽结果更新数据源（重新排列数组）
        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (oldIndex === newIndex || oldIndex == null || newIndex == null)
          return
        // 获取当前 DOM 中的子元素顺序，映射回数据项
        const children = [
          ...el.children,
        ] as HTMLSpanElement[]
        // 根据 data-index 属性获取新的数据项顺序
        const newItems = children.map(v =>
          props.items[Number.parseInt(v.dataset.index!)],
        ) as T[]
        // 恢复旧的 DOM 顺序，保证上层数据重新渲染后得到预期的结果
        children.sort(
          (a, b) => Number.parseInt(a.dataset.index!) - Number.parseInt(b.dataset.index!),
        )
        el?.replaceChildren(...children)
        // 通知上层组件数据已更新
        props.onChange?.(newItems)
      },
    })
    onCleanup(() => sortable.destroy())
  })

  return (
    <div ref={el} class={props.class}>
      <For each={props.items}>
        {(item, index) => (
          <div class={props.itemClass ?? 'drag-item'} data-sortable-item data-index={index()}>
            {props.renderItem(item, index())}
          </div>
        )}
      </For>
    </div>
  )
}
