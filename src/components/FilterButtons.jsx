import "./FilterButtons.css"
import { memo } from "react"
import { FILTER_ACTIVE, FILTER_ALL, FILTER_COMPLETED } from "../utils/constants"

function FilterButtons({setFilter, currentFilter, todos}) {
    const allCount = todos.length
    const activeCount = todos.filter(todo => !todo.completed).length
    const completedCount = todos.filter(todo => todo.completed).length
    return (
    <div className="filter-buttons">
        <button onClick={()=>setFilter(FILTER_ALL)} className={`filter-button ${currentFilter === FILTER_ALL ? 'active' : ''}`} >All ({allCount})</button>
        <button onClick={()=>setFilter(FILTER_ACTIVE)} className={`filter-button ${currentFilter === FILTER_ACTIVE ? 'active' : ''}`}>Active ({activeCount})</button>
        <button onClick={()=>setFilter(FILTER_COMPLETED)} className={`filter-button ${currentFilter === FILTER_COMPLETED ? 'active' : ''}`}>Completed ({completedCount})</button>
    </div>
    )
}

export default memo(FilterButtons)