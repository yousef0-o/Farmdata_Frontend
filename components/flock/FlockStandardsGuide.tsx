import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Book } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type GuideCell = {
  value: React.ReactNode
  className?: string
}

type GuideRow = {
  label: GuideCell
  values: GuideCell[]
}

type GuideSection = {
  title: string
  columns: string[]
  rows: GuideRow[]
}

const guideSections: GuideSection[] = [
  {
    title: 'مؤشرات الدورة الإنتاجية حسب إدارة المشاريع',
    columns: ['المؤشر', 'من', 'إلى'],
    rows: [
      {
        label: { value: 'غير محقق', className: 'bg-red-50 text-red-800 font-semibold' },
        values: [{ value: '0%' }, { value: '50%' }],
      },
      {
        label: { value: 'أدنى إنتاج', className: 'bg-red-50 text-red-800 font-semibold' },
        values: [{ value: '51%' }, { value: '65%' }],
      },
      {
        label: { value: 'ظروف متوسطة', className: 'bg-yellow-50 text-yellow-800 font-semibold' },
        values: [{ value: '66%' }, { value: '74%' }],
      },
      {
        label: { value: 'متوسط إنتاج', className: 'bg-blue-50 text-blue-800 font-semibold' },
        values: [{ value: '75%' }, { value: '80%' }],
      },
      {
        label: { value: 'ظروف مثالية', className: 'bg-emerald-50 text-emerald-800 font-semibold' },
        values: [{ value: '81%' }, { value: '99%' }],
      },
      {
        label: { value: 'غير معقول', className: 'font-semibold' },
        values: [{ value: '100%' }, { value: 'فأكثر' }],
      },
    ],
  },
  {
    title: 'تقدير مستوى الأداء (تصنيف جودة الإنتاج التجاري)',
    columns: ['مستوى الأداء', 'معدل إنتاج البيض (٪)', 'التفسير', 'الملاحظة'],
    rows: [
      {
        label: { value: 'ممتاز', className: 'bg-emerald-50 text-emerald-800 font-semibold' },
        values: [
          { value: '85 – 100 ٪' },
          { value: 'إنتاج مرتفع جدًا ومطابق للسلالة' },
          { value: 'أداء اقتصادي مثالي', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'جيد جداً', className: 'bg-blue-50 text-blue-800 font-semibold' },
        values: [
          { value: '80 – 84 ٪' },
          { value: 'قريب من المرجعية، خسارة بسيطة' },
          { value: 'ضمن الحدود التجارية المجدية', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'جيد', className: 'bg-yellow-50 text-yellow-800 font-semibold' },
        values: [
          { value: '70 – 79 ٪' },
          { value: 'أداء متوسط، يحتاج تحسين بالتغذية' },
          { value: 'قد يتأثر الربح التشغيلي', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'ضعيف', className: 'bg-red-50 text-red-800 font-semibold' },
        values: [
          { value: 'أقل من 70 ٪' },
          { value: 'دون المستوى الاقتصادي' },
          { value: 'مشكلة صحية أو إدارية', className: 'text-gray-500' },
        ],
      },
    ],
  },
  {
    title: 'معامل التحويل العلفي (FCR)',
    columns: ['الأداء', 'العلف/كرتون', 'معامل FCR', 'كرتون/طن علف', 'التفسير الفني'],
    rows: [
      {
        label: { value: 'ممتاز', className: 'bg-emerald-50 text-emerald-800 font-semibold' },
        values: [
          { value: 'أقل من 55 كجم' },
          { value: '< 2.30', className: 'font-mono' },
          { value: '> 18' },
          { value: 'إدارة تغذية ممتازة، صحة جيدة', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'جيد جداً', className: 'bg-blue-50 text-blue-800 font-semibold' },
        values: [
          { value: '55 - 58 كجم' },
          { value: '2.30 - 2.40', className: 'font-mono' },
          { value: '17 - 18' },
          { value: 'أداء ممتاز عملياً', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'جيد', className: 'bg-yellow-50 text-yellow-800 font-semibold' },
        values: [
          { value: '58 - 61 كجم' },
          { value: '2.40 - 2.55', className: 'font-mono' },
          { value: '16.5 - 17' },
          { value: 'أداء مستقر', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'متوسط', className: 'font-semibold' },
        values: [
          { value: '61 - 65 كجم' },
          { value: '2.55 - 2.70', className: 'font-mono' },
          { value: '15.5 - 16.5' },
          { value: 'مقبول ويحتاج ضبط', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'ضعيف', className: 'bg-red-50 text-red-800 font-semibold' },
        values: [
          { value: 'أكثر من 65 كجم' },
          { value: '> 2.70', className: 'font-mono' },
          { value: '< 15.5' },
          { value: 'هدر علف، مشكلة صحية', className: 'text-gray-500' },
        ],
      },
    ],
  },
  {
    title: 'توزيع الإنتاج حسب الأوزان (Benchmarks)',
    columns: ['الفئة', 'وزن البيضة', 'النسبة من الإجمالي', 'التفسير'],
    rows: [
      {
        label: { value: 'SSS / SS', className: 'font-semibold' },
        values: [
          { value: '< 18 جم', className: 'text-gray-500' },
          { value: '0 – 2%', className: 'text-gray-500' },
          { value: 'بداية الدورة أو ضعف تغذية', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'S', className: 'font-semibold' },
        values: [
          { value: '18 – 20 جم', className: 'text-gray-500' },
          { value: '3 – 6%', className: 'text-gray-500' },
          { value: 'طبيعي في الأسابيع الأولى', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'M', className: 'font-semibold' },
        values: [
          { value: '21 – 22 جم', className: 'text-gray-500' },
          { value: '20 – 30%', className: 'text-gray-500' },
          { value: 'معيار الإنتاج التجاري', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'L1 / L2', className: 'bg-blue-50 text-blue-800 font-semibold' },
        values: [
          { value: '23 – 25 جم', className: 'text-gray-500' },
          { value: '35 – 45%', className: 'text-gray-500' },
          { value: 'البيض القياسي (أعلى ربحية)', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'XL / XXL', className: 'bg-blue-50 text-blue-800 font-semibold' },
        values: [
          { value: '26 – 28 جم', className: 'text-gray-500' },
          { value: '15 – 25%', className: 'text-gray-500' },
          { value: 'مرحلة متقدمة من الإنتاج', className: 'text-gray-500' },
        ],
      },
      {
        label: { value: 'B / J', className: 'font-semibold' },
        values: [
          { value: '> 28 جم', className: 'text-gray-500' },
          { value: '0 – 3%', className: 'text-gray-500' },
          { value: 'طبيعي في نهاية الدورة', className: 'text-gray-500' },
        ],
      },
    ],
  },
]

function GuideTable({ section }: { section: GuideSection }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:hidden">
        {section.rows.map((row, rowIndex) => (
          <article key={rowIndex} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`inline-flex max-w-full items-center rounded-lg px-2.5 py-1 text-sm ${row.label.className || 'bg-gray-50 font-semibold text-gray-800'}`}>
              {row.label.value}
            </div>
            <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {row.values.map((cell, cellIndex) => (
                <div key={cellIndex} className="min-w-0 rounded-lg bg-gray-50 px-3 py-2">
                  <dt className="text-xs font-semibold text-gray-500">{section.columns[cellIndex + 1]}</dt>
                  <dd className={`mt-1 break-words text-sm font-semibold text-gray-800 ${cell.className || ''}`}>
                    {cell.value}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-100 lg:block">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600">
              {section.columns.map((column) => (
                <th key={column} className="p-3 border-b border-gray-100">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {section.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className={`p-3 ${row.label.className || 'font-semibold'}`}>{row.label.value}</td>
                {row.values.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`p-3 ${cell.className || ''}`}>{cell.value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function FlockStandardsGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
      <Button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="h-auto w-full justify-between rounded-none p-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Book className="w-5 h-5" />
          </div>
          <span className="font-bold text-gray-800">دليل المعايير والمؤشرات القياسية للإنتاج التجاري</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
      </Button>

      {isOpen && (
        <div className="p-6 space-y-8 animate-in slide-in-from-top-2 duration-300">
          {guideSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-farm-blue font-bold text-lg mb-3 border-r-4 border-farm-blue pr-3 bg-blue-50 py-2 rounded-l-lg">
                {section.title}
              </h4>
              {section.title === 'معامل التحويل العلفي (FCR)' ? (
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed mb-4">
                  <strong>المعنى العلمي:</strong> مقدار العلف اللازم لإنتاج وحدة واحدة من المنتج (FCR = كمية العلف المستهلك ÷ كمية البيض المنتَج بالكجم).<br/>
                  كلما قلّت قيمة FCR، كان التحويل أفضل (استفادة أعلى). وكلما زادت، كان هناك هدر أو ضعف.
                </div>
              ) : null}
              <GuideTable section={section} />
            </div>
          ))}

        </div>
      )}
    </div>
  )
}
