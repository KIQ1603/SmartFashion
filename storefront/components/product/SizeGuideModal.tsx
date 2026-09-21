'use client';

import { useState } from 'react';
import { X } from '@phosphor-icons/react';

// Bảng quy đổi size chuẩn (cm) - thông tin tham chiếu phổ biến ngành may mặc, không phải số liệu
// tự bịa riêng cho SmartFashion, dùng để người dùng đối chiếu trước khi chọn size.
const SIZE_CHART = [
  { size: 'XS', vn: '36', chest: '80–84', waist: '60–64', hip: '84–88' },
  { size: 'S', vn: '38', chest: '85–89', waist: '65–69', hip: '89–93' },
  { size: 'M', vn: '40', chest: '90–94', waist: '70–74', hip: '94–98' },
  { size: 'L', vn: '42', chest: '95–99', waist: '75–79', hip: '99–103' },
  { size: 'XL', vn: '44', chest: '100–104', waist: '80–84', hip: '104–108' },
];

const MEASURING_TIPS = [
  { label: 'Ngực', desc: 'Đo vòng quanh phần lớn nhất của ngực, thước đo giữ ngang và không siết chặt.' },
  { label: 'Eo', desc: 'Đo vòng quanh phần eo nhỏ nhất của cơ thể.' },
  { label: 'Mông', desc: 'Đứng khép chân, đo vòng quanh phần lớn nhất của mông.' },
];

/** Minh họa vị trí đo trên áo - vẽ tay bằng SVG (không phải ảnh chụp sản phẩm) chỉ để hướng dẫn
 * chung, tương tự sơ đồ đo phổ biến ở các trang thời trang. */
function MeasureDiagram() {
  return (
    <svg viewBox="0 0 200 240" className="h-auto w-full max-w-[180px] text-muted-foreground" fill="none" aria-hidden>
      <path
        d="M60 20 L80 8 Q100 0 120 8 L140 20 L168 44 L150 66 L136 56 L136 220 L64 220 L64 56 L50 66 L32 44 Z"
        stroke="currentColor"
        strokeWidth="2"
        className="fill-muted"
      />
      <line x1="52" y1="90" x2="148" y2="90" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="100" y="82" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
        ngực
      </text>
      <line x1="55" y1="140" x2="145" y2="140" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="100" y="132" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
        eo
      </text>
      <line x1="58" y1="190" x2="142" y2="190" stroke="currentColor" strokeWidth="1.5" markerEnd="url(#arrow)" />
      <text x="100" y="182" textAnchor="middle" className="fill-foreground text-[11px] font-medium">
        mông
      </text>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
        </marker>
      </defs>
    </svg>
  );
}

export default function SizeGuideModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="cursor-pointer text-xs font-medium text-foreground underline underline-offset-2">
        Hướng dẫn chọn size
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Bảng size"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 sm:p-8"
          >
            <div className="mb-1 flex items-start justify-between">
              <h2 className="font-serif text-3xl font-semibold text-foreground">Bảng size</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="cursor-pointer rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">Hướng dẫn chọn size</p>

            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full min-w-[440px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left text-muted-foreground">
                    <th className="px-4 py-2.5 font-medium">Size</th>
                    <th className="px-4 py-2.5 font-medium">VN</th>
                    <th className="px-4 py-2.5 font-medium">Ngực (cm)</th>
                    <th className="px-4 py-2.5 font-medium">Eo (cm)</th>
                    <th className="px-4 py-2.5 font-medium">Mông (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_CHART.map((row) => (
                    <tr key={row.size} className="border-b border-border/60 text-foreground last:border-0">
                      <td className="px-4 py-2.5 font-semibold">{row.size}</td>
                      <td className="px-4 py-2.5">{row.vn}</td>
                      <td className="px-4 py-2.5">{row.chest}</td>
                      <td className="px-4 py-2.5">{row.waist}</td>
                      <td className="px-4 py-2.5">{row.hip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <h3 className="mb-3 font-serif text-lg font-semibold text-foreground">Cách đo</h3>
                <div className="space-y-3.5">
                  {MEASURING_TIPS.map((tip) => (
                    <div key={tip.label}>
                      <p className="text-sm font-medium text-foreground">{tip.label}</p>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-start justify-center sm:justify-end">
                <MeasureDiagram />
              </div>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Số đo mang tính tham khảo chung, có thể chênh lệch nhẹ tùy kiểu dáng từng sản phẩm.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
