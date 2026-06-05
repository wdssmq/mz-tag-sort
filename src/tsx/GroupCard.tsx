import type { Component } from 'solid-js'
import type { Group } from '../lib/group'
import { createSignal, Show } from 'solid-js'

import { group } from '../lib/group'
import SortableList from '../lib/sortable'

interface GroupCardProps {
  entry: Group
  sourceItems: readonly string[]
  onRename: (name: string) => void
  onAppendItems: (items: string[]) => void
  onChangeItems: (items: string[]) => void
  onRemoveItem: (index: number) => void
  onRemove: () => void
}

const GroupCard: Component<GroupCardProps> = (props) => {
  const [keyword, setKeyword] = createSignal('')
  const [groupName, setGroupName] = createSignal('')
  const [editMode, setEditMode] = createSignal<'groupName' | 'keyword' | null>(null)

  // 执行批量添加
  function handleBatchAdd() {
    const matchedItems = group.matchItemsByKeyword([...props.sourceItems], keyword())
    if (matchedItems.length === 0)
      return

    props.onAppendItems(matchedItems)
    setKeyword('')
    setEditMode(null)
  }

  // 执行分组重命名
  function handleRenameGroup() {
    const nextName = groupName().trim()
    if (!nextName)
      return

    props.onRename(nextName)
    setEditMode(null)
  }

  const Edit = (name: 'groupName' | 'keyword' | null) => {
    return (
      <>
        <Show when={name === 'groupName'}>
          <div class="flex gap-2">
            <input
              type="text"
              name="groupName"
              placeholder="输入分组名称"
              value={groupName()}
              onInput={event => setGroupName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter')
                  handleRenameGroup()
                else if (event.key === 'Escape')
                  setEditMode(null)
              }}
            />
            <button
              type="button"
              class="btn"
              onClick={handleRenameGroup}
            >
              确认修改
            </button>
          </div>
        </Show>
        <Show when={name === 'keyword'}>
          <div class="flex gap-2">
            <input
              type="text"
              name="keyword"
              placeholder="输入关键词，例如：猫"
              value={keyword()}
              onInput={event => setKeyword(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter')
                  handleBatchAdd()
                else if (event.key === 'Escape')
                  setEditMode(null)
              }}
            />
            <button
              type="button"
              class="btn"
              onClick={handleBatchAdd}
            >
              确认加入
            </button>
          </div>
        </Show>
      </>
    )
  }

  return (
    <section class="group-card min-h-37 flex flex-col gap-3">
      <div class="flex items-center justify-between gap-2 px-[5px] pt-[5px]">
        {/* 一 */}
        <div>
          <div class="text-base font-600 leading-none">{props.entry.name}</div>
          <div class="mt-1 text-xs text-gray-500">
            {props.entry.items.length}
            {' '}
            项
          </div>
        </div>
        {/* 二 */}
        {editMode()
          ? Edit(editMode())
          : null}
        {/* 三 */}
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="btn-sm btn"
            onClick={() => {
              setGroupName(props.entry.name)
              setEditMode(value => value === 'groupName' ? null : 'groupName')
            }}
          >
            修改分组名
          </button>
          <button
            type="button"
            class="btn-sm btn"
            onClick={() => setEditMode(value => value === 'keyword' ? null : 'keyword')}
          >
            批量添加
          </button>
          <button
            type="button"
            class="btn-sm btn"
            onClick={() => props.onRemove()}
          >
            删除分组
          </button>
        </div>
      </div>

      <SortableList
        class="tags-list group-list"
        itemClass="tag-item"
        items={props.entry.items}
        onChange={props.onChangeItems}
        getItemKey={item => item}
        resolveItem={key => props.sourceItems.find(item => item === key) ?? props.entry.items.find(item => item === key)}
        options={{
          group: {
            name: 'tag-groups',
            pull: false,
            put: true,
          },
        }}
        renderItem={(item, index) => (
          <>
            <span class="text">{item}</span>
            <div class="actions">
              <button
                type="button"
                class="btn"
                onClick={() => props.onRemoveItem(index)}
              >
                删除
              </button>
            </div>
          </>
        )}
      />
      {props.entry.items.length === 0 && (
        <div class="text-xs text-gray-400">
          拖拽左侧标签到这里，或使用“批量添加”按关键词复制。
        </div>
      )}
    </section>
  )
}

export default GroupCard
