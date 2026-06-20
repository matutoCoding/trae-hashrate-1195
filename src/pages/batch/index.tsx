import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import BatchCard from '@/components/BatchCard';
import { BatteryHealthLevel, BatchStatus } from '@/types';
import {
  getHealthLevelColor,
  getHealthLevelLabel,
} from '@/utils';
import styles from './index.module.scss';

const statusFilters = [
  { key: 'all', label: '全部批次' },
  { key: 'in_stock', label: '在库' },
  { key: 'in_use', label: '使用中' },
  { key: 'recalled', label: '召回' },
  { key: 'expired', label: '已过期' },
];

const healthFilters: Array<{ key: 'all' | BatteryHealthLevel; label: string; desc: string }> = [
  { key: 'all', label: '全部', desc: '等级' },
  { key: 'A', label: 'A级', desc: '优秀' },
  { key: 'B', label: 'B级', desc: '良好' },
  { key: 'C', label: 'C级', desc: '一般' },
  { key: 'D', label: 'D级', desc: '较差' },
];

const BatchPage: React.FC = () => {
  const { batches } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activeHealth, setActiveHealth] = useState<'all' | BatteryHealthLevel>('all');

  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      const matchSearch = !searchText
        || batch.batchNo.toLowerCase().includes(searchText.toLowerCase())
        || batch.supplier.includes(searchText);
      const matchStatus = activeStatus === 'all' || batch.status === activeStatus;
      const matchHealth = activeHealth === 'all' || batch.healthLevel === activeHealth;
      return matchSearch && matchStatus && matchHealth;
    });
  }, [batches, searchText, activeStatus, activeHealth]);

  const handleBatchClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/batch-detail/index?id=${id}` });
  };

  const handleFab = () => {
    Taro.showModal({
      title: '新增入库',
      content: '是否录入新批次电池？',
      confirmColor: '#0FC6C2',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '入库功能开发中', icon: 'none' });
        }
      },
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.searchBar}>
        <Text className={styles.searchIcon}>🔍</Text>
        <Input
          className={styles.searchInput}
          placeholder="搜索批号 / 供应商"
          placeholderClass="ph"
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
        />
      </View>

      <ScrollView scrollX className={styles.filterTabs}>
        {statusFilters.map(f => (
          <View
            key={f.key}
            className={classnames(styles.filterTab, activeStatus === f.key && styles.tabActive)}
            onClick={() => setActiveStatus(f.key)}
          >
            {f.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.healthFilter}>
        {healthFilters.map(f => (
          <View
            key={f.key}
            className={classnames(
              styles.healthChip,
              activeHealth === f.key && styles.chipActive
            )}
            style={{
              color: f.key === 'all' ? '#4E5969' : getHealthLevelColor(f.key as BatteryHealthLevel),
              borderColor: activeHealth === f.key ? (f.key === 'all' ? '#4E5969' : getHealthLevelColor(f.key as BatteryHealthLevel)) : 'transparent',
            }}
            onClick={() => setActiveHealth(f.key)}
          >
            <Text className={styles.chipLabel}>{f.label}</Text>
            <Text className={styles.chipDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.listHeader}>
        <Text className={styles.listTitle}>
          <View className={styles.titleBar} />
          批次列表
        </Text>
        <Text className={styles.countBadge}>共{filteredBatches.length}个批次</Text>
      </View>

      {filteredBatches.length > 0 ? (
        filteredBatches.map(batch => (
          <BatchCard
            key={batch.id}
            batch={batch}
            onClick={() => handleBatchClick(batch.id)}
          />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📦</Text>
          <Text className={styles.emptyText}>暂无匹配的批次数据</Text>
        </View>
      )}

      <View className={styles.fabButton} onClick={handleFab}>+</View>
    </ScrollView>
  );
};

export default BatchPage;
