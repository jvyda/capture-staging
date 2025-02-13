import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { getCurrentUser } from "aws-amplify/auth/server";
import outputs from "@/amplify_outputs.json";
import { cookies } from 'next/headers'

export const { runWithAmplifyServerContext } = createServerRunner ({
    config: outputs,
})

export async function GetAuthCurrentUserServer(){
    try{
        const currentUser = await runWithAmplifyServerContext({
            nextServerContext: {cookies},
            operation: (context)=>getCurrentUser(context)
        })
        return currentUser
    }catch(err){
     console.log(err)   
    }
}

export function formatSeconds(seconds: number) {
    // Ensure the input is a valid number
    if (typeof seconds !== 'number' || isNaN(seconds)) {
      return '00:00';
    }
  
    // Convert seconds to minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
  
    // Pad minutes and seconds with leading zeros if necessary
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
    // Return the formatted time as MM:SS
    return `${formattedMinutes}:${formattedSeconds}`;
  }