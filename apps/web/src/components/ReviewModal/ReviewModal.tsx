import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, Upload, Loader2, Sparkles, Camera, ChevronUp, ChevronDown, Check, Bike } from 'lucide-react';
import { reviewApi } from '../../services/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { ReviewType, PointsBreakdown, ReviewPrompt } from 'shared-types';
import toast from 'react-hot-toast';
import './ReviewModal.css';

export interface ReviewTarget {
  reviewType: ReviewType;
  entityId: string;           // orderId | reservationId | eventBookingId
  entityName: string;         // restaurant name / event name / "Delivery by <name>"
  restaurantId?: string;
  deliveryPersonName?: string;
}

interface ReviewModalProps {
  target: ReviewTarget;
  onClose: () => void;
  onSuccess?: (points: number) => void;
}

const TIER_COLORS: Record<string, string> = {
  Bronze:   '#cd7f32',
  Silver:   '#c0c0c0',
  Gold:     '#fbbf24',
  Platinum: '#a78bfa',
};

const EMPTY_BREAKDOWN: PointsBreakdown = {
  base: 10, wordBonus: 0, keywordBonus: 0,
  mediaBonus: 0, detailBonus: 0, sentimentBonus: 0, ratingBonus: 0, total: 10,
};

export const ReviewModal = ({ target, onClose, onSuccess }: ReviewModalProps) => {
  const updateLoyaltyPoints = useAuthStore((s) => s.updateLoyaltyPoints);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // AI prompts & keyword suggestions
  const [prompts, setPrompts] = useState<ReviewPrompt[]>([]);
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([]);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);

  // Live points preview
  const [breakdown, setBreakdown] = useState<PointsBreakdown>(EMPTY_BREAKDOWN);
  const [loadingPoints, setLoadingPoints] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const textareaRef = useRef<HTMLTextAreaElement>(null);


  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // ── Load AI prompts on mount ──────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingPrompts(true);
      try {
        const { data } = await reviewApi.getAiPrompts(target.entityId, target.reviewType);
        setPrompts(data.data.prompts || []);
        setSuggestedKeywords(data.data.suggestedKeywords || []);
      } catch {
        // Silently ignore — prompts are optional
      } finally {
        setLoadingPrompts(false);
      }
    };
    load();
  }, [target.entityId, target.reviewType]);

  // ── Live points preview (debounced) ──────────────────────────
  const fetchPointsPreview = useCallback(async (currentText: string, currentRating: number, currentMedia: string[]) => {
    if (!currentText.trim() || currentText.trim().split(/\s+/).length < 2) {
      setBreakdown(EMPTY_BREAKDOWN);
      return;
    }
    setLoadingPoints(true);
    try {
      const { data } = await reviewApi.previewPoints(currentText, currentRating || 3, currentMedia);
      setBreakdown(data.data);
    } catch {
      // ignore
    } finally {
      setLoadingPoints(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPointsPreview(text, rating, mediaPreviews);
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [text, rating, mediaPreviews, fetchPointsPreview]);

  // ── Append keyword to text ────────────────────────────────────
  const appendKeyword = (keyword: string) => {
    const lower = keyword.toLowerCase();
    if (text.toLowerCase().includes(lower)) return; // already in text
    const newText = text ? `${text.trimEnd()} ${keyword}` : keyword;
    setText(newText);
    textareaRef.current?.focus();
  };

  // ── Handle media upload ────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - mediaFiles.length;
    const toAdd = files.slice(0, remaining);
    setMediaFiles((prev) => [...prev, ...toAdd]);
    const previews = toAdd.map((f) => URL.createObjectURL(f));
    setMediaPreviews((prev) => [...prev, ...previews]);
  };

  const removeMedia = (idx: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (rating === 0) { toast.error('Please select a star rating'); return; }
    if (text.trim().length < 10) { toast.error('Review must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      const payload: any = {
        reviewType: target.reviewType,
        rating,
        text: text.trim(),
      };
      if (target.restaurantId) payload.restaurantId = target.restaurantId;
      if (target.reviewType === 'order') payload.orderId = target.entityId;
      else if (target.reviewType === 'delivery_person') payload.orderId = target.entityId;
      else if (target.reviewType === 'reservation') payload.reservationId = target.entityId;
      else if (target.reviewType === 'event') payload.eventBookingId = target.entityId;

      if (mediaPreviews.length) payload.media = mediaPreviews;

      const { data } = await reviewApi.submit(payload);
      const pts = data.data.points.total;
      setEarnedPoints(pts);
      setSubmitted(true);
      onSuccess?.(pts);
      // Refresh live loyalty points in Navbar
      try {
        const { data: lpData } = await reviewApi.getUserPoints();
        updateLoyaltyPoints(lpData.data.totalPoints);
      } catch { /* silent */ }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="rm-overlay" onClick={onClose}>
        <div className="rm-card rm-success-card" onClick={(e) => e.stopPropagation()}>
          <div className="rm-confetti">🎉</div>
          <h2 className="rm-success-title">Review Submitted!</h2>
          <div className="rm-points-badge">
            <span className="rm-pts-number">+{earnedPoints}</span>
            <span className="rm-pts-label">loyalty points earned</span>
          </div>
          <p className="rm-success-sub">Your points have been added to your account and can be used in future orders.</p>
          <button className="btn btn-primary rm-done-btn" onClick={onClose}>
            <Check size={18} /> Done
          </button>
        </div>
      </div>
    );
  }

  const progressPct = Math.min((breakdown.total / 90) * 100, 100);
  const pointsColor = breakdown.total >= 70 ? '#10b981' : breakdown.total >= 40 ? '#f59e0b' : '#f97316';

  return (
    <div className="rm-overlay" onClick={onClose}>
      <div className="rm-card" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="rm-header">
          <div className="rm-header-left">
            {target.reviewType === 'delivery_person' && <Bike size={18} className="rm-type-icon" />}
            <div>
              <h2 className="rm-title">
                {target.reviewType === 'delivery_person' ? 'Rate Delivery Partner' :
                 target.reviewType === 'reservation' ? 'Rate Your Dine-In' :
                 target.reviewType === 'event' ? 'Rate This Event' : 'Write a Review'}
              </h2>
              <p className="rm-entity-name">{target.entityName}</p>
            </div>
          </div>
          <button className="rm-close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="rm-body">

          {/* ── Star Rating ── */}
          <div className="rm-section">
            <label className="rm-label">Your Rating</label>
            <div className="rm-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`rm-star ${(hoverRating || rating) >= star ? 'active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  aria-label={`${star} stars`}
                >
                  <Star size={32} fill={(hoverRating || rating) >= star ? 'currentColor' : 'none'} />
                </button>
              ))}
              {rating > 0 && (
                <span className="rm-rating-label">
                  {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][rating]}
                </span>
              )}
            </div>
          </div>

          {/* ── AI Prompts ── */}
          <div className="rm-section rm-prompts-section">
            <div className="rm-prompts-header" onClick={() => setShowPrompts((p) => !p)}>
              <div className="rm-prompts-title">
                <Sparkles size={15} />
                <span>AI Suggestions to guide your review</span>
              </div>
              {showPrompts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
            {showPrompts && (
              <div className="rm-prompts-body">
                {loadingPrompts ? (
                  <div className="rm-prompts-loading"><Loader2 size={14} className="spin" /> Loading suggestions…</div>
                ) : prompts.length > 0 ? (
                  <div className="rm-prompt-list">
                    {prompts.map((p, i) => (
                      <p key={i} className="rm-prompt-item">💬 {p.question}</p>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* ── Text Area ── */}
          <div className="rm-section">
            <div className="rm-label-row">
              <label className="rm-label">Your Review</label>
              <span className={`rm-wordcount ${wordCount >= 100 ? 'wc-great' : wordCount >= 50 ? 'wc-good' : ''}`}>
                {wordCount} word{wordCount !== 1 ? 's' : ''}
                {wordCount >= 100 ? ' 🔥' : wordCount >= 50 ? ' ✅' : wordCount >= 20 ? ' 👍' : ''}
              </span>
            </div>
            <textarea
              ref={textareaRef}
              className="rm-textarea"
              placeholder="Share your honest experience — what did you love, what could be better?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              id="review-text"
            />
          </div>

          {/* ── Keyword Suggestions ── */}
          {suggestedKeywords.length > 0 && (
            <div className="rm-section">
              <label className="rm-label">✨ Suggested Keywords — click to add</label>
              <div className="rm-keyword-chips">
                {suggestedKeywords.map((kw) => {
                  const used = text.toLowerCase().includes(kw.toLowerCase());
                  return (
                    <button
                      key={kw}
                      className={`rm-chip ${used ? 'rm-chip--used' : ''}`}
                      onClick={() => appendKeyword(kw)}
                      disabled={used}
                    >
                      {used ? <Check size={11} /> : null}
                      {kw}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Media Upload ── */}
          <div className="rm-section">
            <div className="rm-label-row">
              <label className="rm-label">Photos (optional — earns +15 pts)</label>
              <span className="rm-media-count">{mediaFiles.length}/5</span>
            </div>
            <div className="rm-media-grid">
              {mediaPreviews.map((src, i) => (
                <div key={i} className="rm-media-thumb">
                  <img src={src} alt={`upload ${i + 1}`} />
                  <button className="rm-media-remove" onClick={() => removeMedia(i)}>
                    <X size={12} />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 5 && (
                <button className="rm-media-add" onClick={() => fileInputRef.current?.click()}>
                  <Camera size={20} />
                  <span>Add Photo</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileChange}
              id="review-media-upload"
            />
          </div>

          {/* ── Points Preview ── */}
          <div className="rm-points-panel">
            <div className="rm-points-header">
              <span className="rm-points-label">
                {loadingPoints ? <Loader2 size={12} className="spin" /> : null}
                You'll earn
              </span>
              <span className="rm-points-value" style={{ color: pointsColor }}>
                {breakdown.total} pts
              </span>
              <span className="rm-points-max">/ 90</span>
            </div>

            {/* Progress bar */}
            <div className="rm-progress-track">
              <div
                className="rm-progress-fill"
                style={{ width: `${progressPct}%`, background: pointsColor }}
              />
            </div>

            {/* Breakdown */}
            <div className="rm-breakdown">
              <BreakdownItem label="Base" value={breakdown.base} max={10} />
              <BreakdownItem label="Detail" value={breakdown.detailBonus} max={5} />
              <BreakdownItem label="Length" value={breakdown.wordBonus} max={30} />
              <BreakdownItem label="Keywords" value={breakdown.keywordBonus} max={20} />
              <BreakdownItem label="Photos" value={breakdown.mediaBonus} max={15} />
              <BreakdownItem label="Sentiment" value={breakdown.sentimentBonus} max={5} />
              <BreakdownItem label="5-Star" value={breakdown.ratingBonus} max={5} />
            </div>
          </div>

          {/* ── Submit ── */}
          <button
            className="btn btn-primary rm-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            id="review-submit-btn"
          >
            {submitting ? (
              <><Loader2 size={18} className="spin" /> Submitting…</>
            ) : (
              <><Upload size={18} /> Submit Review · Earn {breakdown.total} pts</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Small breakdown bar item ──────────────────────────────────────
const BreakdownItem = ({ label, value, max }: { label: string; value: number; max: number }) => (
  <div className="rm-bd-item">
    <span className="rm-bd-label">{label}</span>
    <div className="rm-bd-track">
      <div
        className="rm-bd-fill"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
    <span className={`rm-bd-value ${value > 0 ? 'active' : ''}`}>+{value}</span>
  </div>
);
