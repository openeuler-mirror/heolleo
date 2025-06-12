<template>
  <div class="user-setup">
    <h2>{{ t('install.user_setup') }}</h2>
    
    <el-form :model="form" label-width="120px">
      <el-form-item :label="t('install.username')">
        <el-input v-model="form.username" />
      </el-form-item>
      
      <el-form-item :label="t('install.password')">
        <el-input v-model="form.password" type="password" show-password />
      </el-form-item>
      
      <el-form-item :label="t('install.confirm_password')">
        <el-input v-model="form.confirmPassword" type="password" show-password />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const form = ref({
  username: '',
  password: '',
  confirmPassword: ''
})
</script>

<style scoped>
.user-setup {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}
</style>