'use client'


import { Pagination } from "@/components/Pagination"
import { TodoForm } from "@/components/TodoForm"
import { TodoItem } from "@/components/TodoItem"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useUser } from "@clerk/nextjs"
import { Todo } from "@prisma/client"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"
import React, { useCallback, useEffect, useState } from "react"
import { useDebounceValue } from "usehooks-ts"

function Dashboard(){
    const {user} = useUser()
    const [todos, setTodos] = useState<Todo[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(false)
    const [totalPages, setTotalPages] = useState(1)
    const [currentPage, setCurrentPage] = useState(1)
    const [isSubscribed, setIsSubscribed] = useState(false)
    
    const [debounceSearchTerm] = useDebounceValue(searchTerm, 300) //adding intentional delay in api calls. don't want to send a request on every key stroke

    const fetchTodos = useCallback(async (page: number) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/todos?page=${page}&search=${debounceSearchTerm}`) // after ? we give data (params in the url i.e. query terms) use & for multiple params
            if(!response.ok){
                throw new Error("Failed to fetch todos") // use toast to show on the screen 
            }
            const data = await response.json() //if use react query, will give you loading and will convert the response in json for you. Try that next time instead of fetch
            setTodos(data.todos)
            setTotalPages(data.totalPages)
            setCurrentPage(data.currentPage)
            setLoading(false)
        } catch (error: any) {
            setLoading(false)

        }
    }, [debounceSearchTerm]) // debounced term only gets updated after 3 mili seconds. so no function call on every stroke

    const fetchSubscriptionStatus = async () => {
        const response = await fetch("/api/subscription")

        if(!response.ok){
            throw new Error("Failed to fetch subscription status") // use toast to show on the screen 
        }
        const data = await response.json()
        setIsSubscribed(data.isSubscribed); // if subscribed then do some thing
    }

    const handleAddTodo = async(title: string) => {
        try {
           setLoading(true)
           const response = await fetch("/api/todos", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({title})
            })  // can use fetch for post as well 

            if(!response.ok){
                throw new Error("Failed to add Todo") // use toast to show on the screen 
            }

            await fetchTodos(currentPage)


        } catch (error: any) {
            setLoading(false)
        }
    }

    const updateTodo = async(id: string, completed: boolean) =>{
        const response = await fetch (`/api/todos/${id}`, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({completed})
        })
        if(!response.ok){
            throw new Error("Failed to update Todo") // use toast to show on the screen 
        }
        await fetchTodos(currentPage)
    }

    const handleDeletTodo = async(id: string) =>{
        const response = await fetch (`/api/todos/${id}`, {
            method: "DELETE"
        })
        if(!response.ok){
            throw new Error("Failed to deletes Todo") // use toast to show on the screen 
        }
        await fetchTodos(currentPage)
    }

    useEffect(()=> {  // using useEffect to run functions i want on page load automatically
        fetchTodos(1)
        fetchSubscriptionStatus()
    }, [fetchTodos])


    return(
        <div className="container mx-auto p-4 max-w-3xl mb-8">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Welcome, {user?.emailAddresses[0].emailAddress}!
        </h1>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Todo</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoForm onSubmit={(title) => handleAddTodo(title)} />
          </CardContent>
        </Card>
        {!isSubscribed && todos.length >= 3 && (
          <Alert variant="destructive" className="mb-8">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You&apos;ve reached the maximum number of free todos.{" "}
              <Link href="/subscribe" className="font-medium underline">
                Subscribe now
              </Link>{" "}
              to add more.
            </AlertDescription>
          </Alert>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Your Todos</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            {loading ? (
              <p className="text-center text-muted-foreground">
                Loading your todos...
              </p>
            ) : todos.length === 0 ? (
              <p className="text-center text-muted-foreground">
                You don&apos;t have any todos yet. Add one above!
              </p>
            ) : (
              <>
                <ul className="space-y-4">
                  {todos.map((todo: Todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onUpdate={updateTodo}
                      onDelete={handleDeletTodo}
                    />
                  ))}
                </ul>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => fetchTodos(page)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
}

export default Dashboard