import { useAnnotationStore } from '../../store/useAnnotationStore';
import { TYPE_ICONS } from '../../constants/elementTypes';

function confidenceColor(val: number): string {
  if (val >= 0.9) return 'var(--color-success)';
  if (val >= 0.7) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

function fmtPct(val: number): string {
  return `${Math.round(val * 100)}%`;
}

function ConfidenceBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="confidence-row">
      {label && <span className="conf-label">{label}</span>}
      <div className="confidence-bar-track">
        <div
          className="confidence-bar-fill"
          style={{ width: `${pct}%`, background: confidenceColor(value) }}
        />
      </div>
      <span className="conf-value" style={{ color: confidenceColor(value) }}>
        {fmtPct(value)}
      </span>
    </div>
  );
}

export function ParseQualityPanel() {
  const elements = useAnnotationStore((s) => s.getPageElements());
  const currentPage = useAnnotationStore((s) => s.currentPage);
  const totalPages = useAnnotationStore((s) => s.totalPages);

  const sorted = [...elements].sort((a, b) => a.order - b.order);

  let ocrConfSum = 0;
  let ocrConfCount = 0;
  const typeCounts: Record<string, { total: number; demoted: number }> = {};

  for (const el of sorted) {
    const t = el.category_type;
    if (!typeCounts[t]) typeCounts[t] = { total: 0, demoted: 0 };
    typeCounts[t].total++;
    if (el.demoted) typeCounts[t].demoted++;

    if (el.confidence != null) {
      ocrConfSum += el.confidence;
      ocrConfCount++;
    }
  }

  const avgOcrConf = ocrConfCount > 0 ? ocrConfSum / ocrConfCount : null;

  return (
    <div className="quality-panel">
      <div className="quality-page-indicator">
        第 {currentPage} / {totalPages} 页
      </div>

      <div className="quality-score-section">
        <div className="quality-score-header">综合评分</div>
        {avgOcrConf != null ? (
          <ConfidenceBar value={avgOcrConf} label="OCR 置信度" />
        ) : (
          <div className="confidence-row">
            <span className="conf-label">OCR 置信度</span>
            <span className="conf-na">—</span>
          </div>
        )}
      </div>

      <div className="quality-types-section">
        <div className="quality-score-header">元素类型统计</div>
        <div className="type-stats-grid">
          {Object.entries(typeCounts).map(([type, counts]) => (
            <div key={type} className="type-stat-item">
              <span className="type-stat-icon">{TYPE_ICONS[type] || '📝'}</span>
              <span className="type-stat-label">{type}</span>
              <span className="type-stat-count">{counts.total}</span>
              {counts.demoted > 0 && (
                <span className="type-stat-demoted">⚠{counts.demoted}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="quality-elements-section">
        <div className="quality-score-header">元素详情</div>
        <div className="quality-element-list">
          {sorted.map((el) => (
            <div key={el.id} className="quality-element-row">
              <span className="q-el-icon">{TYPE_ICONS[el.category_type] || '📝'}</span>
              <span className="q-el-type">{el.category_type}</span>
              {el.demoted && <span className="q-el-badge q-badge-warn">⚠降级</span>}
              {(!el.markdown && !el.html && !el.latex) && !el.demoted && (
                <span className="q-el-badge q-badge-muted">○空白</span>
              )}
              {el.confidence != null ? (
                <ConfidenceBar value={el.confidence} />
              ) : (
                <span className="conf-na" style={{ marginLeft: 'auto' }}>N/A</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
