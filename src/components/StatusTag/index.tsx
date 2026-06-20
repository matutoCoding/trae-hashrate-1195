import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatusTagProps {
  text: string;
  color?: string;
  bgColor?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StatusTag: React.FC<StatusTagProps> = ({
  text,
  color = '#0FC6C2',
  bgColor,
  showDot = true,
  size = 'md',
}) => {
  const resolvedBg = bgColor || `${color}1A`;

  return (
    <View
      className={classnames(
        styles.statusTag,
        size === 'sm' && styles.sizeSm,
        size === 'lg' && styles.sizeLg
      )}
      style={{ background: resolvedBg, color }}
    >
      {showDot && <View className={styles.tagDot} style={{ background: color }} />}
      <Text>{text}</Text>
    </View>
  );
};

export default StatusTag;
