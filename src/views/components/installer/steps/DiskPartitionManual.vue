<template>
  <div class="disk-partition">
    <div class="disk-partition-hr" />
    <div class="disk-partition-bar">
      <StepBar :step-num="2" />
    </div>
    <div class="disk-info-sub">
      {{ t('install.target_disk') }}: <span>{{ installInfo.disk }}</span>
    </div>
    <div class="disk-info-item">
      <PartitionGraph :data-list="installInfo?.partInfo || []" :width-px="736" :height-px="24" no-legend />
    </div>
    <div class="disk-part-table">
      <el-table :data="tData" size="small" height="100%">
        <el-table-column label="名称" property="tag" min-width="30%">
          <template #default="scope">
            <div
              class="disk-part-table-tag-color"
              :style="{backgroundColor: DISK_PART_PALETTE[scope.$index] || DISK_OTHERS_COLOR}"
            />
            <span class="disk-part-table-tag-text">{{ scope.row.tag }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文件系统" property="type" min-width="15%" />
        <el-table-column label="挂载点" property="loadPoint" min-width="25%" />
        <el-table-column label="大小" property="size" min-width="15%" />
        <el-table-column label="操作" min-width="15%">
          <template #default="{ row }">
            <el-button v-if="row.type" text type="primary" @click="editRow(row)">
              {{ t('common.edit') }}
            </el-button>
            <el-button v-if="row.type" text type="primary" @click="deleteRow(row)">
              {{ t('common.delete') }}
            </el-button>
            <el-button v-if="!row.type" text type="primary" @click="createRow(row)">
              {{ t('common.create') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onActivated, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import PartitionGraph from '@/views/components/installer/comp/PartitionGraph.vue'
import { INSTALL_INFO_KEY } from '@/utils/constant'
import { DISK_OTHERS_COLOR, DISK_PART_PALETTE } from '@/utils/constant'
import {formatSize} from "@/utils/utils";

const { t } = useI18n()

const emit = defineEmits(['prev'])

const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
async function checkValid() {
  // 待添加数据验证
  return true
}

const tData = computed(() => {
  const sorted = (installInfo.partInfo || []).toSorted((v1, v2) => {
    if (v1.size === v2.size) {
      return v1.tag > v2.tag ? 1 : -1
    }
    return v2.size - v1.size
  })
  return sorted.map(v => {
    return {
      ...v,
      size: formatSize(v.size, true)
    }
  })
})

onActivated(() => {
  // 进入此页若无磁盘信息则返回上一步
  if (!installInfo.partInfoBefore?.length) {
    emit('prev')
  }
})

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.disk-partition {
  width: 100%;
  height: 100%;
  padding: 56px 0 72px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-direction: column;

  &-hr {
    width: 100%;
    height: 1px;
    position: absolute;
    top: 56px;
    left: 0;
    background-color: #dfe5ef;
  }

  &-bar {
    width: calc(100% - 32px);
    margin: 24px 0;
  }
}

.disk-info {
  &-sub {
    width: calc(100% - 32px);
    line-height: 2;
    color: #4e5865;
    > span {
      color: #000;
    }
  }
  &-item {
    margin-top: 8px;
    display: flex;
  }
}

.disk-part-table {
  width: calc(100% - 32px);
  height: 280px;
  margin-top: 12px;
  border: 1px solid #eee;
}
.disk-part-table-tag-color {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  display: inline-block;
  vertical-align: top;
}
</style>
