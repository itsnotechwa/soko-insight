import { Alert } from 'antd';
import { WifiOutlined } from '@ant-design/icons';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

export function OfflineIndicator() {
  const isOnline = useOfflineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Alert
      message="You are currently offline"
      description="Your changes will be saved locally and synced when you come back online."
      type="warning"
      icon={<WifiOutlined />}
      showIcon
      closable
      style={{
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderRadius: 0,
      }}
    />
  );
}

