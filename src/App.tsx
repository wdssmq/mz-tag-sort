import type { Component, JSX } from 'solid-js'
import { createSignal } from 'solid-js'

import { core } from './core'
import SortableList from './lib/sortable'
import './style/style.sass'

// TSX 组件
const App: Component = () => {
  // 初始化 tag 条目
  const initialItems = core.loadItems()
  const [text, setText] = createSignal(core.serializeItems(initialItems))
  const [items, setItems] = createSignal(initialItems)
  // 编辑索引及草稿值
  const [editingIndex, setEditingIndex] = createSignal<number | null>(null)
  const [draftValue, setDraftValue] = createSignal('')

  // 文本变更时提交条目列表更新
  function commitItems(nextItems: string[]) {
    const nextText = core.serializeItems(nextItems)
    setItems([...new Set(nextItems)]) // 去重
    setText(nextText)
    core.saveText(nextText)
  }

  // 处理文本输入事件
  const handleTextareaInput: JSX.EventHandler<HTMLTextAreaElement, InputEvent> = (event) => {
    const nextText = core.normalizeInputText(event.currentTarget.value)
    commitItems(core.parseItems(nextText))
  }

  // 处理条目编辑开始事件
  function handleStartEdit(index: number) {
    setEditingIndex(index)
    setDraftValue(items()[index] ?? '')
  }

  // 处理条目编辑保存事件
  function handleSaveEdit(index: number) {
    commitItems(core.updateItem(items(), index, draftValue()))
    setEditingIndex(null)
    setDraftValue('')
  }

  // 组件渲染
  return (
    <div
      id="tags-sortable-container"
    >
      <textarea
        name="tags"
        placeholder="用逗号分隔项目，例如：苹果, 香蕉, 橘子"
        value={text()}
        onInput={handleTextareaInput}
      />

      <div class="tags-list-wrap">
        <SortableList
          class="tags-list"
          itemClass="tag-item"
          items={items()}
          getId={item => item}
          onChange={commitItems}
          renderItem={(item, index) => (
            <>
              {editingIndex() === index
                ? (
                    <input
                      type="text"
                      class="edit-input"
                      value={draftValue()}
                      onInput={event => setDraftValue(event.currentTarget.value)}
                      onBlur={() => handleSaveEdit(index)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur()
                        }
                        else if (event.key === 'Escape') {
                          setEditingIndex(null)
                          setDraftValue('')
                        }
                      }}
                      ref={(element) => {
                        queueMicrotask(() => {
                          element.focus()
                        })
                      }}
                    />
                  )
                : (
                    <>
                      <span class="text" onDblClick={() => handleStartEdit(index)}>
                        {item}
                      </span>
                      <div class="actions">
                        <button
                          type="button"
                          class="delete-btn"
                          onClick={() => {
                            const nextItems = core.removeItem(items(), index)
                            commitItems(nextItems)
                          }}
                        >
                          删除
                        </button>
                      </div>
                    </>
                  )}
            </>
          )}
        />
      </div>
    </div>
  )
}

export default App
