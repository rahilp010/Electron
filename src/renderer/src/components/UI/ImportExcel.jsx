/* eslint-disable prettier/prettier */
import { useState } from 'react'
import { Uploader, Animation } from 'rsuite'
import { X, Upload } from 'lucide-react'

const ImportExcel = ({ onFileSelected, onClose }) => {
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleFileChange = async (files) => {
    if (files.length > 0) {
      const file = files[0]

      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ]

      if (!validTypes.includes(file.blobFile.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
        alert('Please select a valid Excel file (.xlsx, .xls) or CSV file')
        return
      }

      setIsUploading(true)

      try {
        await onFileSelected(file.blobFile.path || file.name)
      } catch (error) {
        console.error('Error processing file:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  return (
    <Animation.Slide in={true} placement="top" className="mx-14 my-2">
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-gray-800">Import Excel File</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isUploading}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Upload Area */}
        <Uploader
          draggable
          autoUpload={false}
          onChange={handleFileChange}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={() => setDragOver(false)}
          disabled={isUploading}
          accept=".xlsx,.xls,.csv"
        >
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
              ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                <span className="text-gray-600">Processing file...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload size={32} className="text-gray-400 mb-3" />
                <div>
                  <span className="text-gray-600">Click or drag Excel file here</span>
                  <p className="text-sm text-gray-500 mt-1">Supports .xlsx, .xls, and .csv files</p>
                </div>
              </div>
            )}
          </div>
        </Uploader> 
      </div>
    </Animation.Slide>
  )
}

export default ImportExcel
