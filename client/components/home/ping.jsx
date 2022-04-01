import { useState, useEffect, useRef, useContext } from 'react';
import { Button } from '../common/button';
import { io } from 'socket.io-client';
import { AuthContext } from '../../utils/auth_context';

export const Ping = () => {
  const [pings, setPings] = useState([]);
  const [key, setKey] = useState('defaultkey');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [authToken] = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    // instantiates a socket object and initiates the connection...
    // you probably want to make sure you are only doing this in one component at a time.
    const socket = io({
      auth: { token: authToken },
      query: { message: 'I am the query ' },
    });

    // adds an event listener to the connection event
    socket.on('connect', () => {
      setSocket(socket);
    });

    // adds event listener to the disconnection event
    socket.on('disconnect', () => {
      console.log('Disconnected');
    });

    // recieved a pong event from the server
    socket.on('pong', (data) => {
      console.log('Recieved pong', data);
    });

    // recieved a message event from the server
    socket.on('message', (data) => {
      console.log('Recieved message', data);
      console.log(data.message.payload.message);
      var messagesDiv = document.getElementById('Messages');
      const p = document.createElement('p');
      p.innerHTML = 'User: ' + data.message.userId + ' says "' + data.message.payload.message + '"';
      p.className = "p-1 m-1 bg-gray-300"
      messagesDiv.appendChild(p);
    });

    // IMPORTANT! Unregister from all events when the component unmounts and disconnect.
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('pong');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // if our token changes we need to tell the socket also
    if (socket) {
      // this is a little weird because we are modifying this object in memory
      // i dunno a better way to do this though...
      socket.auth.token = authToken;
    }
  }, [authToken]);

  if (!socket) return 'Loading...';

  const sendPing = () => {
    // sends a ping to the server to be broadcast to everybody in the room
    currentRoom && socket.emit('ping', { currentRoom });
  };

  const sendMessage = () => {
    // sends a ping to the server to be broadcast to everybody in the room
    currentRoom && socket.emit('message', { currentRoom, message });
  };

  const joinRoom = () => {
    // tells the server to remove the current client from the current room and add them to the new room
    socket.emit('join-room', { currentRoom, newRoom: key }, (response) => {
      console.log(response);
      setCurrentRoom(response.room);
    });
  };

  return (
    <>
      <div className="p-3">
        <header>Ping: {currentRoom || '(No room joined)'}</header>
        <section>
          <input
            type="text"
            className="border-2 border-gray-700 p-4 m-4 rounded"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <br></br>
          <Button onClick={joinRoom}>Connect To Room</Button>
          <Button onClick={sendPing}>Send Ping</Button>
        </section>
      </div>
      <div className="text-center m-12">
        <section>
          <input
            type="text"
            className="border-2 border-gray-700 p-2 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={sendMessage}>Send Message</Button>
        </section>
        <p className="text-4xl">Messages</p>
        <div id="Messages" className="border-8 overflow-scroll h-1/3 text-left">
        </div>
      </div>
    </>
  );
};
