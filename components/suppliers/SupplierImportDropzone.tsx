'use client'

import React, { useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import AppDialog from '@/components/ui/AppDialog'
import { Button } from '@/components/ui/Button'

interface SupplierImportDropzoneProps {
  onImport: (file: File) => void
  isPending: boolean
  onClose: () => void
}

export default function SupplierImportDropzone({ onImport, isPending, onClose }: SupplierImportDropzoneProps) {
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    onImport(file)
  }

  return (
    <AppDialog open onClose={onClose} panelClassName="max-w-md animate-in fade-in duration-200">
      <div className="relative w-full rounded-2xl bg-surface p-6 shadow-xl">
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="absolute left-4 top-4"
          aria-label="إغلاق نافذة الاستيراد"
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="p-3.5 bg-quick-blue-bg text-quick-blue-text rounded-2xl mb-3">
            <Upload className="w-6 h-6 animate-bounce" />
          </div>
          <h2 className="text-base font-bold text-gray-900">استيراد سجلات الموردين</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            يرجى رفع ملف Excel (.xlsx) متوافق وسيقوم النظام بعملية المزج التلقائي (Upsert)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center cursor-pointer hover:border-farm-blue hover:bg-quick-blue-bg/10 transition-colors relative">
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
                <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} كيلوبايت</span>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-xs text-gray-500 block">اسحب ملف الجدول أو انقر للاختيار</span>
                <span className="text-xs text-gray-400">يدعم صيغة Excel (.xlsx) حتى 10 ميغابايت</span>
              </div>
            )}
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              type="submit"
              disabled={!file || isPending}
              isLoading={isPending}
              className="flex-1 font-semibold"
            >
              <span>بدء الاستيراد</span>
            </Button>
            <Button
              type="button"
              onClick={() => { onClose(); setFile(null) }}
              variant="outline"
              size="sm"
              className="font-semibold"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </div>
    </AppDialog>
  )
}
