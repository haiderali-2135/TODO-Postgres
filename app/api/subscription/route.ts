import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma";


export async function POST(){
    const { userId } = await auth()
    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }
    //capture payment and other details 

    try {
        //getting all of user data
        const user = await prisma.user.findUnique({where: {id: userId}}) // prisma will create a user query against this
        if(!user){
            return NextResponse.json({error: "user not found"}, {status: 401})
        }

        const subscriptionEnds = new Date()
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1)

        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                isSubscribed: true,
                subscriptionEnds: subscriptionEnds,
            }
        });

        return NextResponse.json({
            message: "Subscribed Successfulley",
            subscriptionEnds: updatedUser.subscriptionEnds
        })

    } catch (error) {
        console.error("Error updating subscription", error)
        return NextResponse.json({error: "internal server error"}, {status: 500})
    }
}

export async function GET(){
    const { userId } = await auth()
    if(!userId){
        return NextResponse.json({error: "Unauthorized"}, {status: 401})
    }

    try {
        const user = await prisma.user.findUnique(
            {
                where: {id: userId},
                select: {                 // select can be used to get only the fields required, rather than whole row 
                    isSubscribed: true,
                    subscriptionEnds: true
                }
            }
        ) // prisma will create a user query against this

        if(!user){
            return NextResponse.json({error: "user not found"}, {status: 401})
        }
        const now = new Date();

        if(user.subscriptionEnds && user.subscriptionEnds < now){
            await prisma.user.update({
                where: {id: userId},
                data: {
                    isSubscribed: false,
                    subscriptionEnds: null
                }
            });

            return NextResponse.json({
                isSubscrbed:false,
                subscriptionEnds: null
            })
        }

        return NextResponse.json({
            isSubscribed : user.isSubscribed,
            subscriptionEnds: user.subscriptionEnds
        })

    } catch (error: any) {
        
    }
}