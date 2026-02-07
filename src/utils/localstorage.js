import { STORAGE_KEY } from "./constants"
export function saveTodosToStorage(todos) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch (error) {
        console.error(`Can't store todos : ${error.name}`)
    }
}

export function loadTodosFromStorage() {
    try {
        const todos = localStorage.getItem(STORAGE_KEY)
        if (todos === null || todos === "") {
            console.log("No Todos")
            return []
        }
        const todosArray = JSON.parse(todos)
        return todosArray
    } catch (error) {
        console.error(`Couldn't load todos from local storage : ${error.name}`)
        return []
    }
}
