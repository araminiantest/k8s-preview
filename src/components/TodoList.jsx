import TodoItem from "./TodoItem";
import './TodoList.css'
function TodoList({ todos, onToggleTodo, onDeleteTodo }) {
    return (
        <div className="TodoList">
            <ul className="todo-list">
                {
                    todos.map((todo) => (
                        <TodoItem  key={todo.id} todo={todo} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo} />
                    ))
                }
            </ul>
        </div>

    )
}

export default TodoList