export function formatSize(byte: number, isStrOnly?:boolean) {
  if (byte < 1024) {
    return isStrOnly ? `${byte} B` : {
      num: byte,
      unit: 'B'
    }
  }
  if (byte < 1048576) {
    return isStrOnly ? `${(byte / 1024).toFixed(2)} KiB` : {
      num: byte / 1024,
      unit: 'KiB'
    }
  }
  if (byte < 1073741824) {
    return isStrOnly ? `${(byte / 1048576).toFixed(2)} MiB` : {
      num: byte / 1048576,
      unit: 'MiB'
    }
  }
  return isStrOnly ? `${(byte / 1073741824).toFixed(2)} GiB` : {
    num: byte / 1073741824,
    unit: 'GiB'
  }
}
