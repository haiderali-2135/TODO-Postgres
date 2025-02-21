'use client'

import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { ChevronLeft } from "lucide-react"



export function Backutton(){
    const router = useRouter()

    return(
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
      <ChevronLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
    )

}