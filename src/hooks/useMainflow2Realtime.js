import { useRef, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

/**
 * Subscribe to design-work chat realtime events (SignalR).
 *
 * Khớp đúng với BE (DesignWorkChatHub):
 *  - Route hub : /hubs/design-work-chat
 *  - Join group: JoinDesignWork(designWorkId) → group "design-work-{id:N}"
 *  - Event     : "ReceiveDesignLog" (REST createChatLog cũng broadcast event này
 *                qua IHubContext, nên gửi tin bằng REST vẫn realtime).
 *
 * onEvent được gọi mỗi khi server đẩy một DesignLog mới (cả 2 trang staff/khách
 * dùng để refetch nội dung).
 */
export default function useMainflow2Realtime(designWorkId, onEvent) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!designWorkId) return undefined;

    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api-stable.3dprintshop.store/';
    const hubUrl = `${baseUrl.replace(/\/$/, '')}/hubs/design-work-chat`;

    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    let active = true;

    // Đăng ký handler TRƯỚC khi start để không bỏ lỡ sự kiện đến sớm.
    connection.on('ReceiveDesignLog', (payload) => {
      onEventRef.current?.(payload);
    });

    // Sau khi tự reconnect, ConnectionId đổi → group cũ mất → phải join lại.
    connection.onreconnected(() => {
      connection.invoke('JoinDesignWork', designWorkId).catch(() => {});
    });

    connection
      .start()
      .then(() => {
        if (!active) return undefined;
        return connection.invoke('JoinDesignWork', designWorkId);
      })
      .catch((err) => console.error('SignalR Error:', err));

    return () => {
      active = false;
      connection.off('ReceiveDesignLog');
      connection.invoke('LeaveDesignWork', designWorkId).catch(() => {});
      connection.stop();
    };
  }, [designWorkId]);
}
