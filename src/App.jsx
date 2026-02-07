import Heading from "./components/Heading"
import TodoList from "./components/TodoList"
import { useState, useEffect, useMemo, useCallback } from "react"
import AddTodoForm from "./components/AddTodoForm"
import FilterButtons from "./components/FilterButtons"
import { loadTodosFromStorage, saveTodosToStorage } from "./utils/localstorage"
import { FILTER_ACTIVE, FILTER_ALL, FILTER_COMPLETED } from "./utils/constants"

const initialTodos = [
  { id: 1, text: 'Learn React', completed: false },
  { id: 2, text: 'Build Todo App', completed: true },
  { id: 3, text: 'Master Hooks', completed: false },
  { id: 4, text: 'Deploy App', completed: false },
]

function App() {
  const [todos, setTodos] = useState(()=>loadTodosFromStorage())
  const [filter, setFilter] = useState("all")


  useEffect(()=>{
    console.log("Save todos")
    saveTodosToStorage(todos)
  },[todos])

  const FilteredTodos = useMemo(function OnFilteredTodos(){
    switch (filter) {
      case FILTER_ALL:
         return todos
      case FILTER_ACTIVE:
        return todos.filter((todo)=>(
          todo.completed !== true)
        )
      case FILTER_COMPLETED:
        return todos.filter((todo)=>(
          todo.completed === true)
        )
      default:
        return todos
    }
  },[todos, filter])

  const onAddTodo = useCallback((text) => {
    setTodos(prevTodos => {
      const length = prevTodos.length
      return [...prevTodos, { id: length + 1, text: text, completed: false }]
    })
  }, [])

  const onDeleteTodo = useCallback(function onDeleteTodo(id) {
    setTodos(todos.filter((todo)=>(
      todo.id !== id)
    ))
  },[todos])

  const onToggleTodo = useCallback(function onToggleTodo(id) {
    const newTodos = todos.map(todo => 
      todo.id === id 
        ? { ...todo, completed: !todo.completed }
        : todo
    )
    setTodos(newTodos)
  },[todos])

  return(
    <div className="app-container">
      <Heading/>
      <AddTodoForm onAddTodo={onAddTodo}/>
      <FilterButtons setFilter={setFilter} currentFilter={filter} todos={todos} />
      <TodoList todos={FilteredTodos} onToggleTodo={onToggleTodo} onDeleteTodo={onDeleteTodo}/>
    </div>
  )
}

export default App
