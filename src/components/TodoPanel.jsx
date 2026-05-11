import TodoCard from './TodoCard'

function TodoPanel({ activeDay, onUpdateTodo, onDeleteTodo, onAddTodo, readOnly }) {
  return (
    <>
      <div className="todo-list" role="region" aria-live="polite">
        {activeDay?.todos.length ? (
          activeDay.todos.map((todo, index) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              index={index}
              onUpdate={onUpdateTodo}
              onDelete={onDeleteTodo}
              readOnly={readOnly}
            />
          ))
        ) : (
          <div className="empty-state">
            No todo items yet. Add your first task below.
          </div>
        )}
      </div>
      <div className="table-actions">
        <button
          className="button add-entry"
          type="button"
          onClick={onAddTodo}
          disabled={readOnly}
        >
          Add task
        </button>
        <p className="hint">
          Track tasks with a completion toggle, priority, and due date.
        </p>
      </div>
    </>
  )
}

export default TodoPanel
