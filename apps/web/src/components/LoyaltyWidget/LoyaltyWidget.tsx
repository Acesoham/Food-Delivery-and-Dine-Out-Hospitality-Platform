import { useState, useEffect } from 'react';
import { Star, TrendingUp, Gift, Loader2 } from 'lucide-react';
import { reviewApi } from '../../services/endpoints';
import type { LoyaltyInfo } from 'shared-types';
import './LoyaltyWidget.css';

const TIER_CONFIG = {
  Bronze:   { emoji: '🥉', color: '#cd7f32', bg: '#fdf3e7', next: 100 },
  Silver:   { emoji: '🥈', color: '#94a3b8', bg: '#f1f5f9', next: 500 },
  Gold:     { emoji: '🥇', color: '#f59e0b', bg: '#fffbeb', next: 1500 },
  Platinum: { emoji: '💎', color: '#8b5cf6', bg: '#f5f3ff', next: Infinity },
};

export const LoyaltyWidget = () => {
  const [info, setInfo] = useState<LoyaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await reviewApi.getUserPoints();
        setInfo(data.data);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="lw-card lw-loading">
        <Loader2 size={18} className="spin" />
        <span>Loading rewards…</span>
      </div>
    );
  }

  if (!info) return null;

  const tier = TIER_CONFIG[info.tier];

  return (
    <div className="lw-card" onClick={() => setExpanded((e) => !e)}>
      {/* ── Header ── */}
      <div className="lw-header">
        <div className="lw-tier-badge" style={{ background: tier.bg, borderColor: tier.color }}>
          <span className="lw-tier-emoji">{tier.emoji}</span>
          <div>
            <div className="lw-tier-name" style={{ color: tier.color }}>{info.tier} Member</div>
            <div className="lw-tier-sub">Review Rewards</div>
          </div>
        </div>

        <div className="lw-points-display">
          <span className="lw-pts-big" style={{ color: tier.color }}>
            {info.totalPoints.toLocaleString()}
          </span>
          <span className="lw-pts-unit">pts</span>
        </div>
      </div>

      {/* ── Progress to next tier ── */}
      {info.tier !== 'Platinum' && (
        <div className="lw-progress-section">
          <div className="lw-progress-label">
            <TrendingUp size={12} />
            <span>{info.nextTierPoints} pts to {nextTierName(info.tier)}</span>
          </div>
          <div className="lw-progress-track">
            <div
              className="lw-progress-fill"
              style={{ width: `${info.tierProgress}%`, background: tier.color }}
            />
          </div>
        </div>
      )}

      {/* ── Redemption hint ── */}
      <div className="lw-redeem-hint">
        <Gift size={13} />
        <span>Use points at checkout for discounts on your next order</span>
      </div>

      {/* ── Recent Awards (expandable) ── */}
      {expanded && info.recentAwards.length > 0 && (
        <div className="lw-recent" onClick={(e) => e.stopPropagation()}>
          <div className="lw-recent-title">Recent Earnings</div>
          {info.recentAwards.map((award, i) => (
            <div key={i} className="lw-recent-item">
              <Star size={12} className="lw-recent-icon" />
              <span className="lw-recent-reason">{award.reason}</span>
              <span className="lw-recent-pts">+{award.points} pts</span>
              <span className="lw-recent-date">
                {new Date(award.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {info.recentAwards.length > 0 && (
        <div className="lw-expand-hint">{expanded ? 'Hide history ▲' : 'Show recent earnings ▼'}</div>
      )}
    </div>
  );
};

const nextTierName = (current: string) => {
  const order = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const idx = order.indexOf(current);
  return order[idx + 1] || 'Platinum';
};
