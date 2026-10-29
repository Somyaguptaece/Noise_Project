import React, { useState, useEffect } from 'react';
import { customerService, orderService } from '../services/dashboardService.js';
import { Card } from '../components/common/Card.jsx';
import { Button } from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/Skeleton.jsx';
import { formatDate, formatCurrency } from '../utils/formatters.js';
import {
  ShoppingBag,
  Users,
  Search,
  Truck,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export function OrdersCustomersPage() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'customers'
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'orders') {
      orderService.getOrders({ search, limit: 30 })
        .then((res) => setOrders(res.data.orders))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      customerService.getCustomers({ search, limit: 30 })
        .then((res) => setCustomers(res.data.customers))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [activeTab, search]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-600" />
            <span>Orders & Customer Records</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified database records used by the AI engine to ground warranty validity and return windows.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('orders'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Orders Database
          </button>
          <button
            onClick={() => { setActiveTab('customers'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Customer Directory
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === 'orders'
              ? 'Search by Order # (e.g. NOISE-ORD-90212), tracking, customer...'
              : 'Search customer name, email, or external ID...'
          }
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
        />
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : activeTab === 'orders' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Order Number</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Product & Sku</th>
                  <th className="px-5 py-3.5">Purchase Date</th>
                  <th className="px-5 py-3.5">Delivery Status</th>
                  <th className="px-5 py-3.5">Carrier / Tracking</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{order.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">{order.customer?.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{order.product?.name}</div>
                      <div className="font-mono text-[10px] text-slate-400">{order.product?.sku}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {formatDate(order.purchaseDate)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.orderStatus === 'IN_TRANSIT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-800">{order.carrier || 'Standard Courier'}</div>
                      <div className="font-mono text-[10px] text-slate-400">{order.trackingNumber || 'Pending'}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(order.orderAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Customer ID</th>
                  <th className="px-5 py-3.5">Full Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5">Tier</th>
                  <th className="px-5 py-3.5 text-right">Orders Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      {cust.externalId}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {cust.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {cust.email}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {cust.phone || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          cust.tier === 'VIP'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {cust.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {cust._count?.orders ?? cust.orders?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
