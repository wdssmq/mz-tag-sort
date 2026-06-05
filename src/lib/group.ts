import { lsObj } from './base'

export interface Group {
  id: string
  name: string
  items: string[]
}

// 分组名只做首尾空白裁剪，保留用户原始命名风格。
function normalizeGroupName(name: string) {
  return name.trim()
}

// 标签项在写入前统一裁剪、去空，并按首次出现顺序去重。
function normalizeGroupItems(items: string[]) {
  return [...new Set(items.map(item => item.trim()).filter(item => item.length > 0))]
}

// 生成下一个可用的默认分组名，优先补最小缺失序号
function getDefaultGroupName(groups: Group[]) {
  const prefix = '新分组 '
  const usedIndexes = new Set(
    groups
      .map((item) => {
        if (!item.name.startsWith(prefix))
          return null

        const suffix = Number.parseInt(item.name.slice(prefix.length), 10)
        return Number.isInteger(suffix) && suffix > 0 ? suffix : null
      })
      .filter((value): value is number => value !== null),
  )

  let nextIndex = 1
  while (usedIndexes.has(nextIndex))
    nextIndex += 1

  return `${prefix}${nextIndex}`
}

// 为新分组生成稳定的本地唯一标识。
function createGroupId() {
  // 优先使用浏览器原生 UUID，回退到时间戳 + 随机串，满足本地持久化场景即可。
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID()

  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const group = {
  GROUPS_CACHE_KEY: 'lib-tag-sort:groups',

  // 从本地缓存读取分组，并在进入运行态前完成基础清洗。
  loadGroups() {
    const cached = lsObj.getItem(group.GROUPS_CACHE_KEY, [])
    if (!Array.isArray(cached))
      return [] as Group[]

    return cached
      .filter((item): item is Partial<Group> => !!item && typeof item === 'object')
      .map((item) => {
        // 读取本地缓存时顺手清洗脏数据，避免旧数据或手工修改污染运行态。
        const name = typeof item.name === 'string' ? normalizeGroupName(item.name) : ''
        const items = Array.isArray(item.items)
          ? normalizeGroupItems(item.items.filter((value): value is string => typeof value === 'string'))
          : []

        return {
          id: typeof item.id === 'string' && item.id.length > 0 ? item.id : createGroupId(),
          name,
          items,
        }
      })
      .filter(item => item.name.length > 0)
  },

  // 将当前分组列表完整写回本地缓存。
  saveGroups(groups: Group[]) {
    lsObj.setItem(group.GROUPS_CACHE_KEY, groups)
  },

  // 创建前统一校验分组名；空白名直接视为无效输入。
  createGroup(name: string) {
    const normalizedName = normalizeGroupName(name)
    if (!normalizedName)
      return null

    return {
      id: createGroupId(),
      name: normalizedName,
      items: [],
    } satisfies Group
  },

  // 创建成功时把新分组追加到列表末尾，否则保持原列表不变。
  appendGroup(groups: Group[], name: string) {
    const nextGroup = group.createGroup(name)
    if (!nextGroup)
      return groups

    return [...groups, nextGroup]
  },

  // 追加一个按默认规则命名的空分组
  appendDefaultGroup(groups: Group[]) {
    return group.appendGroup(groups, getDefaultGroupName(groups))
  },

  // 按分组 id 删除目标分组。
  removeGroup(groups: Group[], groupId: string) {
    return groups.filter(item => item.id !== groupId)
  },

  // 重命名指定分组；空白名称会被直接忽略。
  renameGroup(groups: Group[], groupId: string, name: string) {
    const normalizedName = normalizeGroupName(name)
    if (!normalizedName)
      return groups

    // 仅替换目标分组名称，保持其余分组及标签顺序不变。
    return groups.map(item => item.id === groupId ? { ...item, name: normalizedName } : item)
  },

  // 用一组新标签完整替换目标分组的标签内容。
  setGroupItems(groups: Group[], groupId: string, items: string[]) {
    const nextItems = normalizeGroupItems(items)
    // 外部整组覆盖标签时，同样沿用统一的裁剪和去重规则。
    return groups.map(item => item.id === groupId ? { ...item, items: nextItems } : item)
  },

  // 向目标分组追加标签，并在合并后统一去重。
  appendGroupItems(groups: Group[], groupId: string, items: string[]) {
    return groups.map((item) => {
      if (item.id !== groupId)
        return item

      return {
        ...item,
        // 追加时与已有标签合并后再统一去重，避免拖拽和批量添加产生重复项。
        items: normalizeGroupItems([...item.items, ...items]),
      }
    })
  },

  // 按索引移除目标分组中的单个标签；越界时保持原数据不变。
  removeGroupItem(groups: Group[], groupId: string, index: number) {
    return groups.map((item) => {
      if (item.id !== groupId || index < 0 || index >= item.items.length)
        return item

      return {
        ...item,
        items: item.items.toSpliced(index, 1),
      }
    })
  },

  // 从标签列表中筛出包含关键词的项，用于批量添加场景。
  matchItemsByKeyword(items: string[], keyword: string) {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase()
    if (!normalizedKeyword)
      return []

    // 匹配时统一转成小写，提供简单稳定的大小写不敏感包含搜索。
    return items.filter(item => item.toLocaleLowerCase().includes(normalizedKeyword))
  },
}
