import { ref } from 'vue'
import { createWorker } from 'tesseract.js'
import { useToast } from 'vue-toastification'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

export type FileType = 'image' | 'pdf' | 'docx' | null

export function useFileSubmit() {
  const toast = useToast()

  // State
  const isDragging = ref(false)
  const selectedFile = ref<File | null>(null)
  const isProcessing = ref(false)
  const ocrResult = ref('')
  const previewUrl = ref<string | null>(null)
  const fileType = ref<FileType>(null)

  // Handle drag events
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = true
  }

  const handleDragLeave = () => {
    isDragging.value = false
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false

    const files = e.dataTransfer?.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Handle file input
  const handleFileInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      handleFileSelect(target.files[0])
    }
  }

  // Process selected file
  const handleFileSelect = async (file: File) => {
    const validTypes = ['image/', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const isValid = validTypes.some(type => file.type.startsWith(type) || file.type === type)

    if (!isValid) {
      toast.error('Please select an image, PDF, or DOCX file')
      return
    }

    selectedFile.value = file

    // Determine file type
    if (file.type.startsWith('image/')) {
      fileType.value = 'image'
      // Create image preview
      const reader = new FileReader()
      reader.onload = (e) => {
        previewUrl.value = e.target?.result as string
      }
      reader.readAsDataURL(file)
      await processOCR(file)
    } else if (file.type === 'application/pdf') {
      fileType.value = 'pdf'
      previewUrl.value = null
      await processPDF(file)
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType.value = 'docx'
      previewUrl.value = null
      await processDOCX(file)
    }
  }

  // Process OCR using Tesseract.js
  const processOCR = async (file: File) => {
    isProcessing.value = true
    ocrResult.value = ''

    try {
      toast.info('Starting OCR processing...')

      const worker = await createWorker('eng')

      const { data } = await worker.recognize(file)

      ocrResult.value = data.text

      // Log to console as requested
      console.log('OCR Result:', data.text)
      console.log('OCR Confidence:', data.confidence)
      console.log('Full OCR Data:', data)

      await worker.terminate()

      toast.success('OCR processing completed!')
    } catch (error) {
      console.error('OCR Error:', error)
      toast.error('Failed to process image with OCR')
    } finally {
      isProcessing.value = false
    }
  }

  // Process PDF using PDF.js
  const processPDF = async (file: File) => {
    isProcessing.value = true
    ocrResult.value = ''

    try {
      toast.info('Extracting text from PDF...')

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''

      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = textContent.items.map((item: any) => item.str).join(' ')
        fullText += `\n--- Page ${i} ---\n${pageText}\n`
      }

      ocrResult.value = fullText

      // Log to console
      console.log('PDF Text Extracted:', fullText)
      console.log('Total Pages:', pdf.numPages)

      toast.success(`Text extracted from ${pdf.numPages} page(s)!`)
    } catch (error) {
      console.error('PDF Processing Error:', error)
      toast.error('Failed to extract text from PDF')
    } finally {
      isProcessing.value = false
    }
  }

  // Process DOCX using Mammoth
  const processDOCX = async (file: File) => {
    isProcessing.value = true
    ocrResult.value = ''

    try {
      toast.info('Extracting text from DOCX...')

      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })

      ocrResult.value = result.value

      // Log to console
      console.log('DOCX Text Extracted:', result.value)
      console.log('Messages:', result.messages)

      toast.success('Text extracted from DOCX file!')
    } catch (error) {
      console.error('DOCX Processing Error:', error)
      toast.error('Failed to extract text from DOCX')
    } finally {
      isProcessing.value = false
    }
  }

  // Clear selection
  const clearSelection = () => {
    selectedFile.value = null
    previewUrl.value = null
    ocrResult.value = ''
    fileType.value = null
  }

  // Copy text to clipboard
  const copyToClipboard = async () => {
    try {
      await window.navigator.clipboard.writeText(ocrResult.value)
      toast.success('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy text')
    }
  }

  // Dialog state
  const showSubmitDialog = ref(false)

  // Open submit dialog
  const openSubmitDialog = () => {
    if (!ocrResult.value) {
      toast.error('No text to submit. Please process a file first.')
      return
    }
    showSubmitDialog.value = true
  }

  // Close submit dialog
  const closeSubmitDialog = () => {
    showSubmitDialog.value = false
  }

  return {
    // State
    isDragging,
    selectedFile,
    isProcessing,
    ocrResult,
    previewUrl,
    fileType,
    showSubmitDialog,
    // Methods
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleFileSelect,
    processOCR,
    processPDF,
    processDOCX,
    clearSelection,
    copyToClipboard,
    openSubmitDialog,
    closeSubmitDialog,
  }
}
