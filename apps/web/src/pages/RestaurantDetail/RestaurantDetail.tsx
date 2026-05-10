import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, MapPin, Clock, Phone, ArrowLeft, Plus, Minus, ShoppingCart } from 'lucide-react';
import { restaurantApi } from '../../services/endpoints';
import { useCartStore } from '../../store/cartStore';
import type { IRestaurant, IMenuItem } from 'shared-types';
import toast from 'react-hot-toast';
import './RestaurantDetail.css';

export const RestaurantDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addItem, clearCart, items } = useCartStore();

  useEffect(() => {
    if (id) fetchRestaurant(id);
  }, [id]);

  const fetchRestaurant = async (restaurantId: string) => {
    try {
      const { data } = await restaurantApi.getById(restaurantId);
      setRestaurant(data.data.restaurant);
      setMenuItems(data.data.menuItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(menuItems.map((i) => i.category))];
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
      if (window.confirm('Your cart has items from another restaurant. Clear cart and add this item?')) {
        clearCart();
        addItem({
          menuItemId: item._id,
          restaurantId: restaurant._id,
          restaurantName: restaurant.name,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
        });
        toast.success('Cart updated!');
      }
    } else {
      toast.success(`${item.name} added to cart`);
    }
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
              src={restaurant.images?.[0] || `https://picsum.photos/seed/${restaurant._id}/1200/400`}
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

        {/* Menu */}
        <div className="menu-section">
          <h2>Menu</h2>

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
              return (
                <div key={item._id} className="menu-item-card">
                  <div className="menu-item-info">
                    <div className="menu-item-tags">
                      {item.tags.map((t) => (
                        <span key={t} className={`tag ${t === 'veg' ? 'tag-veg' : t === 'non-veg' ? 'tag-nonveg' : ''}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                    <h3>{item.name}</h3>
                    <p className="menu-item-desc">{item.description}</p>
                    <div className="menu-item-bottom">
                      <span className="menu-item-price">₹{item.price}</span>
                      <span className="menu-item-time"><Clock size={12} /> {item.preparationTime} min</span>
                    </div>
                  </div>
                  <div className="menu-item-action">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="menu-item-img" />
                    )}
                    {qty > 0 ? (
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
      </div>
    </div>
  );
};
