import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import RecallCard from '@/components/RecallCard';
import StatusTag from '@/components/StatusTag';
import { maskPhone } from '@/utils';
import styles from './index.module.scss';

const RecallPage: React.FC = () => {
  const { recalls, searchBatteriesByBatchNo, searchOwnersByBatchNo, batches } = useAppStore();
  const [activeTab, setActiveTab] = useState<'recall' | 'search'>('recall');
  const [searchText, setSearchText] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchedBatch, setSearchedBatch] = useState('');

  const filteredRecalls = useMemo(() => recalls, [recalls]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      Taro.showToast({ title: '请输入批号', icon: 'none' });
      return;
    }
    setSearched(true);
    setSearchedBatch(searchText.trim());
    console.log('[Recall] 执行批号反查:', searchText.trim());
  };

  const searchResults = useMemo(() => {
    if (!searched || !searchedBatch) return { batteries: [], owners: [] };
    return {
      batteries: searchBatteriesByBatchNo(searchedBatch),
      owners: searchOwnersByBatchNo(searchedBatch),
    };
  }, [searched, searchedBatch, searchBatteriesByBatchNo, searchOwnersByBatchNo]);

  const batchInfo = useMemo(() => {
    if (!searchedBatch) return null;
    return batches.find(b => b.batchNo.toLowerCase().includes(searchedBatch.toLowerCase()));
  }, [batches, searchedBatch]);

  const goRecallDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/recall-detail/index?id=${id}` });
  };

  const handleCreateRecall = () => {
    Taro.showActionSheet({
      itemList: ['按批号发起召回', '批量召回选择', '导入问题批次'],
      success: (res) => {
        const tips = ['请输入问题批号', '请选择需召回批次', '功能开发中'];
        Taro.showToast({ title: tips[res.tapIndex], icon: 'none' });
      },
    });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'recall' && styles.tabActive)}
          onClick={() => setActiveTab('recall')}
        >
          召回记录
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'search' && styles.tabActive)}
          onClick={() => setActiveTab('search')}
        >
          批号反查
        </View>
      </View>

      {activeTab === 'search' && (
        <View className={styles.searchSection}>
          <Text className={styles.searchLabel}>输入批号反查车主</Text>
          <View className={styles.searchInputWrap}>
            <Input
              className={classnames(styles.searchInput, styles.inputFocused)}
              placeholder="如：BA-BYD-20240510-C5M7"
              placeholderClass="ph"
              value={searchText}
              onInput={(e) => setSearchText(e.detail.value)}
              confirmType="search"
              onConfirm={handleSearch}
            />
            <View className={styles.searchBtn} onClick={handleSearch}>反查</View>
          </View>
          <Text className={styles.searchTips}>
            💡 输入完整或部分批号，可一键查询该批次所有电池的流向记录及当前安装车辆的车主信息
          </Text>

          {searched && (
            <View className={styles.searchResult}>
              {batchInfo ? (
                <>
                  <Text className={styles.resultTitle}>
                    查询命中: {batchInfo.batchNo.slice(0, 20)}...
                    <Text className={styles.resultBadge}>
                      {searchResults.owners.length}位车主
                    </Text>
                  </Text>

                  {searchResults.owners.length > 0 ? (
                    searchResults.owners.map(owner => (
                      <View key={owner.id} className={styles.ownerItem}>
                        <View className={styles.ownerAvatar}>
                          {owner.name.charAt(0)}
                        </View>
                        <View className={styles.ownerInfo}>
                          <View className={styles.ownerName}>
                            {owner.name}
                            <Text className={styles.plateTag}>{owner.vehiclePlate}</Text>
                          </View>
                          <Text className={styles.ownerPhone}>
                            {maskPhone(owner.phone)} | 电池: {owner.batteryCode}
                          </Text>
                        </View>
                        <View className={styles.ownerStatus}>
                          <View>
                            <StatusTag
                              text={owner.replaced ? '已换' : '待换'}
                              color={owner.replaced ? '#00B42A' : owner.notified ? '#FF7D00' : '#86909C'}
                              size="sm"
                              showDot={false}
                            />
                          </View>
                          <Text className={styles.statusText}>
                            {owner.contacted ? '已联系' : '未联系'}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : searchResults.batteries.length > 0 ? (
                    <View className={styles.emptyState}>
                      <Text className={styles.emptyIcon}>🚗</Text>
                      <Text className={styles.emptyText}>
                        该批次共{searchResults.batteries.length}块电池
                        {'\n'}未登记到受影响车主
                      </Text>
                    </View>
                  ) : (
                    <View className={styles.emptyState}>
                      <Text className={styles.emptyIcon}>🔋</Text>
                      <Text className={styles.emptyText}>该批次无匹配电池数据</Text>
                    </View>
                  )}
                </>
              ) : (
                <View className={styles.emptyState}>
                  <Text className={styles.emptyIcon}>❓</Text>
                  <Text className={styles.emptyText}>
                    未找到匹配的批号
                    {'\n'}请检查输入是否正确
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <View className={styles.sectionHeader}>
        <Text className={styles.sectionTitle}>
          <View className={styles.titleBar} />
          {activeTab === 'recall' ? '召回任务' : '历史召回'}
        </Text>
        <Text className={styles.sectionCount}>共{filteredRecalls.length}条</Text>
      </View>

      {filteredRecalls.length > 0 ? (
        filteredRecalls.map(recall => (
          <RecallCard
            key={recall.id}
            recall={recall}
            onClick={() => goRecallDetail(recall.id)}
          />
        ))
      ) : (
        <View className={styles.emptyState}>
          <Text className={styles.emptyIcon}>📋</Text>
          <Text className={styles.emptyText}>暂无召回记录</Text>
        </View>
      )}

      <View className={styles.fabButton} onClick={handleCreateRecall}>
        + 发起召回
      </View>
    </ScrollView>
  );
};

export default RecallPage;
