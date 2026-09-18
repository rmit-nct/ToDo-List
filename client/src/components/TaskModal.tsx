import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTasks } from '../taskStoreContext'
import { useWorkspaceMembers } from '../useWorkspaceMembers'
import type { Task, TaskPriority, TaskStatus } from '../types'
type FormValues = { title: string; description: string; status: TaskStatus; priority: TaskPriority; assigneeId: string; dueDate: string }
export function TaskModal({ task, workspaceId, onClose }: { task?: Task; workspaceId: string; onClose: () => void }) {
  const { saveTask, deleteTask } = useTasks()
  const { workspaceMembers, currentMember, workspaceInfo, error: memberError } = useWorkspaceMembers(workspaceId)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const modal = useRef<HTMLElement>(null)
  const canDelete = !workspaceInfo.ownerId || currentMember?.id === workspaceInfo.ownerId || task?.creator?.id === currentMember?.id
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const elements = Array.from(modal.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') || [])
        const first = elements[0], last = elements[elements.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus() }
  }, [busy, onClose])
  const { register, handleSubmit, reset, getValues, setValue, formState: { errors } } = useForm<FormValues>()
  useEffect(() => {
    reset({ title: task?.title ?? '', description: task?.description ?? '', status: task?.status ?? 'todo',
      priority: task?.priority ?? 'medium', assigneeId: task?.assignee?.id ?? task?.assignedMemberId ?? '',
      dueDate: (task?.dueDate ?? new Date().toISOString()).slice(0, 10) })
  }, [reset, task])
  useEffect(() => {
    if (!workspaceMembers.length) return
    const selected = getValues('assigneeId')
    const valid = workspaceMembers.some(member => member.id === selected)
    setValue('assigneeId', valid ? selected : task ? '' : currentMember?.id || '')
  }, [workspaceMembers, currentMember, getValues, setValue, task])
  const submit = async (values: FormValues) => {
    const assignee = workspaceMembers.find((member) => member.id === values.assigneeId)
    if (!assignee || !currentMember) { setRequestError('Join this workspace and select a current member before saving.'); return }
    setBusy(true); setRequestError(null)
    try {
      await saveTask({ ...values, id: task?.id ?? crypto.randomUUID(), title: values.title.trim(),
        dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(), assignee, assignedMemberId: assignee.id,
        creator: task?.creator ?? currentMember, workspaceId, createdAt: task?.createdAt ?? new Date().toISOString() })
      onClose()
    } catch (reason) { setRequestError(reason instanceof Error ? reason.message : 'Unable to save task.') }
    finally { setBusy(false) }
  }
  const remove = async () => {
    if (!task || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setBusy(true); setRequestError(null)
    try { await deleteTask(task.id); onClose() }
    catch (reason) { setRequestError(reason instanceof Error ? reason.message : 'Unable to delete task.') }
    finally { setBusy(false) }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => !busy && event.currentTarget === event.target && onClose()}>
    <section ref={modal} className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-heading"><div><span>{task ? 'EDIT TASK' : 'NEW TASK'}</span><h2 id="task-modal-title">{task ? 'Update task' : 'Create a new task'}</h2></div><button type="button" disabled={busy} aria-label="Close" onClick={onClose}><X /></button></div>
      <form onSubmit={handleSubmit(submit)}>
        <label className="full">Title<input autoFocus {...register('title', { required: 'A title is required', validate: (value) => !!value.trim() || 'A title is required' })} />{errors.title ? <small className="error">{errors.title.message}</small> : null}</label>
        <label className="full">Description<textarea rows={3} {...register('description')} /></label>
        <label>Status<select aria-label="Status" {...register('status')}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
        <label>Priority<select aria-label="Priority" {...register('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Assignee<select aria-label="Assignee" {...register('assigneeId', { required: true })}><option value="">Select a workspace member</option>{workspaceMembers.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
        <label>Due date<input type="date" {...register('dueDate', { required: true })} /></label>
        {memberError || requestError ? <p className="request-error" role="alert">{requestError ?? memberError}</p> : null}
        {!memberError && workspaceMembers.length > 0 && !currentMember ? <p className="request-error">Please <a href={`/workspace/${workspaceId}`}>join this workspace</a> with your name before creating tasks.</p> : null}
        <div className="modal-actions">{task && canDelete ? <button type="button" className="danger" disabled={busy} onClick={remove}>Delete task</button> : <span />}<div><button type="button" className="secondary" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={busy || !currentMember}>{busy ? 'Saving...' : task ? 'Save changes' : 'Create task'}</button></div></div>
      </form>
    </section>
  </div>
}
