import React, { useContext, useMemo } from 'react'
import {io} from "socket.io-client"
import myContext from './Mycontext'

export const useSocket=()=>{
    const {socket}= useContext(myContext)
    return socket
}
function SocketProvider({ children }) {
    const socket =useMemo(()=>io("/server"),[])

    return (
        <myContext.Provider value={{socket}}>
            {children}
        </myContext.Provider>
    )
}

export default SocketProvider