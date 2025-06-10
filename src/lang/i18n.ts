import { createI18n } from 'vue-i18n'; //引入vue-i18n组件
import messages from './index';

const i18n = createI18n({
  fallbackLocale: 'en',//预设语言环境
  globalInjection: true,
  // legacy: false, // 已过时，v11版本后引用[v18n.t]必须显式import，不能用$t了
  locale: 'zh', // 默认显示的语言
  messages // 本地化的语言环境信息。
});

export default i18n;
