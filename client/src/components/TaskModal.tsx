import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useWorkspaceMembers } from '../useWorkspaceMembers';
import { useTasks } from '../taskStoreContext';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { useUserProfile } from '../userProfileContext';

type FormValues = { title: string; description: string; status: TaskStatus; priority: TaskPriority; assigneeId: string; dueDate: string };

export function TaskModal({ task, workspaceId, onClose }: { task?: Task; workspaceId: string; onClose: () => void }) {
  const { saveTask, deleteTask } = useTasks();
  const { currentMember, profile, setProfile } = useUserProfile();
  const { workspaceMembers, error: membersError } = useWorkspaceMembers(workspaceId);
  const needsName = !profile.name || profile.name === 'Workspace User';
  const [enteredName, setEnteredName] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    reset({ title: task?.title ?? '', description: task?.description ?? '', status: task?.status ?? 'todo', priority: task?.priority ?? 'medium', assigneeId: task?.assignee.id ?? currentMember.id, dueDate: (task?.dueDate ?? new Date().toISOString()).slice(0, 10) });
  }, [currentMember.id, reset, task]);

  const submit = async (values: FormValues) => {
    if (needsName && !enteredName.trim()) {
      setRequestError('Please enter your name before creating a task.');
      return;
    }
    const name = needsName ? enteredName.trim() : currentMember.name;
    const words = name.split(/\s+/);
    const self = { ...currentMember, name, initials: (words.length > 1 ? words[0][0] + words[words.length - 1][0] : name.slice(0, 2)).toUpperCase() };
    const selected = workspaceMembers.find((member) => member.id === values.assigneeId);
    if (!selected) {
      setRequestError('Please select a current workspace member.');
      return;
    }
    const assignee = selected.id === self.id ? self : selected;
    if (needsName) setProfile({ ...profile, name });
    setIsSubmitting(true);
    setRequestError(null);
    try {
      await saveTask({ id: task?.id ?? crypto.randomUUID(), ...values, dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(), assignee, creator: task?.creator ?? self, workspaceId, createdAt: task?.createdAt ?? new Date().toISOString() }, !task);
      onClose();
    } catch (reason) {
      setRequestError(reason instanceof Error ? reason.message : 'Unable to save this task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async () => {
    if (!task || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsSubmitting(true);
    setRequestError(null);
    try {
      await deleteTask(task.id);
      onClose();
    } catch (reason) {
      setRequestError(reason instanceof Error ? reason.message : 'Unable to delete this task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-heading"><div><span>{task ? 'EDIT TASK' : 'NEW TASK'}</span><h2 id="task-modal-title">{task ? 'Update task' : 'Create a new task'}</h2></div><button aria-label="Close" onClick={onClose}><X /></button></div>
      <form onSubmit={handleSubmit(submit)}>
        {needsName ? <label className="full">Your name<input autoComplete="name" required maxLength={100} value={enteredName} onChange={(event) => setEnteredName(event.target.value)} placeholder="Enter your name" /></label> : null}
        <label className="full">Title<input autoFocus {...register('title', { required: 'A title is required' })} />{errors.title ? <small className="error">{errors.title.message}</small> : null}</label>
        <label className="full">Description<textarea rows={3} {...register('description')} /></label>
        <label>Status<select {...register('status')}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
        <label>Priority<select {...register('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Assignee<select {...register('assigneeId', { required: true })}>{task && !workspaceMembers.some((member) => member.id === task.assignee.id) ? <option value={task.assignee.id} disabled>Choose a current member</option> : null}{workspaceMembers.map((member) => <option value={member.id} key={member.id}>{member.id === currentMember.id && needsName ? enteredName.trim() || 'You — enter your name above' : member.name}</option>)}</select></label>
        {membersError ? <p className="request-error" role="status">{membersError}</p> : null}
        <label>Due date<input type="date" {...register('dueDate', { required: true })} /></label>
        {requestError ? <p className="request-error" role="alert">{requestError}</p> : null}
        <div className="modal-actions">{task ? <button type="button" className="danger" disabled={isSubmitting} onClick={remove}>Delete task</button> : <span />}<div><button type="button" className="secondary" disabled={isSubmitting} onClick={onClose}>Cancel</button><button type="submit" className="primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : task ? 'Save changes' : 'Create task'}</button></div></div>
      </form>
    </section>
  </div>;
}
