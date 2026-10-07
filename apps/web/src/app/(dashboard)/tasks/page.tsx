'use client'

import { useTeamMembers, useCurrentUser } from '@/components/dashboard/team-member-select'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input, Select } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { useApiClient } from '@/hooks/use-api-client'
import { formatElapsed, useTimer } from '@/providers/timer-provider'
import { Check, ChevronRight, Loader2, Play, Plus, Square, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

interface TaskList {
  _id: string
  name: string
  description?: string
  trackingEnabled: boolean
  taskCount: number
  completedCount: number
  projectId?: string
  projectName?: string
}

interface ProjectOption {
  _id: string
  name: string
}

interface TaskItem {
  _id: string
  title: string
  isComplete: boolean
  assigneeId?: string
  assigneeName?: string
}

export default function TasksPage () {
  const { apiFetch } = useApiClient()
  const { activeTimer, elapsedSeconds, starting, stopping, startTimer, stopTimer } =
    useTimer()
  const [lists, setLists] = useState<TaskList[]>([])
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [items, setItems] = useState<TaskItem[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [loadingItems, setLoadingItems] = useState(false)
  const [showListModal, setShowListModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [listName, setListName] = useState('')
  const [listProjectId, setListProjectId] = useState('')
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [itemTitle, setItemTitle] = useState('')
  const [itemAssigneeId, setItemAssigneeId] = useState('')
  const [saving, setSaving] = useState(false)
  const { members } = useTeamMembers()
  const { isManager } = useCurrentUser()

  const fetchLists = useCallback(async () => {
    setLoadingLists(true)
    try {
      const res = await apiFetch<{ data: TaskList[] }>('/tasks/lists')
      setLists(res.data)
      if (!selectedListId && res.data.length > 0) {
        setSelectedListId(res.data[0]._id)
      }
    } catch {
      setLists([])
    } finally {
      setLoadingLists(false)
    }
  }, [apiFetch, selectedListId])

  const fetchItems = useCallback(async () => {
    if (!selectedListId) {
      setItems([])
      return
    }
    setLoadingItems(true)
    try {
      const res = await apiFetch<{ data: TaskItem[] }>(
        `/tasks/lists/${selectedListId}/items`
      )
      setItems(res.data)
    } catch {
      setItems([])
    } finally {
      setLoadingItems(false)
    }
  }, [apiFetch, selectedListId])

  useEffect(() => {
    apiFetch<{ data: ProjectOption[] }>('/projects')
      .then(res => setProjects(res.data))
      .catch(() => setProjects([]))
  }, [apiFetch])

  useEffect(() => {
    queueMicrotask(() => {
      fetchLists()
    })
  }, [fetchLists])

  useEffect(() => {
    queueMicrotask(() => {
      fetchItems()
    })
  }, [fetchItems])

  async function createList () {
    if (!listName.trim() || !listProjectId) return
    setSaving(true)
    try {
      await apiFetch('/tasks/lists', {
        method: 'POST',
        body: JSON.stringify({
          name: listName.trim(),
          projectId: listProjectId
        })
      })
      toast.success('Task list created')
      setShowListModal(false)
      setListName('')
      setListProjectId('')
      fetchLists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create list')
    } finally {
      setSaving(false)
    }
  }

  async function createItem () {
    if (!selectedListId || !itemTitle.trim()) return
    setSaving(true)
    try {
      await apiFetch(`/tasks/lists/${selectedListId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          title: itemTitle.trim(),
          ...(itemAssigneeId ? { assigneeId: itemAssigneeId } : {})
        })
      })
      toast.success('Task added')
      setShowItemModal(false)
      setItemTitle('')
      setItemAssigneeId('')
      fetchItems()
      fetchLists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  async function toggleComplete (item: TaskItem) {
    try {
      await apiFetch(`/tasks/items/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isComplete: !item.isComplete })
      })
      fetchItems()
      fetchLists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update task')
    }
  }

  async function deleteItem (id: string) {
    try {
      await apiFetch(`/tasks/items/${id}`, { method: 'DELETE' })
      toast.success('Task deleted')
      fetchItems()
      fetchLists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete task')
    }
  }

  async function updateAssignee (item: TaskItem, assigneeId: string) {
    try {
      await apiFetch(`/tasks/items/${item._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId: assigneeId || null })
      })
      fetchItems()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update assignee'
      )
    }
  }

  async function linkListProject (projectId: string) {
    if (!selectedListId || !projectId) return
    try {
      await apiFetch(`/tasks/lists/${selectedListId}`, {
        method: 'PATCH',
        body: JSON.stringify({ projectId })
      })
      toast.success('Project linked to task list')
      fetchLists()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to link project')
    }
  }

  async function handleStartTask (item: TaskItem) {
    if (!selectedList?.projectId) return
    try {
      await startTimer(selectedList.projectId, item._id)
      toast.success(`Started tracking "${item.title}"`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start timer')
    }
  }

  async function handleStopTask () {
    try {
      await stopTimer()
      toast.success('Timer stopped')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to stop timer')
    }
  }

  const activeTaskId =
    activeTimer?.taskId && typeof activeTimer.taskId !== 'string'
      ? activeTimer.taskId._id
      : null

  const selectedList = lists.find(l => l._id === selectedListId)

  return (
    <div className='space-y-6'>
      <PageHeader title='Tasks' description='Task lists and assignments'>
        {isManager && (
          <Button size='sm' onClick={() => setShowListModal(true)}>
            <Plus className='h-3.5 w-3.5' />
            New list
          </Button>
        )}
      </PageHeader>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card padding='none' className='overflow-hidden'>
          <div className='border-b border-border px-4 py-3'>
            <p className='text-xs font-medium text-text-tertiary'>Task lists</p>
          </div>
          {loadingLists ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='h-5 w-5 animate-spin text-text-tertiary' />
            </div>
          ) : lists.length === 0 ? (
            <p className='px-4 py-8 text-sm text-text-tertiary'>
              No task lists yet. Create one to get started.
            </p>
          ) : (
            <ul>
              {lists.map(list => (
                <li key={list._id}>
                  <button
                    type='button'
                    onClick={() => setSelectedListId(list._id)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm transition-colors ${
                      selectedListId === list._id
                        ? 'bg-brand/10 text-text-primary'
                        : 'hover:bg-surface-elevated/60'
                    }`}
                  >
                    <div className='min-w-0'>
                      <p className='truncate font-medium'>{list.name}</p>
                      <p className='text-xs text-text-tertiary'>
                        {list.completedCount}/{list.taskCount} done
                        {list.projectName
                          ? ` · ${list.projectName}`
                          : ' · No project link one for mobile/desktop tracking'}
                      </p>
                    </div>
                    <ChevronRight className='h-4 w-4 shrink-0 opacity-50' />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className='lg:col-span-2' padding='none'>
          <div className='flex items-center justify-between border-b border-border px-4 py-3'>
            <div>
              <p className='text-sm font-medium'>
                {selectedList?.name ?? 'Select a list'}
              </p>
              {selectedList && !selectedList.projectId && isManager && (
                <div className='mt-2 flex items-center gap-2'>
                  <Select
                    className='text-xs'
                    defaultValue=''
                    onChange={e => linkListProject(e.target.value)}
                  >
                    <option value=''>Link project for agent tracking...</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {selectedList && selectedList.projectId && (
                <p className='text-xs text-text-tertiary'>
                  {selectedList.trackingEnabled
                    ? 'Time tracking enabled'
                    : 'Tracking off'}
                </p>
              )}
            </div>
            {selectedListId && (
              <Button
                size='sm'
                variant='secondary'
                onClick={() => setShowItemModal(true)}
              >
                <Plus className='h-3.5 w-3.5' />
                Add task
              </Button>
            )}
          </div>

          {loadingItems ? (
            <div className='flex justify-center py-16'>
              <Loader2 className='h-5 w-5 animate-spin text-text-tertiary' />
            </div>
          ) : !selectedListId ? (
            <p className='px-4 py-12 text-center text-sm text-text-tertiary'>
              Select a task list from the left
            </p>
          ) : items.length === 0 ? (
            <p className='px-4 py-12 text-center text-sm text-text-tertiary'>
              No tasks in this list
            </p>
          ) : (
            <ul className='divide-y divide-border'>
              {items.map(item => {
                const isTracking = activeTaskId === item._id
                const canTrack = !!selectedList?.projectId && !item.isComplete

                return (
                  <li
                    key={item._id}
                    className='flex items-center gap-3 px-4 py-3'
                  >
                    <button
                      type='button'
                      onClick={() => toggleComplete(item)}
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        item.isComplete
                          ? 'border-brand bg-brand text-white'
                          : 'border-border hover:border-brand'
                      }`}
                    >
                      {item.isComplete && <Check className='h-3 w-3' />}
                    </button>
                    <div className='min-w-0 flex-1'>
                      <p
                        className={`text-sm ${
                          item.isComplete
                            ? 'text-text-tertiary line-through'
                            : 'text-text-primary'
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>
                    {canTrack && (
                      <div className='flex shrink-0 items-center gap-2'>
                        {isTracking && (
                          <span className='font-mono text-xs tabular-nums text-brand'>
                            {formatElapsed(elapsedSeconds)}
                          </span>
                        )}
                        <button
                          type='button'
                          title={isTracking ? 'Stop tracking' : 'Start tracking'}
                          onClick={() =>
                            isTracking ? handleStopTask() : handleStartTask(item)
                          }
                          disabled={starting || stopping}
                          className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
                            isTracking
                              ? 'bg-brand text-white hover:opacity-90'
                              : 'text-text-tertiary hover:bg-surface-elevated hover:text-brand'
                          }`}
                        >
                          {isTracking ? (
                            <Square className='h-3 w-3 fill-current' />
                          ) : (
                            <Play className='h-3.5 w-3.5' />
                          )}
                        </button>
                      </div>
                    )}
                    <Select
                      value={item.assigneeId ?? ''}
                      onChange={e => updateAssignee(item, e.target.value)}
                      className='w-[140px] shrink-0 text-xs'
                    >
                      <option value=''>Unassigned</option>
                      {members.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.displayName}
                        </option>
                      ))}
                    </Select>
                    <button
                      type='button'
                      onClick={() => deleteItem(item._id)}
                      className='rounded p-1 text-text-tertiary hover:bg-surface-elevated hover:text-red-500'
                    >
                      <Trash2 className='h-4 w-4' />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={showListModal}
        onClose={() => setShowListModal(false)}
        title='New task list'
      >
        <div className='space-y-4'>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              List name
            </label>
            <Input
              value={listName}
              onChange={e => setListName(e.target.value)}
              placeholder='e.g. Sprint backlog'
              autoFocus
            />
          </div>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Project (required for agent tracking)
            </label>
            <Select
              value={listProjectId}
              onChange={e => setListProjectId(e.target.value)}
            >
              <option value=''>Select project...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              className='flex-1'
              onClick={() => setShowListModal(false)}
            >
              Cancel
            </Button>
            <Button
              className='flex-1'
              disabled={!listName.trim() || !listProjectId || saving}
              onClick={createList}
            >
              {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={showItemModal}
        onClose={() => setShowItemModal(false)}
        title='Add task'
      >
        <div className='space-y-4'>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Task title
            </label>
            <Input
              value={itemTitle}
              onChange={e => setItemTitle(e.target.value)}
              placeholder='What needs to be done?'
              autoFocus
            />
          </div>
          <div>
            <label className='mb-1.5 block text-xs text-text-tertiary'>
              Assignee
            </label>
            <Select
              value={itemAssigneeId}
              onChange={e => setItemAssigneeId(e.target.value)}
            >
              <option value=''>Unassigned</option>
              {members.map(m => (
                <option key={m._id} value={m._id}>
                  {m.displayName}
                </option>
              ))}
            </Select>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              className='flex-1'
              onClick={() => setShowItemModal(false)}
            >
              Cancel
            </Button>
            <Button
              className='flex-1'
              disabled={!itemTitle.trim() || saving}
              onClick={createItem}
            >
              {saving ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
