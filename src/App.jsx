import React from 'react'
import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from './screen/Home'
import SocketProvider from './context/SocketProvider'
import Roome from './screen/Roome'
function App() {
  return (
    <div>
      <BrowserRouter>
        <SocketProvider>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/room/:roomId' element={<Roome/>}/>
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </div>
  )
}

export default App