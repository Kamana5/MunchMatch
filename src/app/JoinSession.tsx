import { api } from "~/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation"



export function JoinSession() {
    const [code, setCode] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [sessionId, setsessionId] = useState<string|null>(null);
    const [errorMessage, seterrorMessage] = useState<string>("");
    const router = useRouter();


    const { mutate } = api.session.joinSession.useMutation({
        onSuccess: (data) => {
            localStorage.setItem("sessionCode", data.code);
            localStorage.setItem("sessionId", data.sessionId);   
            localStorage.setItem("userId", data.userId);  
            localStorage.setItem("username", data.username);
            router.push("/NearbyPlaces");

        },
        onError: (error) => {
            seterrorMessage(error.message);
        },
    });

    const handleJoinSession = () => {
        if (code.length === 6) {
            mutate({code, username});
        } else {
            seterrorMessage("Please enter a valid code.")
        }
    };
    
    return (
        <div className = "text-center">
            <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="border p-2 rounded"
                placeholder = "Enter session code"
            />
            <button onClick={handleJoinSession} className ="bg-grey-500 text-white p-2 rounded mt-2">
                Join Session
            </button>

            {sessionId && (
                <div className="mt-4">
                    <p> You have succesfully joined the session with ID: <strong> {sessionId} </strong></p>
                </div>
            )}

            {errorMessage && (
                <div className = "text-red-600 mt-2">{errorMessage}</div>
            )}
        </div>
    );
    }