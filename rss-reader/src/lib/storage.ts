const STORAGE_PREFIX = 'rss-reader-'

export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error('Failed to save to storage:', error)
  }
}

export async function loadFromStorage<T>(key: string): Promise<T | undefined> {
  try {
    const value = localStorage.getItem(STORAGE_PREFIX + key)
    if (value === null) return undefined
    return JSON.parse(value) as T
  } catch (error) {
    console.error('Failed to load from storage:', error)
    return undefined
  }
}

export async function removeFromStorage(key: string): Promise<void> {
  try {
    localStorage.removeItem(STORAGE_PREFIX + key)
  } catch (error) {
    console.error('Failed to remove from storage:', error)
  }
}

export async function clearAllStorage(): Promise<void> {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error('Failed to clear storage:', error)
  }
}
