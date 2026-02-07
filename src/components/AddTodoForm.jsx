import './AddTodoForm.css'
import { useState } from "react"
function AddTodoForm({ onAddTodo }) {
    const [inputText, setInputText] = useState('')

    function handleSubmit(e) {
        e.preventDefault()
        if (inputText.trim() !== '') {
            onAddTodo(inputText)
            setInputText('')
        }
    }
    function handleChange(e) {
        setInputText(e.target.value)
    }
    return (
        <div className="AddTodoForm">
            <form onSubmit={handleSubmit}>
                <input type="text" className="add-text" placeholder="Add a new todo" value={inputText} onChange={handleChange} />
                <button type="submit" className="add-button">Add</button>
            </form>
        </div>
    )
}

export default AddTodoForm