// 防抖函数
export const debounce = (func: Function, wait: number = 300) => {
  let timeout: number | null = null
  return function (this: any, ...args: any[]) {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func.apply(this, args), wait) as unknown as number
  }
}