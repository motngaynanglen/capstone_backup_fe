import React, { useRef, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

/**
 * Subscribe to Mainflow 2 design work realtime events (SignalR).
 * Calls onEvent when server pushes Mainflow2Event.
 */
export default function useMainflow2Realtime(designWorkId, onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!designWorkId) return undefined;

    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://103.90.227.51:8080/';
    const hubUrl = `${baseUrl.replace(/\/$/, '')}/hubs/mainflow-2-design`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    let active = true;

    connection
      .start()
      .then(() => {
        if (!active) return;
        return connection.invoke('JoinDesignWork', designWorkId);
      })
      .then(() => {
        if (!active) return;
        connection.on('Mainflow2Event', (payload) => {
          onEventRef.current?.(payload);
        });
      })
      .catch((err) => console.error('SignalR Error:', err));

    return () => {
      active = false;
      connection.invoke('LeaveDesignWork', designWorkId).catch(() => {});
      connection.stop();
    };
  }, [designWorkId]);
}
