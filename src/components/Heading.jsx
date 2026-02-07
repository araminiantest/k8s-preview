import { memo } from "react"
import './Heading.css'

function Heading() {
    return (
        <div className="heading">
            <h1>Todo List</h1>
        </div>
    )
}

export default memo(Heading);