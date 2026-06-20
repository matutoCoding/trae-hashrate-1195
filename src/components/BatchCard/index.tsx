import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import { BatteryBatch } from '@/types';
import {
  getBatchStatusLabel,
  getBatchStatusColor,
  getHealthLevelColor,
  getHealthLevelLabel,
  formatDate,
} from '@/utils';

interface BatchCardProps {
  batch: BatteryBatch;
  onClick?: () => void;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch, onClick }) => {
  const healthColor = getHealthLevelColor(batch.healthLevel);
  const statusColor = getBatchStatusColor(batch.status);

  return (
    <View className={styles.batchCard} onClick={onClick}>
      <View className={styles.cardHeader}>
        <View className={styles.headerLeft}>
          <Text className={styles.batchNo}>{batch.batchNo}</Text>
          <Text className={styles.supplier}>{batch.supplier}</Text>
        </View>
        <StatusTag
          text={getBatchStatusLabel(batch.status)}
          color={statusColor}
          size="sm"
        />
      </View>

      <View className={styles.cardContent}>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.statNumPrimary)}>
            {batch.availableQuantity}
          </Text>
          <Text className={styles.statLabel}>在库可用</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.statNumSuccess)}>
            {batch.inUseQuantity}
          </Text>
          <Text className={styles.statLabel}>使用中</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={classnames(styles.statNum, styles.statNumError)}>
            {batch.recalledQuantity}
          </Text>
          <Text className={styles.statLabel}>已召回</Text>
        </View>
      </View>

      <View className={styles.healthBar}>
        <StatusTag
          text={getHealthLevelLabel(batch.healthLevel)}
          color={healthColor}
          size="sm"
          showDot={false}
        />
        <View className={styles.barTrack}>
          <View
            className={styles.barFill}
            style={{
              width: `${(batch.inUseQuantity / batch.totalQuantity) * 100}%`,
              background: `linear-gradient(90deg, ${healthColor}, ${healthColor}99)`,
            }}
          />
        </View>
        <Text style={{ fontSize: 20, color: '#86909C' }}>
          {Math.round((batch.inUseQuantity / batch.totalQuantity) * 100)}%
        </Text>
      </View>

      <View className={styles.cardFooter}>
        <View className={styles.footerInfo}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>生产:</Text>
            <Text>{formatDate(batch.manufactureDate)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>到期:</Text>
            <Text>{formatDate(batch.expireDate)}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>总数:</Text>
            <Text>{batch.totalQuantity}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BatchCard;
