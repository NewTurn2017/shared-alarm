import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { initSocket } from '../utils/socket'
import Room from '../components/Room'

export default function Home() {
  const [socket, setSocket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  // Initialize socket connection
  useEffect(() => {
    const setupSocket = async () => {
      try {
        const socketInstance = await initSocket()
        setSocket(socketInstance)
        setLoading(false)

        // Set up error handling
        socketInstance.on('error', (errMsg) => {
          setError(errMsg)
          setTimeout(() => setError(''), 3000)
        })

        return () => {
          socketInstance.disconnect()
        }
      } catch (err) {
        console.error('Socket initialization failed:', err)
        setError('Failed to connect to server')
        setLoading(false)
      }
    }

    setupSocket()
  }, [])

  // Check for room ID in URL query
  useEffect(() => {
    if (router.isReady && router.query.room && socket) {
      joinRoom(router.query.room)
    }
  }, [router.isReady, router.query, socket])

  const createRoom = () => {
    if (!socket) return

    socket.emit('create-room')
    console.log('create-room 이벤트 발생')

    socket.once('room-created', (newRoomId) => {
      setRoomId(newRoomId)
      // Update URL without reloading the page
      router.push(`?room=${newRoomId}`, undefined, { shallow: true })
    })
  }

  const joinRoom = (id) => {
    if (!socket) return

    socket.emit('join-room', id)

    socket.once('room-joined', (data) => {
      setRoomId(data.roomId)
      // Update component state with room data
      // The Room component will handle the alarms
    })
  }

  const handleJoinRoom = (e) => {
    e.preventDefault()
    const id = e.target.roomId.value.trim()
    if (!id) return

    joinRoom(id)
  }

  return (
    <div className='container'>
      <Head>
        <title>Shared Alarm Timer</title>
        <meta
          name='description'
          content='Share alarm timers with up to 5 people'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='main'>
        {loading ? (
          <div className='loading'>Loading...</div>
        ) : roomId ? (
          <Room socket={socket} roomId={roomId} initialAlarms={[]} />
        ) : (
          <div className='welcome'>
            <h1>Shared Alarm Timer</h1>
            <p>
              Create or join a room to share alarm timers with up to 5 people
            </p>

            {error && <div className='error-message'>{error}</div>}

            <div className='actions'>
              <button className='create-room-btn' onClick={createRoom}>
                Create New Room
              </button>

              <div className='divider'>OR</div>

              <form className='join-form' onSubmit={handleJoinRoom}>
                <input
                  type='text'
                  name='roomId'
                  placeholder='Enter Room ID'
                  required
                />
                <button type='submit'>Join Room</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer className='footer'>
        <p>Shared Alarm Timer &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
