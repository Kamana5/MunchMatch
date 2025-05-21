
"use client";

import { api } from "~/trpc/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function LandingPage() {
    const router = useRouter();
    const [joinCode, setjoinCode] = useState("");
    const [username, setUsername] = useState("");
    const [type, setType] = useState("restaurant"); // default value
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [showJoinInput, setshowjoinInput] = useState(false);
    const [isHost, setisHost] = useState(false);
    const { mutateAsync: createSession } = api.session.createSession.useMutation();

      useEffect(() => {
      if (isHost && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        });
      }
    }, [isHost]);

    const joinSession = api.session.joinSession.useMutation({
      onSuccess: (data) => {
        localStorage.setItem("sessionCode", data.code);
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("username", data.username);
        localStorage.setItem("sessionId", data.sessionId); 

        
        router.push("/NearbyPlaces");
      },
    });

    const handleCreate = async () => {
      if (username.trim() === "") {
        alert("Please enter your username.");
        return;
      }
      if (joinCode && username) {
      joinSession.mutate({ code: joinCode, username });
    } else {
      const session = await createSession({username, type, latitude, longitude,}); 
    
    localStorage.setItem("sessionCode", session.code);
    localStorage.setItem("sessionId", session.sessionId); 
    localStorage.setItem("userId", session.userId); 
    
    router.push("/NearbyPlaces");
    }
  };

  return (
    
    <main className="flex flex-col items-center justify-center gap-8">
      <h1 className="text-3xl font-bold">What would you like to do?</h1>

      <button
        onClick={()=> {
          setisHost(true);
          handleCreate();
        }}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Create Session
      </button>

      <button
        onClick={() => setshowjoinInput(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Join Session
      </button>
            <input
      type="text"
      placeholder="Enter your username"
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      className="border border-gray-300 p-2 rounded text-white"
    />


{showJoinInput && (
  <div className="mt-4 flex flex-col items-center gap-2">
    <input
      type="text"
      placeholder="Enter session code"
      value={joinCode}
      onChange={(e) => setjoinCode(e.target.value.toUpperCase())}
      className="border border-gray-300 p-2 rounded text-white"
    />
    <button
      onClick={() => {
        if (joinCode.length === 6 && username.trim() !== "") {
          joinSession.mutate({ code: joinCode, username });
        } else {
          alert("Please enter both a valid session code and a username.");
        }
      }}
      className="bg-blue-700 text-white px-4 py-2 rounded"
    >
      Join
    </button>
  </div>
  
  )}
  </main>

  );
}