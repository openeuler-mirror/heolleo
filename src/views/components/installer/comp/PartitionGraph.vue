<template>
  <div class="p-graph" :style="{width: `${props.widthPx || 628}px`}">
    <div class="p-graph-bar" :style="{height: `${props.heightPx || 16}px`}">
      <div
        class="p-graph-piece"
        v-for="(item, idx) in sortedList"
        :key="idx"
        :style="{ width: item.percentStr, backgroundColor: item.color }"
      />
    </div>
    <div class="p-graph-legend" v-if="!props.noLegend">
      <div
        class="p-graph-unit"
        v-for="(item, idx) in sortedList"
        :key="idx"
      >
        <div class="p-graph-cube" :style="{ backgroundColor: item.color }" />
        <span style="color: #000;">&nbsp;&nbsp;{{ item.isTagI18n ? t(item.tag) : item.tag }}</span>
        <span>&nbsp;&nbsp;{{ item.sizeStr }}</span>
        <span v-if="item.type">&nbsp;&nbsp;{{ item.type }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatSize } from '@/utils/utils'
import { DISK_OTHERS_COLOR, DISK_PART_PALETTE, PartInfo } from '@/utils/constant'

const { t } = useI18n()

const props = defineProps<{
  // totalSize: number; // 预计不需要传入总空间大小，空闲空间由API提供，总大小由汇总得到
  dataList: Array<PartInfo>;
  widthPx?: number;
  heightPx?: number;
  noLegend?: boolean;
}>()

const sortedList = computed(() => {
  let dList = [];
  if (Array.isArray(props.dataList)) {
    dList = props.dataList
  }
  let total = dList.reduce((pv, v) => pv + v.size, 0)
  // 若API不提供空闲空间，由此根据传入的total计算空闲空间
  // let blank = 0
  // if (props.totalSize && props.totalSize > total) {
  //   blank = props.totalSize - total
  //   total = props.totalSize
  // }
  const list = dList.toSorted((v1, v2) => {
    if (v1.size === v2.size) {
      return v1.tag > v2.tag ? 1 : -1
    }
    return v2.size - v1.size
  })
  const res = []
  for (let i = 0; i < DISK_PART_PALETTE.length; i++) {
    if (i > list.length - 1) {
      break
    }
    res.push({
      isTagI18n: false,
      tag: list[i].tag,
      sizeStr: formatSize(list[i].size, true),
      percentStr: `${(list[i].size / total * 100).toFixed(2)}%`,
      color: DISK_PART_PALETTE[i],
      type: list[i].type || ''
    })
  }
  if (list.length > DISK_PART_PALETTE.length) {
    const otherSize = list.slice(10).reduce((pv, v) => pv + v.size, 0)
    res.push({
      isTagI18n: true,
      tag: 'common.others',
      sizeStr: formatSize(otherSize, true),
      percentStr: `${(otherSize / total * 100).toFixed(2)}%`,
      color: DISK_OTHERS_COLOR,
      type: ''
    })
  }
  // 若API不提供空闲空间，由此根据传入的total计算空闲空间
  // if (blank / total > 0.0001) {
  //   res.push({
  //     isTagI18n: true,
  //     tag: 'common.free',
  //     sizeStr: formatSize(blank, true),
  //     percentStr: `${(blank / total * 100).toFixed(2)}%`,
  //     color: '#8D98AA',
  //     type: ''
  //   })
  // }
  return res;
})
</script>

<style scoped lang="scss">
.p-graph {
  width: 628px;
}
.p-graph-bar {
  width: 100%;
  height: 16px;
  display: flex;
  justify-content: flex-start;
}
.p-graph-piece {
  min-width: 4px;
  height: 100%;
  flex-shrink: 1;
  flex-grow: 0;
}
.p-graph-legend {
  width: calc(100% + 32px);
  margin-top: 12px;
  margin-left: -32px;
  line-height: 24px;
}
.p-graph-unit {
  margin-left: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;

  span {
    color: #8D98AA;
    line-height: 1;
  }
}
.p-graph-cube {
  width: 16px;
  height: 16px;
}
</style>
