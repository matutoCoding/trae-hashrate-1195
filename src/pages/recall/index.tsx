import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import { useAppStore } from '@/store';
import RecallCard from '@/components/RecallCard';
import { BatteryHealthLevel } from '@/types';
import {
  getHealthLevelColor,
  maskPhone,
} from '@/utils';
import styles from './index.module.scss';

const RecallPage: React.FC = () => {
  const {
    recalls,
    searchOwnersByBatchNo,
    searchFlowOwnersByBatchNo,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'records' | 'search'>('search');
  const [searchText, setSearchText] = useState('');
  const [activeResultTab, setActiveResultTab] = useState<'flow' | 'recall'>('flow');

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return { flow: [], recall: [], batchNo: '' };
    return {
      batchNo: searchText.trim(),
      flow: searchFlowOwnersByBatchNo(searchText.trim()),
      recall: searchOwnersByBatchNo(searchText.trim()),
    };
  }, [searchText, searchFlowOwnersByBatchNo, searchOwnersByBatchNo]);

  const handleSearch = () => {
    if (!searchText.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    const flowCount = searchResults.flow.length;
    const recallCount = searchResults.recall.length;
    if (flowCount === 0 && recallCount === 0) {
      Taro.showToast({ title: '未找到该批次的流向数据', icon: 'none' });
    } else {
      Taro.showToast({
        title: `装车${flowCount}台 · 召回${recallCount}人`,
        icon: 'none',
      });
    }
  };

  const handleQuickSearch = (batchNo: string) => {
    setSearchText(batchNo);
    setActiveTab('search');
    setActiveResultTab('flow');
  };

  const handleRecallClick = (id: string) => {
    Taro.navigateTo({ url: `/pages/recall-detail/index?id=${id}` });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.tabs}>
        <View
          className={classnames(styles.tabItem, activeTab === 'search' && styles.tabActive)}
          onClick={() => setActiveTab('search')}
        >
          🔍 批号反查
        </View>
        <View
          className={classnames(styles.tabItem, activeTab === 'records' && styles.tabActive)}
          onClick={() => setActiveTab('records')}
        >
          📋 召回记录
        </View>
      </View>

      {activeTab === 'search' && (
        <>
          <View className={styles.searchSection}>
            <Text className={styles.searchLabel}>输入电池批次号反查流向</Text>
            <View className={styles.searchInputWrap}>
              <Input
                className={classnames(styles.searchInput, styles.inputFocused)}
                placeholder="如：BA-NINGDE-20260615-A001"
                placeholderClass="ph"
                value={searchText}
                onInput={(e) => setSearchText(e.detail.value)}
                confirmType="search"
                onConfirm={handleSearch}
              />
              <View className={styles.searchBtn} onClick={handleSearch}>查询</View>
            </View>
            <Text className={styles.searchTips}>
              💡 提示：输入宁德或比亚迪的已有批次号，可反查已经装车的车主、车牌和对应电池编号。
              示例：BA-NINGDE-20260615-A001、BA-BYD-20260520-B002
            </Text>
          </View>

          {searchText.trim() && (
            <View className={styles.searchResult}>
              <View className={styles.resultTitle}>
                查询结果
                <Text className={styles.resultBadge}>
                  共{searchResults.flow.length + searchResults.recall.length}条
                </Text>
              </View>

              <View className={styles.subTabs}>
                <View
                  className={classnames(styles.subTab, activeResultTab === 'flow' && styles.subTabActive)}
                  onClick={() => setActiveResultTab('flow')}
                >
                  真实流向 ({searchResults.flow.length})
                </View>
                <View
                  className={classnames(styles.subTab, activeResultTab === 'recall' && styles.subTabActive)}
                  onClick={() => setActiveResultTab('recall')}
                >
                  召回名单 ({searchResults.recall.length})
                </View>
              </View>

              {activeResultTab === 'flow' && (
                <>
                  {searchResults.flow.length > 0 ? (
                    searchResults.flow.map(owner => (
                      <View className={styles.ownerItem} key={owner.id}>
                        <View className={styles.ownerAvatar}>
                          {owner.name.slice(0, 1)}
                        </View>
                        <View className={styles.ownerInfo}>
                          <Text className={styles.ownerName}>
                            {owner.name}
                            <Text className={styles.plateTag}>{owner.vehiclePlate}</Text>
                          </Text>
                          <Text className={styles.ownerPhone}>{maskPhone(owner.phone)}</Text>
                          <View className={styles.ownerMeta}>
                            <Text
                              className={styles.metaBadge}
                              style={{
                                color: getHealthLevelColor(owner.healthLevel as BatteryHealthLevel),
                                background: getHealthLevelColor(owner.healthLevel as BatteryHealthLevel) + '20',
                              }}
                            >
                              {owner.healthLevel}级 · {owner.capacity}Ah
                            </Text>
                            <Text className={styles.metaCode}>{owner.batteryCode}</Text>
                          </View>
                        </View>
                        <View className={styles.ownerStatus}>
                          <View
                            className={styles.statusIcon}
                            style={{ background: '#0FC6C2' }}
                          />
                          <Text className={styles.statusText}>{owner.statusLabel}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className={styles.emptyState}>
                      <Text className={styles.emptyIcon}>🚗</Text>
                      <Text className={styles.emptyText}>
                        该批次暂无装车记录，可能仍在库存中
                      </Text>
                    </View>
                  )}
                </>
              )}

              {activeResultTab === 'recall' && (
                <>
                  {searchResults.recall.length > 0 ? (
                    searchResults.recall.map(owner => (
                      <View className={styles.ownerItem} key={owner.id}>
                        <View className={styles.ownerAvatar}>
                          {owner.name.slice(0, 1)}
                        </View>
                        <View className={styles.ownerInfo}>
                          <Text className={styles.ownerName}>
                            {owner.name}
                            <Text className={styles.plateTag}>{owner.vehiclePlate}</Text>
                          </Text>
                          <Text className={styles.ownerPhone}>{maskPhone(owner.phone)}</Text>
                          <View className={styles.ownerMeta}>
                            <Text className={styles.metaBadge} style={{
                              color: owner.notified ? '#F53F3F' : '#4E5969',
                              background: owner.notified ? 'rgba(245, 63, 63, 0.1)' : '#F2F3F5',
                            }}>
                              {owner.notified ? '已通知' : '未通知'}
                            </Text>
                            <Text className={styles.metaBadge} style={{
                              color: owner.replaced ? '#00B42A' : '#F7BA1E',
                              background: owner.replaced ? 'rgba(0, 180, 42, 0.1)' : 'rgba(247, 186, 30, 0.1)',
                            }}>
                              {owner.replaced ? '已更换' : '待更换'}
                            </Text>
                          </View>
                        </View>
                        <View className={styles.ownerStatus}>
                          <View
                            className={styles.statusIcon}
                            style={{ background: owner.replaced ? '#00B42A' : '#F7BA1E' }}
                          />
                          <Text className={styles.statusText}>
                            {owner.replaced ? '处理完成' : '处理中'}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className={styles.emptyState}>
                      <Text className={styles.emptyIcon}>📋</Text>
                      <Text className={styles.emptyText}>该批次暂无召回记录</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </>
      )}

      {activeTab === 'records' && (
        <>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <View className={styles.titleBar} />
              召回记录
            </Text>
            <Text className={styles.sectionCount}>共{recalls.length}条</Text>
          </View>

          {recalls.map(recall => (
            <View key={recall.id} onClick={() => handleRecallClick(recall.id)}>
              <RecallCard recall={recall} />
            </View>
          ))}

          <View className={styles.searchSection} style={{ marginTop: 32 }}>
            <Text className={styles.searchLabel} style={{ color: '#0FC6C2' }}>
              快速查询以下批次的真实流向：
            </Text>
            <View className={styles.subTabs} style={{ flexWrap: 'wrap' }}>
              {['BA-NINGDE-20260615-A001', 'BA-NINGDE-20260610-A002', 'BA-BYD-20260520-B002'].map(bn => (
                <View
                  key={bn}
                  className={styles.subTab}
                  onClick={() => handleQuickSearch(bn)}
                >
                  {bn.slice(3)}
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <View
        className={styles.fabButton}
        onClick={() => Taro.showToast({ title: '新建召回流程开发中', icon: 'none' })}
      >
        + 启动召回
      </View>
    </ScrollView>
  );
};

export default RecallPage;
