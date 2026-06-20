import React, { useState, useMemo } from 'react';
import { View, Text, Input, ScrollView, Textarea } from '@tarojs/components';
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

const todayStr = () => new Date().toISOString().slice(0, 10);
const fiveYearsLater = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 5);
  return d.toISOString().slice(0, 10);
};

const BatchPage: React.FC = () => {
  const { batches, addBatch } = useAppStore();
  const [searchText, setSearchText] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [activeHealth, setActiveHealth] = useState<'all' | BatteryHealthLevel>('all');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    batchNo: '',
    supplier: '',
    manufactureDate: todayStr(),
    expireDate: fiveYearsLater(),
    inspector: '',
    healthLevel: 'A' as BatteryHealthLevel,
    totalQuantity: 50,
    remark: '',
  });

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

  const openModal = () => {
    const today = todayStr();
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    setForm({
      batchNo: '',
      supplier: '',
      manufactureDate: today,
      expireDate: d.toISOString().slice(0, 10),
      inspector: '',
      healthLevel: 'A',
      totalQuantity: 50,
      remark: '',
    });
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const validateAndSubmit = () => {
    if (!form.batchNo.trim()) {
      Taro.showToast({ title: '请输入批次号', icon: 'none' });
      return;
    }
    if (!form.supplier.trim()) {
      Taro.showToast({ title: '请输入供应商', icon: 'none' });
      return;
    }
    if (!form.inspector.trim()) {
      Taro.showToast({ title: '请输入验收人', icon: 'none' });
      return;
    }
    if (!form.totalQuantity || form.totalQuantity <= 0) {
      Taro.showToast({ title: '请输入正确的入库数量', icon: 'none' });
      return;
    }

    const newBatch = addBatch({
      batchNo: form.batchNo.trim(),
      supplier: form.supplier.trim(),
      manufactureDate: form.manufactureDate,
      expireDate: form.expireDate,
      inspector: form.inspector.trim(),
      healthLevel: form.healthLevel,
      totalQuantity: form.totalQuantity,
      remark: form.remark.trim() || undefined,
    });

    console.log('[Batch] 新增入库批次:', newBatch.batchNo);
    Taro.showToast({ title: '入库成功', icon: 'success' });
    setShowModal(false);

    setTimeout(() => {
      Taro.navigateTo({ url: `/pages/batch-detail/index?id=${newBatch.id}` });
    }, 600);
  };

  const onChange = (key: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
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

      <View className={styles.fabButton} onClick={openModal}>
        + 新增入库
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={closeModal}>
          <ScrollView
            scrollY
            className={styles.modalSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>电池到货验收入库</Text>
              <View className={styles.modalClose} onClick={closeModal}>×</View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>批次号
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="如：BA-NINGDE-20260620-X123"
                placeholderClass="ph"
                value={form.batchNo}
                onInput={(e) => onChange('batchNo', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>供应商
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="如：宁德时代新能源科技股份有限公司"
                placeholderClass="ph"
                value={form.supplier}
                onInput={(e) => onChange('supplier', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>验收人
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                placeholder="请输入验收人姓名"
                placeholderClass="ph"
                value={form.inspector}
                onInput={(e) => onChange('inspector', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>健康等级
              </Text>
              <View className={styles.healthOptions}>
                {(['A', 'B', 'C', 'D'] as BatteryHealthLevel[]).map(level => (
                  <View
                    key={level}
                    className={styles.healthOption}
                    style={{
                      borderColor: form.healthLevel === level ? getHealthLevelColor(level) : 'transparent',
                      color: getHealthLevelColor(level),
                    }}
                    onClick={() => onChange('healthLevel', level)}
                  >
                    <Text className={styles.optionLabel}>{level}级</Text>
                    <Text className={styles.optionDesc}>{getHealthLevelLabel(level).slice(2)}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>
                <Text className={styles.requiredDot}>*</Text>入库数量
              </Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                type="number"
                placeholder="请输入电池块数"
                placeholderClass="ph"
                value={String(form.totalQuantity)}
                onInput={(e) => onChange('totalQuantity', parseInt(e.detail.value) || 0)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>生产日期</Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                type="text"
                placeholder="YYYY-MM-DD"
                placeholderClass="ph"
                value={form.manufactureDate}
                onInput={(e) => onChange('manufactureDate', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>失效日期</Text>
              <Input
                className={classnames(styles.formInput, styles.formInputFocused)}
                type="text"
                placeholder="YYYY-MM-DD"
                placeholderClass="ph"
                value={form.expireDate}
                onInput={(e) => onChange('expireDate', e.detail.value)}
              />
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>备注说明</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="选填，如抽检情况、注意事项等"
                placeholderClass="ph"
                value={form.remark}
                onInput={(e) => onChange('remark', e.detail.value)}
              />
            </View>

            <View className={styles.formActions}>
              <View className={styles.btnCancel} onClick={closeModal}>取消</View>
              <View className={styles.btnSubmit} onClick={validateAndSubmit}>确认入库</View>
            </View>
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

export default BatchPage;
