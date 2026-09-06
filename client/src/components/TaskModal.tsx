import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { members } from '../data';
import { useTasks } from '../taskStoreContext';
import type { Task, TaskPriority, TaskStatus } from '../types';

type FormValues = { title: string; description: string; status: TaskStatus; priority: TaskPriority; assigneeId: string; dueDate: string };

export function TaskModal({ task, workspaceId, onClose }: { task?: Task; workspaceId: string; onClose: () => void }) {
  const { saveTask, deleteTask } = useTasks();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();
  useEffect(() => {
    reset({ title: task?.title ?? '', description: task?.description ?? '', status: task?.status ?? 'todo', priority: task?.priority ?? 'medium', assigneeId: task?.assignee.id ?? members[0].id, dueDate: (task?.dueDate ?? new Date().toISOString()).slice(0, 10) });
  }, [reset, task]);

  const submit = (values: FormValues) => {
    const assignee = members.find((member) => member.id === values.assigneeId) ?? members[0];
    saveTask({ id: task?.id ?? crypto.randomUUID(), ...values, dueDate: new Date(`${values.dueDate}T12:00:00`).toISOString(), assignee, creator: task?.creator ?? members[0], workspaceId, createdAt: task?.createdAt ?? new Date().toISOString() });
    onClose();
  };

  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
    <section className="modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
      <div className="modal-heading"><div><span>{task ? 'EDIT TASK' : 'NEW TASK'}</span><h2 id="task-modal-title">{task ? 'Update task' : 'Create a new task'}</h2></div><button aria-label="Close" onClick={onClose}><X /></button></div>
      <form onSubmit={handleSubmit(submit)}>
        <label className="full">Title<input autoFocus {...register('title', { required: 'A title is required' })} />{errors.title ? <small className="error">{errors.title.message}</small> : null}</label>
        <label className="full">Description<textarea rows={3} {...register('description')} /></label>
        <label>Status<select {...register('status')}><option value="todo">To do</option><option value="in-progress">In progress</option><option value="done">Done</option></select></label>
        <label>Priority<select {...register('priority')}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Assignee<select {...register('assigneeId')}>{members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label>Due date<input type="date" {...register('dueDate', { required: true })} /></label>
        <div className="modal-actions">{task ? <button type="button" className="danger" onClick={() => { deleteTask(task.id); onClose(); }}>Delete task</button> : <span />}<div><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary">{task ? 'Save changes' : 'Create task'}</button></div></div>
      </form>
    </section>
  </div>;
}
