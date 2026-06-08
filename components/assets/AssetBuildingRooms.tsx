'use client'

import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Room {
  room_name: string
  length: number
  width: number
  area: number
  ac_count: number
  doors_count: number
}

interface AssetBuildingRoomsProps {
  rooms: Room[]
  onAddRoom: () => void
  onRemoveRoom: (index: number) => void
  onRoomChange: (index: number, key: string, value: any) => void
}

export default function AssetBuildingRooms({ rooms, onAddRoom, onRemoveRoom, onRoomChange }: AssetBuildingRoomsProps) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-700">سجل الغرف والتقسيمات الفرعية</span>
        <Button
          type="button"
          onClick={onAddRoom}
          variant="outline"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          <span>إضافة غرفة</span>
        </Button>
      </div>

      {rooms.length > 0 ? (
        <div className="space-y-3">
          {rooms.map((room, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">#{idx + 1}</span>
              <input
                type="text"
                placeholder="اسم الغرفة *"
                required
                className="flex-1 min-w-[120px] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                value={room.room_name}
                onChange={(e) => onRoomChange(idx, 'room_name', e.target.value)}
              />
              <input
                type="number"
                placeholder="الطول"
                className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                value={room.length || ''}
                onChange={(e) => onRoomChange(idx, 'length', e.target.value)}
              />
              <input
                type="number"
                placeholder="العرض"
                className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                value={room.width || ''}
                onChange={(e) => onRoomChange(idx, 'width', e.target.value)}
              />
              <input
                type="number"
                placeholder="مساحة"
                readOnly
                className="w-20 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 focus:outline-none"
                value={room.area || ''}
              />
              <input
                type="number"
                placeholder="تكييف"
                className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                value={room.ac_count || ''}
                onChange={(e) => onRoomChange(idx, 'ac_count', e.target.value)}
              />
              <input
                type="number"
                placeholder="أبواب"
                className="w-16 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-gray-50 text-gray-900 focus:outline-none focus:ring-1 focus:ring-farm-blue"
                value={room.doors_count || ''}
                onChange={(e) => onRoomChange(idx, 'doors_count', e.target.value)}
              />
              <Button
                type="button"
                onClick={() => onRemoveRoom(idx)}
                variant="danger"
                size="icon"
                className="h-8 min-h-8 w-8 rounded-lg"
                aria-label="حذف الغرفة"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 bg-gray-100/50 rounded-xl text-xs text-gray-500 border border-dashed border-gray-200">
          لا توجد غرف مضافة حالياً.
        </div>
      )}
    </div>
  )
}
