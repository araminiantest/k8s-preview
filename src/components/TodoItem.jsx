import './TodoItem.css'
import { memo } from "react"
function TodoItem({ todo, onToggleTodo, onDeleteTodo }) {
    const handleToggle = () => {
      onToggleTodo(todo.id)
    }
    const handleDelte = () => {
        onDeleteTodo(todo.id)
    }
  
    return (
      <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
        <input 
          type="checkbox" 
          checked={todo.completed} 
          onChange={handleToggle}
        />
        <span onClick={handleToggle} style={{ cursor: 'pointer', flex: 1 }}>
          {todo.text}
        </span>
        <button className='delete-todo' onClick={handleDelte}>
            🗑️
        </button>
      </li>
    )
  }
  
export default memo(TodoItem)