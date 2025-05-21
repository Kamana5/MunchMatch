"use client";

//new push 5/21/2025

import { api } from "~/trpc/react";
import { useState } from "react";
import { useEffect } from "react";
import { create } from "domain";
import { useRouter } from "next/navigation"
import { Router } from "next/router";



export default function NearbyPlaces() {

  const router = useRouter();
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;


  const vote = api.session.voteForPlace.useMutation()

  const [type,setType] = useState("restaurant");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [chosenPlace, setchosenPlace] = useState<any>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHost, setisHost] = useState(false);



  const { data, isLoading, error, refetch } = api.session.fetchNearbyPlaces.useQuery(
    { latitude: latitude || 0, longitude: longitude || 0, type },
    { enabled: false }
  )

  const { data: usersInSession, refetch: refetchUsers } = api.session.getUsersInSession.useQuery(
    { sessionCode: sessionCode || ""},
    {enabled: !!sessionCode}
  );

  
    const { data: sessionUserCount } = api.session.getSessionUserCount.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );
    const { data: sessionInfo } = api.session.getSessionInfo.useQuery(
    { sessionId: sessionId ?? "" },
    { enabled: !!sessionId, refetchInterval: 3000 } 
  );

  const { data: consensusData, refetch: refetchConsensus } = api.session.getConsensusVote.useQuery(
    {
      sessionId: sessionId || "",
    },
    {
      enabled: !!sessionId && !!sessionUserCount?.count,
      refetchInterval: 3000, 
    }
  );

  const winningPlaceId = consensusData?.winner;
  const winningPlace = data?.find((place:any) => place.place_id == winningPlaceId);
  const { mutate: updateSessionType } = api.session.updateSessionType.useMutation();

  const getLocationAndSearch = async () => {
    //if(!isHost) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async(position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
          setLatitude(latitude);
          setLongitude(longitude);
          await refetch();
      }, (error) => {
          console.error('Error getting location:', error);
      });
  } else {
      console.error('Geolocation is not supported by this browser.');
  }
  };
  
    console.log("lang",latitude)
    useEffect(() => {
      if (!isHost && sessionInfo?.type) {
        setType(sessionInfo.type);
      }
    }, [sessionInfo?.type]);

    useEffect(() => {
    if (!isHost && latitude === null && longitude === null) {
      getLocationAndSearch(); 
    }
  }, [isHost]);

    useEffect(() => {
    if (usersInSession && userId) {
      const hostId = usersInSession[0]?.id;
      setisHost(userId === hostId);
    }
  }, [usersInSession, userId])

  const currentPlace = data?.[currentIndex];
    useEffect(() => {
    const code = localStorage.getItem("sessionCode");
    const id = localStorage.getItem("userId");
    const newsessionId = localStorage.getItem("sessionId");

  
  if (!code || !id || !newsessionId) {
    router.push("/");
  } else {
    setSessionCode(code);
    setSessionId(newsessionId);}    
  }
   , []);


  const handleChoose = () => {

    if (!sessionCode || !currentPlace) return;

    vote.mutate({
      sessionId: sessionId!,
      userId: userId!,
      placeId: currentPlace.place_id,
      
    }, {
      onSuccess: () => {
        refetchConsensus();
        setchosenPlace(currentPlace);
        setMessage(`You have chosen ${currentPlace.name}`)
      }
    });
    if (currentIndex < data.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }

  };

  const handleSkip = () => {
     setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      refetch();
    }
  }, [latitude, longitude, type]);

  useEffect(() => {
    setCurrentIndex(0);
    setchosenPlace(null);
  }, [type, data]);

  //every 3 seconds it checks if sessionCode exists and calls refetchUsers() which triggers getUserInsession tRPC qurey again for the newest list of users in curent session
  useEffect(() => {
  const interval = setInterval(() => {
    if (sessionCode) refetchUsers();
  }, 3000); 
  return () => clearInterval(interval);
  }, [sessionCode]);


 return (
<div className="relative min-h-screen flex flex-col items-center justify-start py-12 px-4 text-white overflow-hidden">
  
  <video
    autoPlay
    muted
    loop
    playsInline
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
  >
    <source src="/backround.mp4" type="video/mp4" />
  </video>
      <div className="relative z-10 container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="w-full max-w-3xl border-4 border-[#8B4513] rounded-2xl p-8 bg-black/60 shadow-xl">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] text-center"></h1>
      <div className="text-center mb-6">
        {sessionCode && (
          <p className="text-sm text-white-700 mb-2">
            Session Code: <span className="font-semibold">{sessionCode}</span>
          </p>
        )}
        <h1 className="text-3xl font-bold mb-4">Vote on a Place</h1>
      </div>
      {usersInSession && (
        isHost ? (
      <div className="mb-4 flex justify-center">
        <select
          value={type}
          onChange={(e) => {
            const newType = (e.target.value);
            setType(newType);
            if (isHost && sessionId) {
              updateSessionType({ sessionId, type: newType });
            }
          }}
          className="bg-white border border-gray-300 p-2 rounded text-black shadow-sm"
        >
          <option value="restaurant">Restaurant</option>
          <option value="cafe">Cafe</option>
          <option value="bar">Bar</option>
        </select>
      </div>
        ) : (
        <p className="text-gray-300 mb-4 text-center font-medium">
          Type selected by host: <span className="underline">{type}</span>
        </p>
        
        )
      )}

      {isHost &&
      <div className="flex justify-center mb-4">
        <button
          onClick={getLocationAndSearch}
          className="bg-[#FA8072] hover:bg-[#e96c61] text-white font-semibold px-4 py-2 rounded-md shadow"
        >
          Let's Go
        </button>
      </div>
      }
      
      {message && (
        <div className="text-green-600 text-center mb-4 font-semibold">
          {message}
        </div>
      )}

      
      {error && <p className="text-red-500 text-center">Error: {error.message}</p>}
      {data && data.length === 0 && <p className="text-center">No nearby places found.</p>}
      
      {winningPlaceId ? (
        <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-4 rounded shadow-md text-center w-full max-w-md mx-auto">
          <p className="font-semibold mb-2">
            Everyone has chosen to go to <span className="font-bold">{winningPlace?.name}</span>!
          </p>
        </div>
      ) : currentPlace ? (
        <div className="bg-white/90 backdrop-blur-sm border border-gray-300 rounded-2xl shadow-2xl p-8 w-full max-w-md text-black text-center mx-auto transition-all">
          <h2 className="text-2xl font-bold mb-4">{currentPlace?.name}</h2>
          <p className="text-gray-600 mb-2">{currentPlace?.vicinity}</p>
          <p className="text-gray-600 mb-4">{currentPlace?.rating} ⭐</p>

          <div className="flex justify-between mt-6">
            <button
              onClick={handleSkip}
              className="bg-red-500 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded shadow"
            >
              Skip
            </button>

            <button
              onClick={handleChoose}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded shadow"
            >
              Choose
            </button>
          </div>
        </div>
      ):null}

    {usersInSession && (
      <div className="bg-white text-black p-6 rounded-2xl shadow-lg mb-6 max-w-md mx-auto border border-gray-200 gap-4 mt-8">
        <h3 className="text-xl font-semibold text-center text-black-800 mb-4">
          People in this session:
        </h3>
        <ul className="space-y-2">
          {usersInSession.map((user) => (
        <li
          key={user.id}
          className="bg-[#FA8072] bg-opacity-20 border border-gray-300 px-4 py-2 rounded-lg shadow-sm flex items-center gap-2"
        >
          <span className="font-medium">{user.username}</span>
        </li>
      ))}

        </ul>
        </div>
    )}
  </div>
  </div>
  </div>
)};