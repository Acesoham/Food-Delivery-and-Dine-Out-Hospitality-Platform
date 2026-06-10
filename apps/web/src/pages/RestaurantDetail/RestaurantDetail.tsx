import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Phone, ArrowLeft, Plus, Minus, ShoppingCart, Loader2 } from 'lucide-react';
import { restaurantApi, reviewApi } from '../../services/endpoints';
import { useCartStore } from '../../store/cartStore';
import type { IRestaurant, IMenuItem, IReview } from 'shared-types';
import toast from 'react-hot-toast';

import './RestaurantDetail.css';

interface PopulatedReview extends Omit<IReview, 'consumerId'> {
  consumerId: {
    _id: string;
    profile: {
      firstName: string;
      lastName?: string;
      avatar?: string;
    };
  };
}

export const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [conflictItem, setConflictItem] = useState<IMenuItem | null>(null);
  const { addItem, clearCart, items } = useCartStore();

  // Tabs and Reviews State
  const [activeSubTab, setActiveSubTab] = useState<'menu' | 'reviews'>('menu');
  const [reviews, setReviews] = useState<PopulatedReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchRestaurant = async (restaurantId: string) => {
    try {
      const { data } = await restaurantApi.getById(restaurantId);
      setRestaurant(data.data.restaurant);
      setMenuItems(data.data.menuItems);
      // Also fetch public reviews
      fetchReviews(restaurantId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (restaurantId: string) => {
    setLoadingReviews(true);
    try {
      const { data } = await reviewApi.getForRestaurant(restaurantId);
      setReviews((data.data as unknown as PopulatedReview[]) || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    if (id) fetchRestaurant(id);
  }, [id]);

  const categories = ['All', ...new Set(menuItems.map((i) => i.category))];
  // Show all items so customers can see which ones are out of stock
  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((i) => i.category === selectedCategory);

  const handleAddToCart = (item: IMenuItem) => {
    if (!restaurant) return;
    const success = addItem({
      menuItemId: item._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
    });

    if (!success) {
      setConflictItem(item);
    } else {
      toast.success(`${item.name} added to cart`);
    }
  };

  const handleResolveConflict = () => {
    if (!conflictItem || !restaurant) return;
    clearCart();
    addItem({
      menuItemId: conflictItem._id,
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
      name: conflictItem.name,
      price: conflictItem.price,
      quantity: 1,
      image: conflictItem.image,
    });
    setConflictItem(null);
    toast.success('Cart updated with new item!');
  };

  const getItemQuantity = (menuItemId: string) => {
    return items.find((i) => i.menuItemId === menuItemId)?.quantity || 0;
  };

  if (loading) {
    return (
      <div className="page container">
        <div className="detail-skeleton">
          <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-lg)' }} />
          <div className="skeleton" style={{ height: 32, width: '60%', marginTop: 24 }} />
          <div className="skeleton" style={{ height: 20, width: '40%', marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="page container">
        <p>Restaurant not found.</p>
        <Link to="/discover" className="btn btn-primary">Back to Discover</Link>
      </div>
    );
  }

  return (
    <div className="restaurant-detail page">
      <div className="container">
        <Link to="/discover" className="back-link">
          <ArrowLeft size={18} /> Back to Discover
        </Link>

        {/* Header */}
        <div className="detail-header">
          <div className="detail-hero-img">
            <img
              src={restaurant.images?.[0] || ["/hero_slide_1.png", "/hero_slide_2.png", "/hero_slide_3.png"][restaurant._id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 3]}
              alt={restaurant.name}
            />
            <div className="detail-hero-overlay" />
          </div>
          <div className="detail-info">
            <h1>{restaurant.name}</h1>
            <p className="detail-cuisines">{restaurant.cuisineTypes.join(' • ')}</p>
            <div className="detail-meta">
              <span className="detail-rating">
                <Star size={16} fill="#fbbf24" stroke="#fbbf24" />
                {restaurant.rating.average} ({restaurant.rating.count} reviews)
              </span>
              <span><MapPin size={16} /> {restaurant.address.city}</span>
              <span><Clock size={16} /> 25-40 min</span>
              <span><Phone size={16} /> {restaurant.contact.phone}</span>
            </div>
            <p className="detail-description">{restaurant.description}</p>
          </div>
        </div>

        {/* Closed Banner */}
        {!restaurant.isActive && (
          <div className="restaurant-closed-banner">
            <span className="restaurant-closed-icon">🔴</span>
            <div>
              <strong>This restaurant is currently closed</strong>
              <p>You can still browse the menu, but ordering is unavailable right now.</p>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="detail-tabs">
          <button
            className={`detail-tab-btn ${activeSubTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('menu')}
          >
            🍴 Menu
          </button>
          <button
            className={`detail-tab-btn ${activeSubTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('reviews')}
          >
            ⭐ Reviews ({reviews.length})
          </button>
        </div>

        {activeSubTab === 'menu' ? (
          /* Menu Section */
          <div className="menu-section animate-fade-in">
            <div className="menu-categories">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="menu-grid">
              {filteredItems.map((item) => {
                const qty = getItemQuantity(item._id);
                const isOutOfStock = !item.isAvailable;
                return (
                  <div key={item._id} className={`menu-item-card ${isOutOfStock ? 'menu-item-out-of-stock' : ''}`}>
                    <div className="menu-item-info">
                      <div className="menu-item-tags">
                        {isOutOfStock && (
                          <span className="tag tag-out-of-stock">Out of Stock</span>
                        )}
                        {item.tags.map((t) => (
                          <span key={t} className={`tag ${t === 'veg' ? 'tag-veg' : t === 'non-veg' ? 'tag-nonveg' : ''}`}>
                            {t}
                          </span>
                        ))}
                      </div>
                      <h3 style={{ color: isOutOfStock ? 'var(--text-muted)' : undefined }}>{item.name}</h3>
                      <p className="menu-item-desc">{item.description}</p>
                      <div className="menu-item-bottom">
                        <span className="menu-item-price">₹{item.price}</span>
                        <span className="menu-item-time"><Clock size={12} /> {item.preparationTime} min</span>
                      </div>
                    </div>
                    <div className="menu-item-action">
                      {isOutOfStock ? (
                        <button className="btn btn-sm add-btn" disabled style={{ opacity: 0.45, cursor: 'not-allowed', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          Unavailable
                        </button>
                      ) : qty > 0 ? (
                        <div className="quantity-control">
                          <button className="qty-btn" onClick={() => {
                            const cartStore = useCartStore.getState();
                            cartStore.updateQuantity(item._id, qty - 1);
                          }}>
                            <Minus size={14} />
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button className="qty-btn" onClick={() => handleAddToCart(item)}>
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button className="btn btn-primary btn-sm add-btn" onClick={() => handleAddToCart(item)}>
                          <Plus size={14} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Reviews Section */
          <div className="reviews-section animate-fade-in">
            {loadingReviews ? (
              <div className="reviews-loading">
                <Loader2 className="spin" size={24} />
                <span>Loading reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="reviews-empty">
                <p>No reviews yet for this restaurant. Be the first to order and review!</p>
              </div>
            ) : (
              <div className="reviews-list-public">
                {reviews.map((rev) => (
                  <div key={rev._id} className="public-review-card">
                    <div className="pr-header">
                      <div className="pr-user-info">
                        <div className="pr-avatar">
                          {rev.consumerId?.profile?.avatar ? (
                            <img src={rev.consumerId.profile.avatar} alt="avatar" />
                          ) : (
                            <span>{(rev.consumerId?.profile?.firstName || 'U')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="pr-name">
                            {rev.consumerId?.profile?.firstName || 'User'}{' '}
                            {rev.consumerId?.profile?.lastName ? `${rev.consumerId.profile.lastName[0]}.` : ''}
                          </div>
                          <div className="pr-date">
                            {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pr-meta-right">
                        {/* 🏆 Earned Review Points Badge */}
                        <div className="pr-points-badge" title="Points awarded for writing this high-quality review">
                          🏆 +{rev.pointsAwarded || 10} pts
                        </div>
                        {rev.isVerified && (
                          <span className="pr-verified-badge" title="Verified Order Review">
                            Verified Review
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pr-rating-row">
                      <div className="pr-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            fill={i < rev.rating ? '#fbbf24' : 'none'}
                            color={i < rev.rating ? '#fbbf24' : 'var(--border)'}
                          />
                        ))}
                      </div>
                      {rev.nlpAnalysis?.sentimentLabel && (
                        <span className={`pr-sentiment-tag sentiment-${rev.nlpAnalysis.sentimentLabel}`}>
                          {rev.nlpAnalysis.sentimentLabel === 'positive' ? '😊 Positive' :
                            rev.nlpAnalysis.sentimentLabel === 'negative' ? '😞 Negative' : '😐 Neutral'}
                        </span>
                      )}
                    </div>

                    <p className="pr-text">{rev.text}</p>

                    {/* Extracted NLP Keywords */}
                    {rev.nlpAnalysis?.extractedKeywords && rev.nlpAnalysis.extractedKeywords.length > 0 && (
                      <div className="pr-keywords">
                        {rev.nlpAnalysis.extractedKeywords.map((kw, i) => (
                          <span key={i} className="pr-keyword-chip">#{kw}</span>
                        ))}
                      </div>
                    )}

                    {/* Media images grid */}
                    {rev.media && rev.media.length > 0 && (
                      <div className="pr-media-grid">
                        {rev.media.map((url, i) => (
                          <div key={i} className="pr-media-thumb">
                            <img src={url} alt={`Review photo ${i + 1}`} onClick={() => window.open(url, '_blank')} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Floating Cart */}
        {items.length > 0 && (
          <Link to="/cart" className="floating-cart">
            <ShoppingCart size={20} />
            <span>{items.length} item(s) in cart</span>
            <span className="floating-cart-total">
              ₹{items.reduce((s, i) => s + i.price * i.quantity, 0)}
            </span>
          </Link>
        )}

        {/* Cart Conflict Modal */}
        {conflictItem && (
          <div className="cart-conflict-overlay" onClick={() => setConflictItem(null)}>
            <div className="cart-conflict-card" onClick={(e) => e.stopPropagation()}>
              <h3>Start a new cart?</h3>
              <p>Your cart contains items from a different restaurant. Would you like to clear the cart and add this item instead?</p>
              <div className="cart-conflict-actions">
                <button className="btn btn-ghost" onClick={() => setConflictItem(null)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleResolveConflict} style={{ flex: 1 }}>
                  Clear & Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
