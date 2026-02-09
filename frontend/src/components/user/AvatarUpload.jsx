import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Avatar from './Avatar'
import { userService } from '../../services/api'

function AvatarUpload({ user, onUploadSuccess, onFileSelected, selectedFile }) {
  const fileInputRef = useRef(null)
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(selectedFile)
  }, [selectedFile])

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('JPEG, PNG, GIF, WebP 형식만 가능합니다.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('파일 크기는 5MB 이하만 가능합니다.')
      return
    }

    setError('')
    onFileSelected?.(file)
    e.target.value = ''
  }

  const handleDelete = async () => {
    if (!window.confirm('프로필 사진을 삭제하시겠습니까?')) return
    try {
      setIsUploading(true)
      const response = await userService.deleteAvatar()
      onUploadSuccess?.(response.data)
      onFileSelected?.(null)
    } catch (err) {
      setError('삭제에 실패했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="w-24 h-24 rounded-full object-cover"
          />
        ) : (
          <Avatar user={user} size="xl" />
        )}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-white/20 hover:bg-white/30 text-white"
        >
          {user?.profilePictureUrl ? '변경' : '업로드'}
        </Button>
        {user?.profilePictureUrl && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={isUploading}
            className="border-red-400/30 text-red-400 hover:bg-red-400/10"
          >
            삭제
          </Button>
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}

export default AvatarUpload
