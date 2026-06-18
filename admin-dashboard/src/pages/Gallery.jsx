import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  Folder,
  ImagePlus,
  Images,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input, Label } from '@/components/ui/input'
import { galleryFolders, galleryStatuses, initialGalleryItems } from '@/data/galleryData'

const fallbackImage =
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=900&q=80'

const emptyImageForm = {
  title: '',
  category: 'rooms',
  sort_order: 1,
  status: 'active',
  image_path: '',
  image_file_name: '',
  image_file: null,
  images: [],
}

const emptyFolderForm = {
  name: '',
  status: 'active',
}

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function generateTitleFromFileName(fileName) {
  const cleanName = String(fileName || 'gallery-image')
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return titleCase(cleanName || 'Gallery Image')
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function statusVariant(status) {
  return status === 'active' ? 'success' : 'secondary'
}

function categoryClass(category) {
  const styles = {
    rooms: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
    cottage: 'bg-purple-50 text-purple-700 ring-purple-200',
    garden: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    parking: 'bg-slate-100 text-slate-700 ring-slate-200',
    kitchen: 'bg-amber-50 text-amber-700 ring-amber-200',
    property: 'bg-blue-50 text-blue-700 ring-blue-200',
    facilities: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  }

  return styles[category] || 'bg-slate-100 text-slate-700 ring-slate-200'
}

function normalizeFolderSort(items, category) {
  return items
    .filter((item) => item.category === category)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((item, index) => ({ ...item, sort_order: index + 1 }))
}

function reindexAll(items) {
  const categories = [...new Set(items.map((item) => item.category))]
  return categories.flatMap((category) => normalizeFolderSort(items, category))
}

function moveSortOrder(items, itemId, category, targetSort) {
  const folderItems = items.filter((item) => item.category === category).sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  const currentItem = folderItems.find((item) => item.id === itemId)

  if (!currentItem) return items

  const currentIndex = folderItems.findIndex((item) => item.id === itemId)
  const nextIndex = Math.max(0, Math.min(Number(targetSort) - 1, folderItems.length - 1))
  const reordered = folderItems.filter((item) => item.id !== itemId)
  reordered.splice(nextIndex, 0, currentItem)

  const reorderedWithSort = reordered.map((item, index) => ({ ...item, sort_order: index + 1 }))
  return items.map((item) => reorderedWithSort.find((nextItem) => nextItem.id === item.id) || item)
}

function insertIntoFolder(items, nextItem, targetSort) {
  const folderItems = items.filter((item) => item.category === nextItem.category).sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  const insertIndex = Math.max(0, Math.min(Number(targetSort) - 1, folderItems.length))
  const reordered = [...folderItems]
  reordered.splice(insertIndex, 0, nextItem)
  const reorderedWithSort = reordered.map((item, index) => ({ ...item, sort_order: index + 1 }))
  const otherItems = items.filter((item) => item.category !== nextItem.category)
  return [...otherItems, ...reorderedWithSort]
}

function insertManyIntoFolder(items, nextItems, category, targetSort) {
  const folderItems = items.filter((item) => item.category === category).sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  const insertIndex = Math.max(0, Math.min(Number(targetSort) - 1, folderItems.length))
  const reordered = [...folderItems]
  reordered.splice(insertIndex, 0, ...nextItems)
  const reorderedWithSort = reordered.map((item, index) => ({ ...item, sort_order: index + 1 }))
  const otherItems = items.filter((item) => item.category !== category)
  return [...otherItems, ...reorderedWithSort]
}

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-secondary">{title}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-text-primary">{value}</p>
            {description ? <p className="mt-1 text-xs text-text-secondary">{description}</p> : null}
          </div>
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActionsDropdown({ id, activeDropdown, setActiveDropdown, items }) {
  const isOpen = activeDropdown === id

  return (
    <div className="relative inline-flex">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setActiveDropdown(isOpen ? null : id)}
        className="gap-1.5"
      >
        <MoreHorizontal className="h-4 w-4" />
        Actions
        <ChevronDown className="h-3.5 w-3.5" />
      </Button>
      {isOpen ? (
        <div className="absolute right-0 top-9 z-40 min-w-44 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setActiveDropdown(null)
                  item.onClick()
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
                  item.destructive ? 'text-red-600' : 'text-text-primary'
                }`}
              >
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {item.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function SingleImageUploadField({ value, fileName, onChange, onRemove, error }) {
  return (
    <div className="space-y-3">
      <Label>Image upload</Label>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 px-4 py-6 text-center transition-colors hover:bg-blue-50/60">
        <Upload className="h-7 w-7 text-primary-600" />
        <span className="mt-2 text-sm font-semibold text-text-primary">Choose image file</span>
        <span className="mt-1 text-xs text-text-secondary">PNG, JPG, JPEG, WEBP supported</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onChange(file)
            event.target.value = ''
          }}
        />
      </label>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {value ? (
        <div className="rounded-xl border border-border bg-white p-3">
          <div className="flex gap-3">
            <img src={value} alt="Selected gallery" className="h-24 w-32 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Selected image</p>
              <p className="mt-1 truncate text-xs text-text-secondary">{fileName || 'Existing gallery image'}</p>
              <button
                type="button"
                onClick={onRemove}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
                Remove image
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <p className="text-xs text-text-secondary">Future backend upload path: bend/uploads/gallery/</p>
    </div>
  )
}

function BulkImageUploadField({ images, startingSort, onChange, onRemove, error }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Label>Image upload</Label>
        <span className="text-xs font-semibold text-text-secondary">{images.length} images selected</span>
      </div>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-slate-50 px-4 py-6 text-center transition-colors hover:bg-blue-50/60">
        <Upload className="h-7 w-7 text-primary-600" />
        <span className="mt-2 text-sm font-semibold text-text-primary">Choose multiple image files</span>
        <span className="mt-1 text-xs text-text-secondary">PNG, JPG, JPEG, WEBP supported. Titles are generated from file names.</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            if (files.length) onChange(files)
            event.target.value = ''
          }}
        />
      </label>
      {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
      {images.length ? (
        <div className="rounded-xl border border-border bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <div key={image.id} className="overflow-hidden rounded-xl border border-border bg-slate-50">
                <img src={image.image_path} alt={image.title} className="h-32 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">{image.title}</p>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">{image.image_file_name}</p>
                    </div>
                    <Badge variant="secondary">#{Number(startingSort || 1) + index}</Badge>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(image.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <p className="text-xs text-text-secondary">Future backend upload path: bend/uploads/gallery/</p>
    </div>
  )
}

export default function Gallery() {
  const [folders, setFolders] = useState(galleryFolders)
  const [galleryItems, setGalleryItems] = useState(reindexAll(initialGalleryItems))
  const [activeFolderSlug, setActiveFolderSlug] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortMode, setSortMode] = useState('sort_asc')
  const [imageModalMode, setImageModalMode] = useState(null)
  const [folderModalMode, setFolderModalMode] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [imageForm, setImageForm] = useState(emptyImageForm)
  const [folderForm, setFolderForm] = useState(emptyFolderForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [activeDropdown, setActiveDropdown] = useState(null)

  const activeFolder = folders.find((folder) => folder.slug === activeFolderSlug)

  const folderStats = useMemo(() => {
    return folders.map((folder) => {
      const images = galleryItems.filter((item) => item.category === folder.slug)
      const activeCount = images.filter((item) => item.status === 'active').length
      const inactiveCount = images.filter((item) => item.status === 'inactive').length
      const sortedImages = [...images].sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      const lastUpdated = sortedImages
        .map((item) => item.updated_at || item.created_at)
        .filter(Boolean)
        .sort((a, b) => new Date(b) - new Date(a))[0]

      return {
        ...folder,
        imageCount: images.length,
        activeCount,
        inactiveCount,
        coverImage: sortedImages[0]?.image_path || fallbackImage,
        lastUpdated: lastUpdated || folder.updated_at || folder.created_at,
      }
    })
  }, [folders, galleryItems])

  const filteredFolderImages = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    let items = galleryItems.filter((item) => item.category === activeFolderSlug)

    if (query) {
      items = items.filter((item) => item.title.toLowerCase().includes(query))
    }

    if (statusFilter !== 'all') {
      items = items.filter((item) => item.status === statusFilter)
    }

    return [...items].sort((a, b) => {
      if (sortMode === 'sort_desc') return Number(b.sort_order) - Number(a.sort_order)
      if (sortMode === 'newest') return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
      return Number(a.sort_order) - Number(b.sort_order)
    })
  }, [galleryItems, activeFolderSlug, searchTerm, statusFilter, sortMode])

  const summary = useMemo(() => {
    const activeImages = galleryItems.filter((item) => item.status === 'active').length
    const inactiveImages = galleryItems.filter((item) => item.status === 'inactive').length
    return {
      folders: folders.length,
      images: galleryItems.length,
      activeImages,
      inactiveImages,
    }
  }, [folders, galleryItems])

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function getFolderImageCount(category) {
    return galleryItems.filter((item) => item.category === category).length
  }

  function openAddImageModal(folderSlug = activeFolderSlug || folders[0]?.slug || 'rooms') {
    const nextSort = getFolderImageCount(folderSlug) + 1
    setImageModalMode('add')
    setSelectedImage(null)
    setImageForm({ ...emptyImageForm, category: folderSlug, sort_order: nextSort, images: [] })
    setErrors({})
  }

  function openEditImageModal(item) {
    setImageModalMode('edit')
    setSelectedImage(item)
    setImageForm({
      title: item.title,
      category: item.category,
      sort_order: item.sort_order,
      status: item.status,
      image_path: item.image_path,
      image_file_name: item.image_file_name || '',
      image_file: null,
      images: [],
    })
    setErrors({})
  }

  function openAddFolderModal() {
    setFolderModalMode('add')
    setSelectedFolder(null)
    setFolderForm(emptyFolderForm)
    setErrors({})
  }

  function openEditFolderModal(folder) {
    setFolderModalMode('edit')
    setSelectedFolder(folder)
    setFolderForm({ name: folder.name, status: folder.status })
    setErrors({})
  }

  function closeImageModal() {
    setImageModalMode(null)
    setSelectedImage(null)
    setImageForm(emptyImageForm)
    setErrors({})
  }

  function closeFolderModal() {
    setFolderModalMode(null)
    setSelectedFolder(null)
    setFolderForm(emptyFolderForm)
    setErrors({})
  }

  function handleImageFileChange(file) {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, image_path: 'Please select a valid image file.' }))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageForm((prev) => ({
      ...prev,
      image_path: previewUrl,
      image_file: file,
      image_file_name: file.name,
    }))
    setErrors((prev) => ({ ...prev, image_path: '' }))
  }
  function handleBulkImageFilesChange(files) {
    const invalidFile = files.find((file) => !file.type.startsWith('image/'))

    if (invalidFile) {
      setErrors((prev) => ({ ...prev, images: 'Please select image files only.' }))
      return
    }

    const nextImages = files.map((file) => ({
      id: `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`,
      file,
      image_file_name: file.name,
      image_path: URL.createObjectURL(file),
      title: generateTitleFromFileName(file.name),
    }))

    setImageForm((prev) => ({
      ...prev,
      images: [...prev.images, ...nextImages],
    }))
    setErrors((prev) => ({ ...prev, images: '' }))
  }

  function removeBulkImage(tempId) {
    setImageForm((prev) => ({
      ...prev,
      images: prev.images.filter((image) => image.id !== tempId),
    }))
  }


  function validateImageForm() {
    const nextErrors = {}
    const folderCount = getFolderImageCount(imageForm.category)
    const maxSort = imageModalMode === 'add' ? folderCount + 1 : Math.max(1, folderCount)

    if (imageModalMode === 'edit' && !imageForm.title.trim()) nextErrors.title = 'Image title is required.'
    if (!imageForm.category) nextErrors.category = 'Folder is required.'
    if (imageModalMode === 'add' && imageForm.images.length === 0) nextErrors.images = 'Select at least one image.'
    if (imageModalMode === 'edit' && !imageForm.image_path) nextErrors.image_path = 'Image file is required.'
    if (!imageForm.status) nextErrors.status = 'Status is required.'
    if (!Number(imageForm.sort_order) || Number(imageForm.sort_order) < 1 || Number(imageForm.sort_order) > maxSort) {
      nextErrors.sort_order = `Starting sort order must be between 1 and ${maxSort}.`
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function validateFolderForm() {
    const nextErrors = {}
    const name = folderForm.name.trim()
    const slug = slugify(name)

    if (!name) nextErrors.name = 'Folder name is required.'
    if (!slug) nextErrors.name = 'Folder name must contain letters or numbers.'
    if (folderModalMode === 'add' && folders.some((folder) => folder.slug === slug)) {
      nextErrors.name = 'A folder with this name already exists.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSaveImage(event) {
    event.preventDefault()
    if (!validateImageForm()) return

    const now = new Date().toISOString()
    const payload = {
      title: imageForm.title.trim(),
      category: imageForm.category,
      sort_order: Number(imageForm.sort_order),
      status: imageForm.status,
      image_path: imageForm.image_path,
      image_file_name: imageForm.image_file_name,
      updated_at: now,
    }

    if (imageModalMode === 'add') {
      const currentMaxId = galleryItems.length ? Math.max(...galleryItems.map((item) => item.id)) : 0
      const newItems = imageForm.images.map((image, index) => ({
        id: currentMaxId + index + 1,
        title: image.title,
        category: payload.category,
        sort_order: Number(payload.sort_order) + index,
        status: payload.status,
        image_path: image.image_path,
        image_file_name: image.image_file_name,
        created_at: now,
        updated_at: now,
      }))

      setGalleryItems((prev) => insertManyIntoFolder(prev, newItems, payload.category, payload.sort_order))
      const folderName = folders.find((folder) => folder.slug === payload.category)?.name || titleCase(payload.category)
      showToast(`${newItems.length} ${newItems.length === 1 ? 'image' : 'images'} added to ${folderName} folder.`)
    } else {
      setGalleryItems((prev) => {
        const oldItem = prev.find((item) => item.id === selectedImage.id)
        let workingItems = prev

        if (oldItem.category !== payload.category) {
          workingItems = reindexAll(prev.filter((item) => item.id !== selectedImage.id))
          const movedItem = { ...oldItem, ...payload }
          return insertIntoFolder(workingItems, movedItem, payload.sort_order)
        }

        workingItems = prev.map((item) => (item.id === selectedImage.id ? { ...item, ...payload } : item))
        return moveSortOrder(workingItems, selectedImage.id, payload.category, payload.sort_order)
      })
      showToast('Gallery image updated successfully.')
    }

    closeImageModal()
  }

  function handleSaveFolder(event) {
    event.preventDefault()
    if (!validateFolderForm()) return

    const now = new Date().toISOString()

    if (folderModalMode === 'add') {
      const slug = slugify(folderForm.name)
      const newFolder = {
        id: folders.length ? Math.max(...folders.map((folder) => folder.id)) + 1 : 1,
        name: folderForm.name.trim(),
        slug,
        status: folderForm.status,
        created_at: now,
        updated_at: now,
      }
      setFolders((prev) => [...prev, newFolder])
      showToast('Gallery folder added successfully.')
    } else {
      setFolders((prev) =>
        prev.map((folder) =>
          folder.id === selectedFolder.id
            ? { ...folder, name: folderForm.name.trim(), status: folderForm.status, updated_at: now }
            : folder
        )
      )
      showToast('Gallery folder updated successfully.')
    }

    closeFolderModal()
  }

  function handleDeleteTarget() {
    if (!deleteTarget) return

    if (deleteTarget.type === 'image') {
      const category = deleteTarget.item.category
      setGalleryItems((prev) => reindexAll(prev.filter((item) => item.id !== deleteTarget.item.id)))
      showToast('Gallery image deleted successfully.')
      if (activeFolderSlug === category) setSearchTerm((value) => value)
    }

    if (deleteTarget.type === 'folder') {
      setGalleryItems((prev) => prev.filter((item) => item.category !== deleteTarget.item.slug))
      setFolders((prev) => prev.filter((folder) => folder.id !== deleteTarget.item.id))
      if (activeFolderSlug === deleteTarget.item.slug) setActiveFolderSlug(null)
      showToast('Gallery folder deleted successfully.')
    }

    setDeleteTarget(null)
  }

  const stats = [
    { title: 'Gallery Folders', value: summary.folders, description: 'Managed categories', icon: Folder },
    { title: 'Total Images', value: summary.images, description: 'Across all folders', icon: Images },
    { title: 'Active Images', value: summary.activeImages, description: 'Visible on website', icon: Eye },
    { title: 'Inactive Images', value: summary.inactiveImages, description: 'Hidden items', icon: SlidersHorizontal },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title={activeFolder ? `${activeFolder.name} Gallery` : 'Gallery Management'}
          description={
            activeFolder
              ? 'Manage images inside this folder with folder-specific sort order.'
              : 'Manage gallery folders for rooms, cottage, garden, parking, kitchen, property, and facilities.'
          }
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          {activeFolder ? (
            <Button type="button" variant="outline" onClick={() => setActiveFolderSlug(null)} className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Back to Folders
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={openAddFolderModal} className="w-full sm:w-auto">
              <Folder className="h-4 w-4" />
              Add Folder
            </Button>
          )}
          <Button type="button" onClick={() => openAddImageModal(activeFolderSlug || folders[0]?.slug)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add Image
          </Button>
        </div>
      </div>

      {toast ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {toast}
        </div>
      ) : null}

      {!activeFolder ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {folderStats.map((folder) => (
              <Card key={folder.id} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative h-44 bg-slate-100">
                  <img src={folder.coverImage} alt={folder.name} className="h-full w-full object-cover" />
                  <div className="absolute left-3 top-3">
                    <Badge variant={statusVariant(folder.status)}>{folder.status}</Badge>
                  </div>
                  <div className="absolute right-3 top-3">
                    <ActionsDropdown
                      id={`folder-${folder.id}`}
                      activeDropdown={activeDropdown}
                      setActiveDropdown={setActiveDropdown}
                      items={[
                        { label: 'Open Folder', icon: Eye, onClick: () => setActiveFolderSlug(folder.slug) },
                        { label: 'Add Image', icon: ImagePlus, onClick: () => openAddImageModal(folder.slug) },
                        { label: 'Edit Folder', icon: Pencil, onClick: () => openEditFolderModal(folder) },
                        { label: 'Delete Folder', icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ type: 'folder', item: folder }) },
                      ]}
                    />
                  </div>
                </div>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">{folder.name}</h3>
                      <p className="mt-1 text-sm text-text-secondary">{folder.imageCount} images</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${categoryClass(folder.slug)}`}>
                      {titleCase(folder.slug)}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-text-secondary">Active</p>
                      <p className="mt-1 font-semibold text-text-primary">{folder.activeCount}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-text-secondary">Inactive</p>
                      <p className="mt-1 font-semibold text-text-primary">{folder.inactiveCount}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-text-secondary">Last updated {formatDate(folder.lastUpdated)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search image title..."
                    className="pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="all">All Status</option>
                  {galleryStatuses.map((status) => (
                    <option key={status} value={status}>{titleCase(status)}</option>
                  ))}
                </select>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="sort_asc">Sort Order: Low to High</option>
                  <option value="sort_desc">Sort Order: High to Low</option>
                  <option value="newest">Recently Updated</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {filteredFolderImages.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-primary-600">
                  <Images className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-text-primary">No images found</h3>
                <p className="mt-1 text-sm text-text-secondary">Add images to this folder or adjust your filters.</p>
                <Button type="button" onClick={() => openAddImageModal(activeFolderSlug)} className="mt-4">
                  <Plus className="h-4 w-4" />
                  Add Image
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredFolderImages.map((item) => (
                <Card key={item.id} className="overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative h-48 bg-slate-100">
                    <img src={item.image_path || fallbackImage} alt={item.title} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
                      <Badge variant="secondary">#{item.sort_order}</Badge>
                    </div>
                    <div className="absolute right-3 top-3">
                      <ActionsDropdown
                        id={`image-${item.id}`}
                        activeDropdown={activeDropdown}
                        setActiveDropdown={setActiveDropdown}
                        items={[
                          { label: 'View Image', icon: Eye, onClick: () => openEditImageModal(item) },
                          { label: 'Edit Image', icon: Pencil, onClick: () => openEditImageModal(item) },
                          { label: 'Delete Image', icon: Trash2, destructive: true, onClick: () => setDeleteTarget({ type: 'image', item }) },
                        ]}
                      />
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-text-primary">{item.title}</h3>
                        <p className="mt-1 text-xs text-text-secondary">Updated {formatDate(item.updated_at || item.created_at)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${categoryClass(item.category)}`}>
                        {activeFolder.name}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {imageModalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{imageModalMode === 'add' ? 'Add Gallery Images' : 'Edit Gallery Image'}</h2>
                <p className="mt-1 text-sm text-text-secondary">Upload one or many images and organize them inside gallery folders.</p>
              </div>
              <button type="button" onClick={closeImageModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveImage} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {imageModalMode === 'edit' ? (
                  <div className="space-y-2">
                    <Label htmlFor="image-title">Image title</Label>
                    <Input
                      id="image-title"
                      value={imageForm.title}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, title: event.target.value }))}
                      placeholder="Ground Floor Room"
                    />
                    {errors.title ? <p className="text-xs font-medium text-red-600">{errors.title}</p> : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="image-category">Folder / category</Label>
                  <select
                    id="image-category"
                    value={imageForm.category}
                    onChange={(event) => {
                      const nextCategory = event.target.value
                      const nextSort = imageModalMode === 'add'
                        ? getFolderImageCount(nextCategory) + 1
                        : Math.max(1, getFolderImageCount(nextCategory))
                      setImageForm((prev) => ({ ...prev, category: nextCategory, sort_order: nextSort }))
                    }}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {folders.map((folder) => (
                      <option key={folder.slug} value={folder.slug}>{folder.name}</option>
                    ))}
                  </select>
                  {errors.category ? <p className="text-xs font-medium text-red-600">{errors.category}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-status">Status</Label>
                  <select
                    id="image-status"
                    value={imageForm.status}
                    onChange={(event) => setImageForm((prev) => ({ ...prev, status: event.target.value }))}
                    className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {galleryStatuses.map((status) => (
                      <option key={status} value={status}>{titleCase(status)}</option>
                    ))}
                  </select>
                  {errors.status ? <p className="text-xs font-medium text-red-600">{errors.status}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image-sort">{imageModalMode === 'add' ? 'Starting sort order' : 'Sort order'}</Label>
                  <Input
                    id="image-sort"
                    type="number"
                    min="1"
                    max={imageModalMode === 'add' ? getFolderImageCount(imageForm.category) + 1 : Math.max(1, getFolderImageCount(imageForm.category))}
                    value={imageForm.sort_order}
                    onChange={(event) => setImageForm((prev) => ({ ...prev, sort_order: event.target.value }))}
                  />
                  <p className="text-xs text-text-secondary">
                    {imageModalMode === 'add'
                      ? 'Bulk images will be inserted sequentially from this position inside the selected folder.'
                      : 'Sort order applies inside the selected folder only.'}
                  </p>
                  {errors.sort_order ? <p className="text-xs font-medium text-red-600">{errors.sort_order}</p> : null}
                </div>
              </div>

              {imageModalMode === 'add' ? (
                <BulkImageUploadField
                  images={imageForm.images}
                  startingSort={imageForm.sort_order}
                  error={errors.images}
                  onChange={handleBulkImageFilesChange}
                  onRemove={removeBulkImage}
                />
              ) : (
                <SingleImageUploadField
                  value={imageForm.image_path}
                  fileName={imageForm.image_file_name}
                  error={errors.image_path}
                  onChange={handleImageFileChange}
                  onRemove={() => setImageForm((prev) => ({ ...prev, image_path: '', image_file_name: '', image_file: null }))}
                />
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeImageModal}>Cancel</Button>
                <Button type="submit">{imageModalMode === 'add' ? 'Add Images' : 'Save Changes'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {folderModalMode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-border p-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary">{folderModalMode === 'add' ? 'Add Gallery Folder' : 'Edit Gallery Folder'}</h2>
                <p className="mt-1 text-sm text-text-secondary">Folder names are used to group gallery images.</p>
              </div>
              <button type="button" onClick={closeFolderModal} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFolder} className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder name</Label>
                <Input
                  id="folder-name"
                  value={folderForm.name}
                  onChange={(event) => setFolderForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Rooms"
                />
                {errors.name ? <p className="text-xs font-medium text-red-600">{errors.name}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder-status">Status</Label>
                <select
                  id="folder-status"
                  value={folderForm.status}
                  onChange={(event) => setFolderForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {galleryStatuses.map((status) => (
                    <option key={status} value={status}>{titleCase(status)}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={closeFolderModal}>Cancel</Button>
                <Button type="submit">{folderModalMode === 'add' ? 'Add Folder' : 'Save Folder'}</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-text-primary">
              Delete {deleteTarget.type === 'folder' ? 'Folder' : 'Image'}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {deleteTarget.type === 'folder'
                ? `Are you sure you want to delete the ${deleteTarget.item.name} folder? Images inside this folder will also be removed from mock state.`
                : `Are you sure you want to delete ${deleteTarget.item.title}? This action cannot be undone.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDeleteTarget}>Delete</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
