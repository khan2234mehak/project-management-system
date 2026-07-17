import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/api';
import { pushRealtimeNotification } from '../features/notifications/notificationsSlice';

let socketSingleton = null;

/**
 * Establishes a single shared Socket.IO connection for the whole app once
 * the user is authenticated, and tears it down on logout. Also wires
 * the global `notification:new` event into the notifications slice + toast.
 */
export function useSocket() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) {
      if (socketSingleton) {
        socketSingleton.disconnect();
        socketSingleton = null;
      }
      return;
    }

    if (!socketSingleton) {
      socketSingleton = io(API_BASE_URL, {
        auth: { token: accessToken },
        transports: ['websocket', 'polling'],
      });
    }
    socketRef.current = socketSingleton;

    const handleNotification = (notification) => {
      dispatch(pushRealtimeNotification(notification));
      toast(notification.title, { icon: '🔔' });
    };

    socketSingleton.on('notification:new', handleNotification);

    return () => {
      socketSingleton?.off('notification:new', handleNotification);
    };
  }, [accessToken, dispatch]);

  return socketRef;
}

export function getSocket() {
  return socketSingleton;
}
