<template>
  <div class="p-graph" :style="{width: props.widthPx ? `${props.widthPx}px` : '100%'}">
    <div class="p-graph-bar" :style="{height: `${props.heightPx || 16}px`}">
      <div
        class="p-graph-piece"
        v-for="(item, idx) in partitionWidths"
        :key="idx"
        :style="{ width: item.width, backgroundColor: item.color }"
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
import { computed, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatSize } from '@/utils/utils.ts'
import { DISK_OTHERS_COLOR, DISK_PART_PALETTE, PartInfo } from '@/utils/constant.ts'

const { t } = useI18n()

interface LegendItem {
  isTagI18n: boolean;
  tag: string;
  size: string;
  sizeStr: string | { num: number; unit: string; };
  color: string;
  type: string;
}

const props = defineProps({
  dataList: {
    type: Array as PropType<PartInfo[]>,
    required: true
  },
  widthPx: Number,
  heightPx: Number,
  noLegend: Boolean
})

const sortedList = computed<LegendItem[]>(() => {
  let dList: PartInfo[] = [];
  if (Array.isArray(props.dataList)) {
    dList = props.dataList
  }
  const list = dList.slice().sort((v1, v2) => {
    const size1 = Number(v1.size)
    const size2 = Number(v2.size)
    if (size1 === size2) {
      return v1.tag > v2.tag ? 1 : -1
    }
    return size2 - size1
  })
  const res: LegendItem[] = []
  for (let i = 0; i < list.length; i++) {
    res.push({
      isTagI18n: false,
      tag: list[i].tag,
      size: list[i].size,
      sizeStr: formatSize(Number(list[i].size), true),
      color: DISK_PART_PALETTE[i % DISK_PART_PALETTE.length],
      type: list[i].fs_type || '',
    })
  }
  return res;
})

const partitionWidths = computed(() => {
  const totalSize = sortedList.value.reduce((sum, p) => sum + Number(p.size), 0);
  if (totalSize === 0) return [];

  const minWidth = 3; // 3% minimum width
  let widths = sortedList.value.map(p => ({
    ...p,
    w: (Number(p.size) / totalSize) * 100
  }));

  const smallPartitions = widths.filter(p => p.w > 0 && p.w < minWidth);
  const largePartitions = widths.filter(p => p.w >= minWidth);

  if (smallPartitions.length > 0) {
    const assignedSmallWidth = smallPartitions.length * minWidth;

    if (assignedSmallWidth >= 100) {
      const equalWidth = 100 / widths.length;
      return widths.map(p => ({ ...p, width: `${equalWidth}%` }));
    }

    const remainingWidthForLarge = 100 - assignedSmallWidth;
    const totalLargeOriginalWidth = largePartitions.reduce((sum, p) => sum + p.w, 0);

    const finalWidthsData = widths.map(p => {
      if (p.w > 0 && p.w < minWidth) {
        return { ...p, width: `${minWidth}%` };
      }
      if (p.w >= minWidth) {
        if (totalLargeOriginalWidth > 0) {
          const scaledWidth = (p.w / totalLargeOriginalWidth) * remainingWidthForLarge;
          return { ...p, width: `${scaledWidth}%` };
        }
        return { ...p, width: '0%' };
      }
      return { ...p, width: '0%' };
    });
    return finalWidthsData;
  }

  return widths.map(p => ({ ...p, width: `${p.w}%` }));
});
</script>

<style scoped lang="scss">
.p-graph {
  width: 100%;
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
