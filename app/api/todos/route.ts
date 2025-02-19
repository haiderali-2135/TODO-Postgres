import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma";

const ITEMS_PER_PAGE = 10;


export async function GET(req: NextRequest){
    const { userId } = await auth()
    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }


    const {searchParams} = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""

    try {
        const todos = await prisma.todo.findMany({
            where: {
                id: userId,
                title: {
                    contains: search,
                    mode: "insensitive"
                }
            },
            orderBy: {
                createdAt: "desc"
            },
                take: ITEMS_PER_PAGE,
                skip: (page -1) * ITEMS_PER_PAGE
            
        })

        const totalitems = await prisma.todo.count({
            where: {
                id: userId,
                title: {
                    contains: search,
                    mode: "insensitive"
                }
            }
        })

        const totlaPages = Math.ceil(totalitems/ITEMS_PER_PAGE)

        return NextResponse.json({
            todos,
            currentPage: page,
            totlaPages,
            totalitems
        })
    } catch (error) {
        console.error("Error retrieving todos", error)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }
}

export async function POST(req: NextRequest){
    const { userId } = await auth()
    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    const user = await prisma.user.findUnique(
        {
            where: {id: userId},
            include: {todos: true} // {include} includes the todos for the user from the todos table
        }
    )

    console.log(user);

    if(!user){
        return NextResponse.json({error: "user not found"}, {status: 404})
    }

    if(!user.isSubscribed && user.todos.length >= 3){
        return NextResponse.json({
            error: "Todo limit reached. Please suscribe to add more"
        }, {status: 403})
    }


    const {title} = await req.json()

    const newTodo = prisma.todo.create({
        data: {title, userID: userId}
    })
    
}