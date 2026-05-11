import { createId } from './id'
import {
  STATUS_OPTIONS,
  TODO_PRIORITIES,
  DEFAULT_CHECKIN,
  DEFAULT_CHECKOUT,
} from '../constants'

export const createEntry = () => ({
  id: createId(),
  startTime: '',
  endTime: '',
  project: '',
  task: '',
  status: STATUS_OPTIONS[0],
  notes: '',
})

export const createTodo = () => ({
  id: createId(),
  task: '',
  completed: false,
  priority: TODO_PRIORITIES[1],
  dueDate: '',
  notes: '',
})

export const createDay = (id, withEntry = false) => ({
  id,
  label: id,
  entries: withEntry ? [createEntry()] : [],
  checkIn: DEFAULT_CHECKIN,
  checkOut: DEFAULT_CHECKOUT,
  todos: [],
})
