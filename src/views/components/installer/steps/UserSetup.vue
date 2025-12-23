<template>
  <div class="user-setup">
    <div class="user-setup-hr" />
    <div class="user-setup-bar">
      <StepBar :step-num="1" />
    </div>
    <div class="user-setup-form">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="auto" label-position="left">
        <el-form-item prop="username" :label="t('install.username')">
          <el-input v-model="form.username" />
        </el-form-item>

        <el-form-item prop="password" :label="t('install.password')">
          <el-input v-model="form.password" :type="pwdShown[0] ? 'input' : 'password'">
            <template #suffix>
              <PasswordEye class="pwd-suffix" :is-open="pwdShown[0]" @click="pwdShown[0] = !pwdShown[0]" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="confirmPassword" :label="t('install.confirm_password')">
          <el-input v-model="form.confirmPassword" :type="pwdShown[1] ? 'input' : 'password'">
            <template #suffix>
              <PasswordEye class="pwd-suffix" :is-open="pwdShown[1]" @click="pwdShown[1] = !pwdShown[1]" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item :label="t('common.blank')" style="margin-top: -14px;">
          <el-checkbox v-model="isUseStrong" :label="t('install.use_strong_password')" />
          <el-checkbox v-model="isAdminSame" :label="t('install.use_same_password_for_admin')" />
        </el-form-item>

        <template v-if="!isAdminSame">
          <el-form-item prop="adminPassword" :label="t('install.admin_password')">
            <el-input v-model="form.adminPassword" :type="pwdShown[2] ? 'input' : 'password'">
              <template #suffix>
                <PasswordEye class="pwd-suffix" :is-open="pwdShown[2]" @click="pwdShown[2] = !pwdShown[2]" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="adminConfirmPassword" :label="t('install.confirm_password')">
            <el-input v-model="form.adminConfirmPassword" :type="pwdShown[3] ? 'input' : 'password'">
              <template #suffix>
                <PasswordEye class="pwd-suffix" :is-open="pwdShown[3]" @click="pwdShown[3] = !pwdShown[3]" />
              </template>
            </el-input>
          </el-form-item>
        </template>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import PasswordEye from '@/views/components/svg/PasswordEye.vue'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import {INSTALL_INFO_KEY} from "@/utils/constant.ts";

const { t } = useI18n()

const pwdShown = ref([false, false, false, false])

const loading = ref(false)
const formRef = ref()
const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  adminPassword: '',
  adminConfirmPassword: ''
})

const isUseStrong = ref(true)
const isAdminSame = ref(true)

const rules = reactive({
  username: [
    { required: true, trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, trigger: 'blur' }
  ],
  adminPassword: [
    { required: true, trigger: 'blur' }
  ],
  adminConfirmPassword: [
    { required: true, trigger: 'blur' }
  ]
})

// 密码复杂度校验函数
const validatePassword = (rule: any, value: string, callback: any) => {
  if (!isUseStrong.value) {
    // 如果不使用强密码，则不需要校验复杂度
    callback()
    return
  }
  
  if (!value) {
    callback(new Error(t('install.password_required')))
    return
  }
  
  // 业界通用的密码复杂度校验规则
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(value)
  const hasLowerCase = /[a-z]/.test(value)
  const hasNumbers = /\d/.test(value)
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
  
  const errors = []
  
  if (value.length < minLength) {
    errors.push(t('install.password_min_length', { length: minLength }))
  }
  if (!hasUpperCase) {
    errors.push(t('install.password_uppercase_required'))
  }
  if (!hasLowerCase) {
    errors.push(t('install.password_lowercase_required'))
  }
  if (!hasNumbers) {
    errors.push(t('install.password_number_required'))
  }
  if (!hasSpecialChar) {
    errors.push(t('install.password_special_char_required'))
  }
  
  if (errors.length > 0) {
    callback(new Error(errors.join(', ')))
  } else {
    callback()
  }
}

// 动态更新密码校验规则
const updatePasswordRules = () => {
  if (isUseStrong.value) {
    // 使用强密码时，添加复杂度校验
    rules.password = [
      { required: true, trigger: 'blur' },
      { validator: validatePassword, trigger: 'blur' }
    ]
    rules.adminPassword = [
      { required: true, trigger: 'blur' },
      { validator: validatePassword, trigger: 'blur' }
    ]
  } else {
    // 不使用强密码时，只保留必填校验
    rules.password = [
      { required: true, trigger: 'blur' }
    ]
    rules.adminPassword = [
      { required: true, trigger: 'blur' }
    ]
  }
}

// 监听"使用强密码"复选框的变化
watch(isUseStrong, () => {
  updatePasswordRules()
})

// 初始化时设置校验规则
updatePasswordRules()

const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
async function checkValid() {
  if (!await formRef.value.validate().catch(() => false)) {
    return false
  }

  // 验证密码确认
  if (form.password !== form.confirmPassword) {
    ElMessage.error(t('install.password_mismatch'))
    return false
  }

  if (!isAdminSame.value && form.adminPassword !== form.adminConfirmPassword) {
    ElMessage.error(t('install.admin_password_mismatch'))
    return false
  }

  // 保存用户信息到installInfo
  installInfo.username = form.username
  installInfo.password = form.password
  installInfo.adminPassword = isAdminSame.value ? form.password : form.adminPassword
  installInfo.isAdminSame = isAdminSame.value
  
  return true
}

defineExpose({
  checkValid
})
</script>

<style scoped lang="scss">
.user-setup {
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

  &-form {
    width: calc(100% - 32px);
  }
}

.pwd-suffix {
  width: 18px;
  cursor: pointer;
}

.user-setup-form {
  :deep(.el-form-item__content) {
    max-width: 320px;
  }

  // 大幅增加表单项之间的间距，确保密码复杂度提示信息不会重叠
  :deep(.el-form-item) {
    margin-bottom: 32px;
    
    &.el-form-item--error {
      margin-bottom: 48px; // 错误状态下增加更多间距
    }
  }

  // 为复选框区域增加额外间距
  :deep(.el-form-item:has(.el-checkbox)) {
    margin-bottom: 24px;
  }

  // 为密码相关的输入框设置更大的间距
  :deep(.el-form-item:nth-child(2)), // 密码输入框
  :deep(.el-form-item:nth-child(3)), // 确认密码输入框
  :deep(.el-form-item:nth-child(5)), // 管理员密码输入框
  :deep(.el-form-item:nth-child(6)) { // 确认管理员密码输入框
    margin-bottom: 40px;
    
    &.el-form-item--error {
      margin-bottom: 56px; // 错误状态下更大的间距
    }
  }
}
</style>
