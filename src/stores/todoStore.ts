import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, Todo } from '@/api/db'
import dayjs from 'dayjs'

export const useTodoStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const loaded = ref(false)

  async function loadTodos() {
    if (loaded.value) return
    todos.value = await db.todos.orderBy('createdAt').reverse().toArray()
    loaded.value = true
  }

  async function addTodo(content: string, type: Todo['type'], priority: Todo['priority'], dueDate: string) {
    const todo: Todo = {
      content,
      type,
      priority,
      dueDate,
      done: false,
      createdAt: dayjs().toISOString(),
    }
    const id = await db.todos.add(todo)
    todos.value.unshift({ ...todo, id })
  }

  async function toggleTodo(id: number) {
    const t = todos.value.find(t => t.id === id)
    if (!t) return
    t.done = !t.done
    t.doneAt = t.done ? dayjs().toISOString() : undefined
    await db.todos.update(id, { done: t.done, doneAt: t.doneAt })
  }

  async function deleteTodo(id: number) {
    await db.todos.delete(id)
    todos.value = todos.value.filter(t => t.id !== id)
  }

  async function cleanupOldTodos() {
    const cutoff = dayjs().subtract(365, 'day').toISOString()
    const old = await db.todos
      .where('done').equals(true)
      .and(t => t.doneAt !== undefined && t.doneAt < cutoff)
      .toArray()
    if (old.length) {
      await db.todos.bulkDelete(old.map(t => t.id!))
      todos.value = todos.value.filter(t => !old.some(o => o.id === t.id))
    }
  }

  return { todos, loaded, loadTodos, addTodo, toggleTodo, deleteTodo, cleanupOldTodos }
})
