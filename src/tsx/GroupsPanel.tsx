import type { Component } from 'solid-js'
import type { Group } from '../lib/group'
import { For } from 'solid-js'

import { group } from '../lib/group'
import GroupCard from './GroupCard'

interface GroupsPanelProps {
  items: readonly string[]
  groups: readonly Group[]
  onChange: (nextGroups: Group[]) => void
}

const GroupsPanel: Component<GroupsPanelProps> = (props) => {
  // 通过占位卡片直接追加一个默认命名的新分组
  function handleCreateGroup() {
    props.onChange(group.appendDefaultGroup([...props.groups]))
  }

  return (
    <div class="grid grid-cols-2 gap-4">
      <For each={props.groups}>
        {entry => (
          <GroupCard
            entry={entry}
            sourceItems={props.items}
            onRename={name => props.onChange(group.renameGroup([...props.groups], entry.id, name))}
            onAppendItems={nextItems => props.onChange(group.appendGroupItems([...props.groups], entry.id, nextItems))}
            onChangeItems={nextItems => props.onChange(group.setGroupItems([...props.groups], entry.id, nextItems))}
            onRemoveItem={index => props.onChange(group.removeGroupItem([...props.groups], entry.id, index))}
            onRemove={() => props.onChange(group.removeGroup([...props.groups], entry.id))}
          />
        )}
      </For>

      <button
        type="button"
        class="min-h-52 flex flex-col items-center justify-center gap-2 border border-gray-300 rounded-lg border-dashed bg-gray-50 text-gray-500 transition-colors hover:border-gray-400 hover:bg-gray-100"
        onClick={handleCreateGroup}
      >
        <span class="text-3xl text-gray-400 leading-none">+</span>
        <span class="text-sm text-gray-700 font-600">添加新分组</span>
        <span class="text-xs text-gray-400 leading-5">
          {props.groups.length === 0
            ? '先创建一个分组，然后把左侧标签拖拽进来。'
            : '点击后立即创建一个新的空分组。'}
        </span>
      </button>
    </div>
  )
}

export default GroupsPanel
