'use client'

import React from 'react'
import AssetBuildingRooms from './AssetBuildingRooms'

interface AssetPolymorphicFieldsProps {
  category: string
  additionalDetails: Record<string, any>
  onChange: (details: Record<string, any>) => void
}

function FieldInput({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: any; onChange: (v: any) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-600 block mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-farm-blue"
        value={value || ''}
        onChange={(e) => {
          const val = type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value
          onChange(val)
        }}
      />
    </div>
  )
}

export default function AssetPolymorphicFields({ category, additionalDetails, onChange }: AssetPolymorphicFieldsProps) {
  const d = additionalDetails || {}
  const set = (key: string, value: any) => onChange({ ...d, [key]: value })

  // Room handlers for buildings
  const handleAddRoom = () => {
    const rooms = Array.isArray(d.rooms) ? [...d.rooms] : []
    rooms.push({ room_name: '', length: 0, width: 0, area: 0, ac_count: 0, doors_count: 0 })
    onChange({ ...d, rooms })
  }
  const handleRemoveRoom = (index: number) => {
    const rooms = Array.isArray(d.rooms) ? [...d.rooms] : []
    rooms.splice(index, 1)
    onChange({ ...d, rooms })
  }
  const handleRoomChange = (index: number, key: string, value: any) => {
    const rooms = Array.isArray(d.rooms) ? [...d.rooms] : []
    let parsedValue = value
    if (['length', 'width', 'area', 'ac_count', 'doors_count'].includes(key)) {
      parsedValue = value === '' ? 0 : parseFloat(value)
    }
    rooms[index] = { ...rooms[index], [key]: parsedValue }
    if (key === 'length' || key === 'width') {
      const l = parseFloat(rooms[index].length) || 0
      const w = parseFloat(rooms[index].width) || 0
      rooms[index].area = l * w
    }
    onChange({ ...d, rooms })
  }

  switch (category) {
    case 'nurseries':
    case 'incubators':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldInput label="العلامة التجارية / الماركة" value={d.brand} onChange={(v) => set('brand', v)} />
          <FieldInput label="المساحة الإجمالية (متر مربع)" type="number" value={d.area} onChange={(v) => set('area', v)} />
          <FieldInput label="الموقع" value={d.location} onChange={(v) => set('location', v)} />
          <FieldInput label="النوع" value={d.type} onChange={(v) => set('type', v)} />
          <FieldInput label="عدد الأنواع" type="number" value={d.type_count} onChange={(v) => set('type_count', v)} />
          <FieldInput label="بيض لكل نوع" type="number" value={d.eggs_per_type} onChange={(v) => set('eggs_per_type', v)} />
          <FieldInput label="عدد العربات" type="number" value={d.trolleys_count} onChange={(v) => set('trolleys_count', v)} />
          <FieldInput label="إجمالي سعة البيض" type="number" value={d.total_eggs} onChange={(v) => set('total_eggs', v)} />
        </div>
      )

    case 'lands':
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldInput label="اسم الأرض الفرعي" value={d.land_name} onChange={(v) => set('land_name', v)} />
          <FieldInput label="الوصف" value={d.description} onChange={(v) => set('description', v)} />
          <FieldInput label="الموقع" value={d.location} onChange={(v) => set('location', v)} />
          <FieldInput label="المستوى" value={d.level} onChange={(v) => set('level', v)} />
          <FieldInput label="الطول (متر)" type="number" value={d.length} onChange={(v) => set('length', v)} />
          <FieldInput label="العرض (متر)" type="number" value={d.width} onChange={(v) => set('width', v)} />
          <FieldInput label="القيمة" type="number" value={d.value} onChange={(v) => set('value', v)} />
          <FieldInput label="اسم الحساب" value={d.account_name} onChange={(v) => set('account_name', v)} />
          <FieldInput label="كود الحساب" value={d.account_code} onChange={(v) => set('account_code', v)} />
        </div>
      )

    case 'buildings':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FieldInput label="اسم المبنى" value={d.building_name} onChange={(v) => set('building_name', v)} />
            <FieldInput label="الوصف" value={d.description} onChange={(v) => set('description', v)} />
            <FieldInput label="الموقع" value={d.location} onChange={(v) => set('location', v)} />
            <FieldInput label="المستوى" value={d.level} onChange={(v) => set('level', v)} />
            <FieldInput label="الطول (متر)" type="number" value={d.length} onChange={(v) => set('length', v)} />
            <FieldInput label="العرض (متر)" type="number" value={d.width} onChange={(v) => set('width', v)} />
            <FieldInput label="المساحة المبنية" type="number" value={d.area} onChange={(v) => set('area', v)} />
            <FieldInput label="عدد الأدوار" type="number" value={d.floors} onChange={(v) => set('floors', v)} />
            <FieldInput label="القيمة" type="number" value={d.value} onChange={(v) => set('value', v)} />
            <FieldInput label="اسم الحساب" value={d.account_name} onChange={(v) => set('account_name', v)} />
            <FieldInput label="كود الحساب" value={d.account_code} onChange={(v) => set('account_code', v)} />
          </div>
          <AssetBuildingRooms
            rooms={Array.isArray(d.rooms) ? d.rooms : []}
            onAddRoom={handleAddRoom}
            onRemoveRoom={handleRemoveRoom}
            onRoomChange={handleRoomChange}
          />
        </div>
      )

    case 'poultry_houses':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FieldInput label="اسم العنبر" value={d.house_name} onChange={(v) => set('house_name', v)} />
          <FieldInput label="سعة الطيور (طير)" type="number" value={d.bird_count} onChange={(v) => set('bird_count', v)} />
          <FieldInput label="طيور لكل قفص" type="number" value={d.birds_per_cage} onChange={(v) => set('birds_per_cage', v)} />
          <FieldInput label="عدد الأقفاص" type="number" value={d.cage_count} onChange={(v) => set('cage_count', v)} />
          <FieldInput label="طول القفص" type="number" value={d.cage_length} onChange={(v) => set('cage_length', v)} />
          <FieldInput label="عرض القفص" type="number" value={d.cage_width} onChange={(v) => set('cage_width', v)} />
          <FieldInput label="ارتفاع القفص" type="number" value={d.cage_height} onChange={(v) => set('cage_height', v)} />
          <FieldInput label="نوع البطاريات" value={d.batteries_type} onChange={(v) => set('batteries_type', v)} />
          <FieldInput label="عدد البطاريات" type="number" value={d.batteries_count} onChange={(v) => set('batteries_count', v)} />
          <FieldInput label="صفوف لكل بطارية" type="number" value={d.rows_per_battery} onChange={(v) => set('rows_per_battery', v)} />
          <FieldInput label="أقفاص لكل بطارية" type="number" value={d.cages_per_battery} onChange={(v) => set('cages_per_battery', v)} />
          <FieldInput label="سيور السماد" type="number" value={d.manure_belt_count} onChange={(v) => set('manure_belt_count', v)} />
          <FieldInput label="لوحات تحكم بيئي" type="number" value={d.env_control_panels} onChange={(v) => set('env_control_panels', v)} />
          <FieldInput label="لوحات تغذية" type="number" value={d.feed_control_panels} onChange={(v) => set('feed_control_panels', v)} />
          <FieldInput label="قيمة العنبر" type="number" value={d.house_value} onChange={(v) => set('house_value', v)} />
          <FieldInput label="قيمة المعدات" type="number" value={d.tools_value} onChange={(v) => set('tools_value', v)} />
        </div>
      )

    case 'cars':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FieldInput label="اسم السيارة" value={d.car_name} onChange={(v) => set('car_name', v)} />
          <FieldInput label="الوصف" value={d.description} onChange={(v) => set('description', v)} />
          <FieldInput label="الشركة المصنعة" value={d.brand} onChange={(v) => set('brand', v)} placeholder="مثال: تويوتا، ايسوزو" />
          <FieldInput label="الموديل" value={d.model} onChange={(v) => set('model', v)} />
          <FieldInput label="اللون" value={d.color} onChange={(v) => set('color', v)} />
          <FieldInput label="رقم اللوحة" value={d.plate_number} onChange={(v) => set('plate_number', v)} />
          <FieldInput label="رقم الشاسيه" value={d.chassis_number} onChange={(v) => set('chassis_number', v)} />
          <FieldInput label="القيمة" type="number" value={d.value} onChange={(v) => set('value', v)} />
          <FieldInput label="اسم الحساب" value={d.account_name} onChange={(v) => set('account_name', v)} />
          <FieldInput label="كود الحساب" value={d.account_code} onChange={(v) => set('account_code', v)} />
        </div>
      )

    case 'equipment':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FieldInput label="اسم الآلة" value={d.machine_name} onChange={(v) => set('machine_name', v)} />
          <FieldInput label="الوصف" value={d.description} onChange={(v) => set('description', v)} />
          <FieldInput label="المستوى" value={d.level} onChange={(v) => set('level', v)} />
          <FieldInput label="بلد الصنع" value={d.factory_country} onChange={(v) => set('factory_country', v)} />
          <FieldInput label="المورد" value={d.supplier} onChange={(v) => set('supplier', v)} />
          <FieldInput label="رقم الفاتورة" value={d.invoice_number} onChange={(v) => set('invoice_number', v)} />
          <FieldInput label="القيمة" type="number" value={d.value} onChange={(v) => set('value', v)} />
          <FieldInput label="اسم الحساب" value={d.account_name} onChange={(v) => set('account_name', v)} />
          <FieldInput label="كود الحساب" value={d.account_code} onChange={(v) => set('account_code', v)} />
        </div>
      )

    case 'roads':
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FieldInput label="اسم الممر / الطريق" value={d.road_name} onChange={(v) => set('road_name', v)} />
          <FieldInput label="العدد" type="number" value={d.count} onChange={(v) => set('count', v)} />
          <FieldInput label="المستوى" value={d.level} onChange={(v) => set('level', v)} />
          <FieldInput label="الطول (متر)" type="number" value={d.length} onChange={(v) => set('length', v)} />
          <FieldInput label="العرض (متر)" type="number" value={d.width} onChange={(v) => set('width', v)} />
          <FieldInput label="المساحة" type="number" value={d.area} onChange={(v) => set('area', v)} />
          <FieldInput label="القيمة" type="number" value={d.value} onChange={(v) => set('value', v)} />
          <FieldInput label="الموقع" value={d.location} onChange={(v) => set('location', v)} />
        </div>
      )

    default:
      return null
  }
}
