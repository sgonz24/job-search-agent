export default function StatsStrip({ stats, activeStatFilter, onStatClick }) {
  if (!stats) return null
  const items = [
    { key: 'all', label: 'Total', value: stats.total, color: '' },
    { key: 'tier_a', label: 'Tier A', value: stats.tier_a, color: 'gold' },
    { key: 'tier_b', label: 'Tier B', value: stats.tier_b, color: '' },
    { key: 'tier_c', label: 'Tier C', value: stats.tier_c, color: '' },
    { key: 'applied', label: 'Applied', value: stats.applied, color: 'green' },
    { key: 'interviewing', label: 'Interviews', value: stats.interviewing, color: 'cyan' },
    { key: 'offer', label: 'Offers', value: stats.offers, color: 'gold' },
  ]
  return (
    <div className="stats-strip">
      {items.map(item => (
        <button
          key={item.key}
          className={`ss-item ${activeStatFilter === item.key ? 'active' : ''}`}
          onClick={() => onStatClick(item.key)}
        >
          <span className={`ss-num ${item.color}`}>{item.value}</span>
          <span className="ss-label">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
