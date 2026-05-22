export const readStorage = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.localStorage.getItem(key)

    if (!rawValue) {
      return null
    }

    return JSON.parse(rawValue) as T
  } catch (error) {
    console.error(`Gagal membaca storage ${key}:`, error)
    return null
  }
}

export const writeStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export const removeStorage = (key: string) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(key)
}
