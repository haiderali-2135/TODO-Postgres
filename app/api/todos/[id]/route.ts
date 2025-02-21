import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma";



export async function DELETE(req: NextRequest, context: any){ // access to a request and will be having a parameter access, [tyep id cause [id] is the name of the folder]
    const {userId} = await auth()

    if(!userId){
        return NextResponse.json({erro: "Unauthorized"}, {status: 401})
    }

    try {
        const todoId = context.params.id

        const todo = await prisma.todo.findUnique({
            where: {id: todoId}
        })

        if(!todo){
            return NextResponse.json({erro: "todo not found"}, {status: 401})
        }
        if(todo.userID !== userId){
            return NextResponse.json({error: "Forbidden"}, {status: 403})
        }
    
        await prisma.todo.delete({
            where: {id: todoId}
        })

        return NextResponse.json({message: "todo deleted successfully"}, {status: 200})

    } catch (error) {
        console.error("Error Deleting the todo", error)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }

}

export async function PUT(
    req: NextRequest,
    context: any
  ) {
    const { userId } = await auth();
  
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    try {
      const { completed } = await req.json();
      const todoId = context.params.id;
  
      const todo = await prisma.todo.findUnique({
        where: { id: todoId },
      });
  
      if (!todo) {
        return NextResponse.json({ error: "Todo not found" }, { status: 404 });
      }
  
      if (todo.userID !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
  
      const updatedTodo = await prisma.todo.update({
        where: { id: todoId },
        data: { completed },
      });
  
      return NextResponse.json(updatedTodo);
    } catch (error) {
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }