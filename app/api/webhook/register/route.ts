import { Webhook } from "svix";
import {headers} from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request){
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    if(!WEBHOOK_SECRET){
        throw new Error("Please add webhook secret")
    }

    const headerPayLoad = await headers()
    const svix_id = headerPayLoad.get("svix-id")
    const svix_timestamp = headerPayLoad.get("svix-timestamp")
    const svix_signature = headerPayLoad.get("svix-signature")

    if(!svix_id || !svix_timestamp || !svix_signature){
        return new Response("Error Occured - No Svix headers")
    }

    

    const payload = await req.json()
    const body = JSON.stringify(payload)

    const wh = new Webhook(WEBHOOK_SECRET);
    

    let evt: WebhookEvent;

    const header : any = {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
    }
    
    try {
        evt = wh.verify(body, header) as WebhookEvent;

    } catch (error) {
        console.error("Error verifying the webhook")
        return new Response("Error Occured", {status: 400})
    }

    const {id} = evt.data
    const eventType = evt.type

    //logs

    if(eventType === "user.created"){
        console.log("-------------------User being created-------------------------------");
        
        try {
            const {email_addresses, primary_email_address_id} = evt.data
            const primaryEmail = email_addresses.find((email) => email.id === primary_email_address_id)
            if(!primaryEmail){
                return new Response("no primary email found", {status: 400})
            }

            // creating user
            const newUser = await prisma.user.create({
                data: {
                    id: evt.data.id!,
                    email: primaryEmail.email_address,
                    isSubscribed: false
                }
            })
            console.log("New User Created", newUser);
            
        } catch (error) {
            return new Response("Error creating user in database", {status: 400})
        }

        return new Response("Webhook recieved Successfully", {status: 200})
    }
}