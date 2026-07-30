import { ref } from 'vue'

interface UserConfig {
  username: string
  password: string
}

interface PartitionConfig {
  disk: string
  partitions: Array<{
    size: string
    mountPoint: string
    fsType: string
  }>
}

interface ImageConfig {
  imagePath: string
  mountPoint: string
}

interface CopyConfig {
  source: string
  destination: string
}

interface GrubConfig {
  disk: string
}

class InstallService {
  private static instance: InstallService
  private progress = ref(0)
  private status = ref('idle')

  public static getInstance(): InstallService {
    if (!InstallService.instance) {
      InstallService.instance = new InstallService()
    }
    return InstallService.instance
  }

  public async createUser(config: UserConfig): Promise<boolean> {
    this.status.value = 'creating_user'
    try {
      const result = await window.electronAPI.invoke('create-user', config)
      this.progress.value += 20
      return result.success
    } catch (error) {
      console.error('Create user failed:', error)
      return false
    }
  }

  public async partitionDisk(config: PartitionConfig): Promise<boolean> {
    this.status.value = 'partitioning'
    try {
      const result = await window.electronAPI.invoke('partition-disk', config)
      this.progress.value += 20
      return result.success
    } catch (error) {
      console.error('Partition failed:', error)
      return false
    }
  }

  public async mountImage(config: ImageConfig): Promise<boolean> {
    this.status.value = 'mounting'
    try {
      const result = await window.electronAPI.invoke('mount-image', config)
      this.progress.value += 20
      return result.success
    } catch (error) {
      console.error('Mount failed:', error)
      return false
    }
  }

  public async copyFiles(config: CopyConfig): Promise<boolean> {
    this.status.value = 'copying'
    try {
      const result = await window.electronAPI.invoke('copy-files', config)
      this.progress.value += 20
      return result.success
    } catch (error) {
      console.error('Copy failed:', error)
      return false
    }
  }

  public async configureGrub(config: GrubConfig): Promise<boolean> {
    this.status.value = 'configuring_grub'
    try {
      const result = await window.electronAPI.invoke('configure-grub', config)
      this.progress.value += 20
      return result.success
    } catch (error) {
      console.error('GRUB config failed:', error)
      return false
    }
  }

  public getProgress() {
    return this.progress
  }

  public getStatus() {
    return this.status
  }

  public reset() {
    this.progress.value = 0
    this.status.value = 'idle'
  }
}

export const installService = InstallService.getInstance()