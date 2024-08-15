import React, { useCallback, useEffect, useState } from 'react'
import { useSocket } from '../context/SocketProvider'
import { useNavigate } from 'react-router-dom'

function Home() {
    const socket = useSocket()
    const [userDetails, setUserDetails] = useState({
        email: '',
        room: ''
    })
    const navigation=useNavigate()
    const handleUser = useCallback(() => {
        socket.emit("room:join", userDetails)
    }, [socket,userDetails])

    const handleJoinRoom=useCallback(({email,room})=>{
        console.log("hello");
        
        navigation(`/room/${room}`)
    },[])
    useEffect(()=>{
        socket.on("room:join",handleJoinRoom)
        return ()=>{
            socket.off("room:join",handleJoinRoom)
        }
    },[])
    return (
        <div className=' w-full h-screen flex items-center justify-center'>
            <div className=' flex flex-col gap-3 '>
                <input type="email" placeholder='Enter your email' className=' px-4 py-2 border border-black rounded-xl outline-none'
                    onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                    value={userDetails.email}
                />
                <input type="text" placeholder='Enter your roomId' className=' px-4 py-2 border border-black rounded-xl outline-none'
                    onChange={(e) => setUserDetails({ ...userDetails, room: e.target.value })}
                    value={userDetails.room}
                />
                <button className=' bg-gray-500 p-2 rounded-2xl text-white font-semibold hover:scale-105 duration-150' onClick={handleUser}>enter</button>
            </div>
        </div>
    )
}

export default Home