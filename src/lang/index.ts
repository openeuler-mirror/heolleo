import zh from './zh';
import en from './en';

export type LangKey = 'zh' | 'en';

interface LangItem {
  val: LangKey;
  label: string;
}

export const FALL_BACK_LANG = 'en';
export const DEFAULT_LANG = 'zh';

export const LANG_MAP: Readonly<Map<string, LangItem>> = new Map([
  ['zh', {val: 'zh', label: '简体中文'}],
  ['en', {val: 'en', label: 'English'}],
]);

export default {
  zh,
  en
};
