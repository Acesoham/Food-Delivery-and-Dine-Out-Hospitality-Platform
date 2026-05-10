import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Store, Package, Settings, UtensilsCrossed, Loader2, Plus, Edit2, Trash2 } from 'lucide-react';
import { restaurantApi, orderApi } from '../../services/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { IRestaurant, IMenuItem, IOrder } from 'shared-types';
import toast from 'react-hot-toast';
import './Dashboard.css';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'merchant') return;
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: myRests } = await restaurantApi.getMyRestaurants();
      if (myRests.data.length > 0) {
        const rest = myRests.data[0];
        setRestaurant(rest);
        
        // Fetch menus and orders
        const [menuRes, ordersRes] = await Promise.all([
          restaurantApi.getMenu(rest._id),
          orderApi.getRestaurantOrders(rest._id)
        ]);
        
        setMenuItems(menuRes.data.data);
        setOrders(ordersRes.data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, { status: status as any });
      toast.success('Order status updated');
      setOrders(orders.map(o => o._id === orderId ? { ...o, status: status as any } : o));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    if (!restaurant) return;
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await restaurantApi.deleteMenuItem(restaurant._id, itemId);
      toast.success('Menu item deleted');
      setMenuItems(menuItems.filter(i => i._id !== itemId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete item');
    }
  };

  if (user?.role !== 'merchant') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="page container dashboard-loading">
        <Loader2 size={32} className="spin" />
        <p>Loading merchant dashboard...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="page container">
        <div className="empty-dashboard">
          <Store size={48} />
          <h2>Welcome to the Merchant Dashboard</h2>
          <p>You haven't set up a restaurant yet.</p>
          <button className="btn btn-primary" onClick={() => toast.success('Add restaurant form would go here!')}>
            Create Restaurant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page page">
      <div className="container">
        <div className="dashboard-header">
          <h1>{restaurant.name} Dashboard</h1>
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={18} /> Orders
            </button>
            <button 
              className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
              onClick={() => setActiveTab('menu')}
            >
              <UtensilsCrossed size={18} /> Menu Items
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {activeTab === 'orders' && (
            <div className="dashboard-orders">
              <div className="section-header">
                <h2>Recent Orders</h2>
              </div>
              {orders.length === 0 ? (
                <p className="text-muted">No orders received yet.</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td>{order.orderNumber}</td>
                          <td>{(order.consumerId as any)?.profile?.firstName || 'Customer'}</td>
                          <td>{order.items.length} items</td>
                          <td>₹{order.total}</td>
                          <td>
                            <span className={`badge status-${order.status}`}>{order.status}</span>
                          </td>
                          <td>
                            <select 
                              className="input select-sm"
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="dashboard-menu">
              <div className="section-header">
                <h2>Menu Management</h2>
                <button className="btn btn-primary btn-sm" onClick={() => toast.success('Add menu item modal would open')}>
                  <Plus size={16} /> Add Item
                </button>
              </div>
              
              <div className="menu-grid-admin">
                {menuItems.map(item => (
                  <div key={item._id} className="menu-admin-card card">
                    <div className="menu-admin-info">
                      <h3>{item.name}</h3>
                      <p className="text-muted">{item.category} • ₹{item.price}</p>
                    </div>
                    <div className="menu-admin-actions">
                      <button className="btn-icon btn-ghost"><Edit2 size={16} /></button>
                      <button className="btn-icon text-danger" onClick={() => deleteMenuItem(item._id)}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="dashboard-settings card">
              <div className="card-body">
                <h2>Restaurant Settings</h2>
                <div className="settings-form">
                  <div className="input-group">
                    <label>Restaurant Name</label>
                    <input type="text" className="input" defaultValue={restaurant.name} />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea className="input" defaultValue={restaurant.description} rows={4} />
                  </div>
                  <div className="input-group">
                    <label>Contact Phone</label>
                    <input type="text" className="input" defaultValue={restaurant.contact.phone} />
                  </div>
                  <button className="btn btn-primary" onClick={() => toast.success('Settings updated')}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
