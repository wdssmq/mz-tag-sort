import type { JSX } from 'solid-js'
import type { Options, SortableEvent } from 'sortablejs'
import { For, onCleanup, onMount } from 'solid-js'
import Sortable from 'sortablejs'

interface SortableListProps<T> {
  items: readonly T[]
  getId: (item: T) => string
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
      dataIdAttr: 'data-id',
      draggable: '[data-sortable-item]',
      handle: props.handle,
      ...props.options,
      onEnd(evt: SortableEvent) {
        if (evt.oldIndex == null || evt.newIndex == null)
          return

        const orderedIds = sortable.toArray()
        const itemById = new Map(props.items.map(item => [props.getId(item), item]))
        const next = orderedIds
          .map(id => itemById.get(id))
          .filter((item): item is T => item !== undefined)

        props.onChange?.(next)
      },
    })

    onCleanup(() => sortable.destroy())
  })

  return (
    <div ref={el} class={props.class}>
      <For each={props.items}>
        {(item, index) => (
          <div class={props.itemClass ?? 'drag-item'} data-sortable-item data-id={props.getId(item)}>
            {props.renderItem(item, index())}
          </div>
        )}
      </For>
    </div>
  )
}
