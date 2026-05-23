import React from 'react'

interface EntryReadOnlyInfoProps {
  recordDate: string
  ageDays: number
  birdCount: number
  weekNumber?: number   // breeding only
}

export function EntryReadOnlyInfo({
  recordDate,
  ageDays,
  birdCount,
  weekNumber,
}: EntryReadOnlyInfoProps) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm" dir="rtl">
      <div>
        <p className="text-gray-500 font-semibold mb-1">التاريخ</p>
        <p className="font-bold text-gray-900">{recordDate}</p>
      </div>
      <div>
        <p className="text-gray-500 font-semibold mb-1">عمر الفوج</p>
        <p className="font-bold text-gray-900">{ageDays} يوم</p>
      </div>
      <div>
        <p className="text-gray-500 font-semibold mb-1">عدد الطيور</p>
        <p className="font-bold text-gray-900">{birdCount.toLocaleString('en-US')}</p>
      </div>
      {weekNumber !== undefined && (
        <div>
          <p className="text-gray-500 font-semibold mb-1">الأسبوع</p>
          <p className="font-bold text-gray-900">أسبوع {weekNumber}</p>
        </div>
      )}
    </div>
  )
}
