import React, { useCallback, useEffect, useState } from 'react';
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from 'react-player';
import peer from '../service/peer';

function Roome() {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [isFrontCamera, setIsFrontCamera] = useState(true); // State to track the current camera

  const handleUserJoin = useCallback(({ email, id }) => {
    console.log("email", email, id);
    setRemoteSocketId(id);
  }, [socket]);

  const getMediaStream = async (useFrontCamera = true) => {
    const constraints = {
      audio: true,
      video: {
        facingMode: useFrontCamera ? "user" : "environment", // Switch between front and rear cameras
      },
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  };

  const handleUserCall = useCallback(async () => {
    const stream = await getMediaStream(isFrontCamera);
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, isFrontCamera]);

  const switchCamera = useCallback(async () => {
    const newCameraSetting = !isFrontCamera;
    setIsFrontCamera(newCameraSetting);

    // Stop the current video track
    myStream.getVideoTracks().forEach(track => track.stop());

    // Get the stream from the new camera
    const newStream = await getMediaStream(newCameraSetting);
    setMyStream(newStream);

    // Add the new tracks to the peer connection
    for (const track of newStream.getTracks()) {
      peer.peer.addTrack(track, newStream);
    }
  }, [isFrontCamera, myStream]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const stream = await getMediaStream(isFrontCamera);
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket, isFrontCamera]
  );

  const sendStream = useCallback(() => {
    console.log(myStream);
    for (const track of myStream.getTracks()) {
      peer.peer.addTrack(track, myStream);
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans);
    sendStream();
  }, [sendStream]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [socket, remoteSocketId]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);

    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit("peer:nego:done", { to: from, ans });
  }, [socket]);

  const handleNegoNeedFinal = useCallback(async ({ from, ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const remoteStream = ev.streams;
      console.log('GOT TRACKS!');
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoin);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:done", handleNegoNeedFinal);
    return () => {
      socket.off("user:joined", handleUserJoin);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:done", handleNegoNeedFinal);
    };
  }, [socket, handleUserJoin, handleIncommingCall, handleCallAccepted, handleNegoNeedIncomming, handleNegoNeedFinal]);

  return (
    <div className='w-full'>
      <h1 className=' text-center font-bold text-5xl'>Room</h1>
      <h4 className=' text-center font-semibold text-xl'>{remoteSocketId ? "connected" : "no one in room"}</h4>
      {remoteSocketId && <div className=' w-full flex justify-center'>
        <button className=' my-3 w-[150px] bg-gray-500 p-2 rounded-2xl font-bold text-white mx-auto'
          onClick={handleUserCall}
        >Call</button>
      </div>}
      {myStream && <div className=' w-full flex justify-center'>
        <button className=' my-3 w-[150px] bg-gray-500 p-2 rounded-2xl font-bold text-white mx-auto'
          onClick={sendStream}
        >Send Stream</button>
      </div>}
      {myStream && <div className=' w-full flex justify-center'>
        <button className=' my-3 w-[150px] bg-blue-500 p-2 rounded-2xl font-bold text-white mx-auto'
          onClick={switchCamera}
        >Switch Camera</button>
      </div>}
      {myStream &&
        <div className=' flex flex-col justify-center items-center '>
          <h4>My Stream</h4>
          <ReactPlayer
            playing
            width={"200px"}
            height={"200px"}
            url={myStream}
          />
        </div>
      }
      {remoteStream &&
        <div className=' my-3 flex flex-col justify-center items-center '>
          <h4>Remote Stream</h4>
          <ReactPlayer
            playing
            width={"200px"}
            height={"200px"}
            url={remoteStream}
          />
        </div>
      }
    </div>
  );
}

export default Roome;
