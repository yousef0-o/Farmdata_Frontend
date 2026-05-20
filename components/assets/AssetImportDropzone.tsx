'use client'

import React, { useState } from 'react'
import { Upload, FileText, Loader2, X } from 'lucide-react'

interface AssetImportDropzoneProps {
  onImport: (file: File) => void
  isPending: boolean
  onClose: () => void
}

export default function AssetImportDropzone({ onImport, isPending, onClose }: AssetImportDropzoneProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    onImport(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 hover:bg-gray-100 rounded-full transition-all text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="p-3.5 bg-quick-blue-bg text-quick-blue-text rounded-2xl mb-3">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-base font-bold text-gray-900">استيراد سجلات الأصول</h2>
          <p className="text-xxs text-gray-500 mt-1 max-w-xs">
            يرجى رفع ملف Excel (.xlsx) متوافق مع الحسابات وسيقوم النظام بعملية المزج التلقائي (Upsert)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-farm-blue hover:bg-quick-blue-bg/10 transition-all relative">
            <input
              type="file"
              accept=".xlsx"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              required
            />
            {file ? (
              <div className="text-gray-700">
                <FileText className="w-8 h-8 text-quick-blue-text mx-auto mb-2" />
                <span className="text-xs font-semibold block truncate max-w-xs mx-auto">{file.name}</span>
                <span className="text-xxs text-gray-500">{(file.size / 1024).toFixed(1)} كيلوبايت</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-xs text-gray-500 block">اسحب ملف الجدول أو انقر للاختيار</span>
                <span className="text-xxs text-gray-400">يدعم صيغة Excel (.xlsx) حتى 10 ميغابايت</span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="submit"
              disabled={!file || isPending}
              className="flex-1 bg-farm-blue hover:bg-blue-800 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>بدء الاستيراد</span>
            </button>
            <button
              type="button"
              onClick={() => { onClose(); setFile(null) }}
              className="bg-gray-100 hover:bg-gray-250 text-gray-600 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
