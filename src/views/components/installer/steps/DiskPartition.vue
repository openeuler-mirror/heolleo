<template>
  <div class="disk-partition">
    <h2>{{ t('install.disk_setup') }}</h2>
    
    <el-form :model="form" label-width="200px">
      <el-form-item :label="t('install.target_disk')">
        <el-select v-model="form.disk" placeholder="Select disk">
          <el-option
            v-for="disk in disks"
            :key="disk"
            :label="disk"
            :value="disk"
          />
        </el-select>
      </el-form-item>
      
      <el-divider />
      
      <div v-for="(part, index) in form.partitions" :key="index">
        <h3>{{ t('install.partition') }} {{ index + 1 }}</h3>
        
        <el-form-item :label="t('install.size')">
          <el-input v-model="part.size" placeholder="e.g. 10G, 100%">
            <template #append>
              <el-select v-model="part.unit" style="width: 80px">
                <el-option label="MB" value="M" />
                <el-option label="GB" value="G" />
                <el-option label="%" value="%" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item :label="t('install.mount_point')">
          <el-input v-model="part.mountPoint" placeholder="e.g. /, /home" />
        </el-form-item>
        
        <el-form-item :label="t('install.filesystem')">
          <el-select v-model="part.fsType" placeholder="Select filesystem">
            <el-option label="ext4" value="ext4" />
            <el-option label="xfs" value="xfs" />
            <el-option label="btrfs" value="btrfs" />
          </el-select>
        </el-form-item>
        
        <el-button
          type="danger"
          @click="removePartition(index)"
          v-if="form.partitions.length > 1"
        >
          {{ t('common.remove') }}
        </el-button>
      </div>
      
      <el-button type="primary" @click="addPartition">
        {{ t('install.add_partition') }}
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const disks = ref(['/dev/sda', '/dev/sdb', '/dev/nvme0n1'])

const form = ref({
  disk: '',
  partitions: [{
    size: '',
    unit: 'G',
    mountPoint: '/',
    fsType: 'ext4'
  }]
})

function addPartition() {
  form.value.partitions.push({
    size: '',
    unit: 'G',
    mountPoint: '',
    fsType: 'ext4'
  })
}

function removePartition(index: number) {
  form.value.partitions.splice(index, 1)
}
</script>

<style scoped>
.disk-partition {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

h3 {
  margin: 15px 0;
  color: #666;
}
</style>