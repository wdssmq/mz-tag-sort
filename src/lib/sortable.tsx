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
  getItemKey?: (item: T, index: number) => string
  resolveItem?: (key: string) => T | undefined
  options?: Omit<Options, 'onEnd' | 'animation' | 'draggable' | 'dataIdAttr' | 'handle'>
}

export default function SortableList<T>(props: SortableListProps<T>) {
  let el!: HTMLDivElement

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

  onMount(() => {
    const sortable = Sortable.create(el, {
      animation: props.animation ?? 150,
      draggable: '[data-sortable-item]',
      handle: props.handle,
      ...props.options,
      onEnd(evt: SortableEvent) {
        if (evt.to !== el)
          return

        const oldIndex = evt.oldIndex
        const newIndex = evt.newIndex
        if (evt.from === el && (oldIndex == null || newIndex == null || oldIndex === newIndex))
          return

        const children = [...el.children] as HTMLDivElement[]
        const newItems = getNextItems()
        restoreDom(children)
        props.onChange?.(newItems)
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
