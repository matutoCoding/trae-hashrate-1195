import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  iconText?: string;
  iconBg?: string;
  trendValue?: string;
  trendType?: 'up' | 'down';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  suffix,
  iconText,
  iconBg = 'rgba(15, 198, 194, 0.1)',
  trendValue,
  trendType,
  onClick,
}) => {
  return (
    <View className={styles.statCard} onClick={onClick}>
      <View className={styles.statHeader}>
        <Text className={styles.statLabel}>{label}</Text>
        {iconText && (
          <View className={styles.statIconWrap} style={{ background: iconBg }}>
            <Text style={{ color: iconBg.includes('0,180') ? '#00B42A' : iconBg.includes('245,63') ? '#F53F3F' : iconBg.includes('255,125') ? '#FF7D00' : '#0FC6C2' }}>
              {iconText}
            </Text>
          </View>
        )}
      </View>
      <Text className={styles.statValue}>{value}</Text>
      <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8rpx' }}>
        {suffix && <Text className={styles.statSuffix}>{suffix}</Text>}
        {trendValue && (
          <View className={classnames(styles.statTrend, trendType === 'up' ? styles.trendUp : styles.trendDown)}>
            {trendType === 'up' ? '↑' : '↓'} {trendValue}
          </View>
        )}
      </View>
    </View>
  );
};

export default StatCard;
