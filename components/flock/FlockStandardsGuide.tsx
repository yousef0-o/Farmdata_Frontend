import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Book } from 'lucide-react'
import { Button } from '@/components/ui/Button'

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
          
          {/* Section 1 */}
          <div>
            <h4 className="text-farm-blue font-bold text-lg mb-3 border-r-4 border-farm-blue pr-3 bg-blue-50 py-2 rounded-l-lg">
              مؤشرات الدورة الإنتاجية حسب إدارة المشاريع
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="p-3 border-b border-gray-100">المؤشر</th>
                    <th className="p-3 border-b border-gray-100">من</th>
                    <th className="p-3 border-b border-gray-100">إلى</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="p-3 bg-red-50 text-red-800 font-semibold">غير محقق</td><td className="p-3">0%</td><td className="p-3">50%</td></tr>
                  <tr><td className="p-3 bg-red-50 text-red-800 font-semibold">أدنى إنتاج</td><td className="p-3">51%</td><td className="p-3">65%</td></tr>
                  <tr><td className="p-3 bg-yellow-50 text-yellow-800 font-semibold">ظروف متوسطة</td><td className="p-3">66%</td><td className="p-3">74%</td></tr>
                  <tr><td className="p-3 bg-blue-50 text-blue-800 font-semibold">متوسط إنتاج</td><td className="p-3">75%</td><td className="p-3">80%</td></tr>
                  <tr><td className="p-3 bg-emerald-50 text-emerald-800 font-semibold">ظروف مثالية</td><td className="p-3">81%</td><td className="p-3">99%</td></tr>
                  <tr><td className="p-3 font-semibold">غير معقول</td><td className="p-3">100%</td><td className="p-3">فأكثر</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <h4 className="text-farm-blue font-bold text-lg mb-3 border-r-4 border-farm-blue pr-3 bg-blue-50 py-2 rounded-l-lg">
              تقدير مستوى الأداء (تصنيف جودة الإنتاج التجاري)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="p-3 border-b border-gray-100">مستوى الأداء</th>
                    <th className="p-3 border-b border-gray-100">معدل إنتاج البيض (٪)</th>
                    <th className="p-3 border-b border-gray-100">التفسير</th>
                    <th className="p-3 border-b border-gray-100">الملاحظة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="p-3 bg-emerald-50 text-emerald-800 font-semibold">ممتاز</td><td className="p-3">85 – 100 ٪</td><td className="p-3">إنتاج مرتفع جدًا ومطابق للسلالة</td><td className="p-3 text-gray-500">أداء اقتصادي مثالي</td></tr>
                  <tr><td className="p-3 bg-blue-50 text-blue-800 font-semibold">جيد جداً</td><td className="p-3">80 – 84 ٪</td><td className="p-3">قريب من المرجعية، خسارة بسيطة</td><td className="p-3 text-gray-500">ضمن الحدود التجارية المجدية</td></tr>
                  <tr><td className="p-3 bg-yellow-50 text-yellow-800 font-semibold">جيد</td><td className="p-3">70 – 79 ٪</td><td className="p-3">أداء متوسط، يحتاج تحسين بالتغذية</td><td className="p-3 text-gray-500">قد يتأثر الربح التشغيلي</td></tr>
                  <tr><td className="p-3 bg-red-50 text-red-800 font-semibold">ضعيف</td><td className="p-3">أقل من 70 ٪</td><td className="p-3">دون المستوى الاقتصادي</td><td className="p-3 text-gray-500">مشكلة صحية أو إدارية</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 */}
          <div>
            <h4 className="text-farm-blue font-bold text-lg mb-3 border-r-4 border-farm-blue pr-3 bg-blue-50 py-2 rounded-l-lg">
              معامل التحويل العلفي (FCR)
            </h4>
            <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 leading-relaxed mb-4">
              <strong>المعنى العلمي:</strong> مقدار العلف اللازم لإنتاج وحدة واحدة من المنتج (FCR = كمية العلف المستهلك ÷ كمية البيض المنتَج بالكجم).<br/>
              كلما قلّت قيمة FCR، كان التحويل أفضل (استفادة أعلى). وكلما زادت، كان هناك هدر أو ضعف.
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="p-3 border-b border-gray-100">الأداء</th>
                    <th className="p-3 border-b border-gray-100">العلف/كرتون</th>
                    <th className="p-3 border-b border-gray-100">معامل FCR</th>
                    <th className="p-3 border-b border-gray-100">كرتون/طن علف</th>
                    <th className="p-3 border-b border-gray-100">التفسير الفني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="p-3 bg-emerald-50 text-emerald-800 font-semibold">ممتاز</td><td className="p-3">أقل من 55 كجم</td><td className="p-3 font-mono">{'<'} 2.30</td><td className="p-3">{'>'} 18</td><td className="p-3 text-gray-500">إدارة تغذية ممتازة، صحة جيدة</td></tr>
                  <tr><td className="p-3 bg-blue-50 text-blue-800 font-semibold">جيد جداً</td><td className="p-3">55 - 58 كجم</td><td className="p-3 font-mono">2.30 - 2.40</td><td className="p-3">17 - 18</td><td className="p-3 text-gray-500">أداء ممتاز عملياً</td></tr>
                  <tr><td className="p-3 bg-yellow-50 text-yellow-800 font-semibold">جيد</td><td className="p-3">58 - 61 كجم</td><td className="p-3 font-mono">2.40 - 2.55</td><td className="p-3">16.5 - 17</td><td className="p-3 text-gray-500">أداء مستقر</td></tr>
                  <tr><td className="p-3 font-semibold">متوسط</td><td className="p-3">61 - 65 كجم</td><td className="p-3 font-mono">2.55 - 2.70</td><td className="p-3">15.5 - 16.5</td><td className="p-3 text-gray-500">مقبول ويحتاج ضبط</td></tr>
                  <tr><td className="p-3 bg-red-50 text-red-800 font-semibold">ضعيف</td><td className="p-3">أكثر من 65 كجم</td><td className="p-3 font-mono">{'>'} 2.70</td><td className="p-3">{'<'} 15.5</td><td className="p-3 text-gray-500">هدر علف، مشكلة صحية</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 */}
          <div>
            <h4 className="text-farm-blue font-bold text-lg mb-3 border-r-4 border-farm-blue pr-3 bg-blue-50 py-2 rounded-l-lg">
              توزيع الإنتاج حسب الأوزان (Benchmarks)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="p-3 border-b border-gray-100">الفئة</th>
                    <th className="p-3 border-b border-gray-100">وزن البيضة</th>
                    <th className="p-3 border-b border-gray-100">النسبة من الإجمالي</th>
                    <th className="p-3 border-b border-gray-100">التفسير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="p-3 font-semibold">SSS / SS</td><td className="p-3 text-gray-500">{'<'} 18 جم</td><td className="p-3 text-gray-500">0 – 2%</td><td className="p-3 text-gray-500">بداية الدورة أو ضعف تغذية</td></tr>
                  <tr><td className="p-3 font-semibold">S</td><td className="p-3 text-gray-500">18 – 20 جم</td><td className="p-3 text-gray-500">3 – 6%</td><td className="p-3 text-gray-500">طبيعي في الأسابيع الأولى</td></tr>
                  <tr><td className="p-3 font-semibold">M</td><td className="p-3 text-gray-500">21 – 22 جم</td><td className="p-3 text-gray-500">20 – 30%</td><td className="p-3 text-gray-500">معيار الإنتاج التجاري</td></tr>
                  <tr><td className="p-3 bg-blue-50 text-blue-800 font-semibold">L1 / L2</td><td className="p-3 text-gray-500">23 – 25 جم</td><td className="p-3 text-gray-500">35 – 45%</td><td className="p-3 text-gray-500">البيض القياسي (أعلى ربحية)</td></tr>
                  <tr><td className="p-3 bg-blue-50 text-blue-800 font-semibold">XL / XXL</td><td className="p-3 text-gray-500">26 – 28 جم</td><td className="p-3 text-gray-500">15 – 25%</td><td className="p-3 text-gray-500">مرحلة متقدمة من الإنتاج</td></tr>
                  <tr><td className="p-3 font-semibold">B / J</td><td className="p-3 text-gray-500">{'>'} 28 جم</td><td className="p-3 text-gray-500">0 – 3%</td><td className="p-3 text-gray-500">طبيعي في نهاية الدورة</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
