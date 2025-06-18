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
          <el-checkbox v-model="isUseStrong" label="使用强密码" />
          <el-checkbox v-model="isAdminSame" label="为管理员使用同样的密码" />
        </el-form-item>

        <template v-if="!isAdminSame">
          <el-form-item prop="adminPassword" :label="'管理员密码'">
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
import { inject, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import PasswordEye from '@/views/components/svg/PasswordEye.vue'
import StepBar from '@/views/components/installer/comp/StepBar.vue'
import {INSTALL_INFO_KEY} from "@/utils/constant";

const { t } = useI18n()

const pwdShown = ref([false, false, false, false])

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

const installInfo = inject(INSTALL_INFO_KEY, reactive({}))
async function checkValid() {
  if (!await formRef.value.validate().catch(() => false)) {
    return false
  }
  installInfo.username = form.username
  installInfo.password = form.password
  installInfo.adminPassword = isAdminSame.value ? form.password : form.adminPassword
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
}
</style>
