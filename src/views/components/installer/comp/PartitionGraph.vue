<template>
  <div class="p-graph">
    <div class="p-graph-bar">
      <div
        class="p-graph-piece"
        v-for="(item, idx) in sortedList"
        :key="idx"
        :style="{ width: item.percentStr, backgroundColor: item.color }"
      />
    </div>
    <div class="p-graph-legend">
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

const { t } = useI18n()

const COLOR_LIST = [
  '#0077FF',
  '#2DB47C',
  '#EC4F83',
  '#3DB6FC',
  '#6D47F5',
  '#3DCFD4',
  '#BD45E8',
  '#81BA06',
  '#EBAF00',
  '#F97611',
]

const props = defineProps<{
  totalSizeGb: number;
  dataList: Array<{ tag: string, sizeGb: number, type?: string }>;
}>()

const sortedList = computed(() => {
  let dList = [];
  if (Array.isArray(props.dataList)) {
    dList = props.dataList
  }
  let total = dList.reduce((pv, v) => pv + v.sizeGb, 0)
  let blank = 0
  if (props.totalSizeGb && props.totalSizeGb > total) {
    blank = props.totalSizeGb - total
    total = props.totalSizeGb
  }
  const list = dList.toSorted((v1, v2) => v2.sizeGb - v1.sizeGb)
  const res = []
  for (let i = 0; i < COLOR_LIST.length; i++) {
    if (i > list.length - 1) {
      break
    }
    res.push({
      isTagI18n: false,
      tag: list[i].tag,
      sizeStr: `${list[i].sizeGb.toFixed(2)} GiB`,
      percentStr: `${(list[i].sizeGb / total * 100).toFixed(2)}%`,
      color: COLOR_LIST[i],
      type: list[i].type || ''
    })
  }
  if (list.length > COLOR_LIST.length) {
    const otherSize = list.slice(10).reduce((pv, v) => pv + v.sizeGb, 0)
    res.push({
      isTagI18n: true,
      tag: 'common.others',
      sizeStr: `${otherSize.toFixed(2)} GiB`,
      percentStr: `${(otherSize / total * 100).toFixed(2)}%`,
      color: '#502092',
      type: ''
    })
  }
  if (blank / total > 0.0001) {
    res.push({
      isTagI18n: true,
      tag: 'common.free',
      sizeStr: `${blank.toFixed(2)} GiB`,
      percentStr: `${(blank / total * 100).toFixed(2)}%`,
      color: '#8D98AA',
      type: ''
    })
  }
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
