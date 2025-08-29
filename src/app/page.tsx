"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { AuthRedirect } from "./auth-redirect";
import { useAuth } from "@/contexts/auth-context";
import { Package, Warehouse, Users, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

type DashboardStats = {
  totalProducts: number;
  totalWarehouses: number;
  totalSuppliers: number;
  totalSales: number;
  totalPurchases: number;
  lowStockItems: number;
};

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, warehouses, suppliers, sales] = await Promise.all([
          apiFetch<{ id: string; name: string; sku: string }[]>("/products"),
          apiFetch<{ id: string; name: string; code: string }[]>("/warehouses"),
          apiFetch<{ id: string; name: string; phone: string }[]>("/suppliers"),
          apiFetch<{ id: string; billNo: string; docDate: string }[]>("/sales/list"),
        ]);

        setStats({
          totalProducts: products.length,
          totalWarehouses: warehouses.length,
          totalSuppliers: suppliers.length,
          totalSales: sales.length,
          totalPurchases: 0, // Will be updated when purchases API is available
          lowStockItems: 0, // Will be updated when stock API is available
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (authLoading) {
    return <AuthRedirect />;
  }

  if (!user) {
    return <AuthRedirect />;
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen">
          <Navigation />
          <div className="flex-1 p-6">
            <div className="text-center">Loading dashboard...</div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen">
        <Navigation />
        <div className="flex-1 p-6 bg-gray-50">
          <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your stock management system</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground">Active products in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalWarehouses || 0}</div>
              <p className="text-xs text-muted-foreground">Storage locations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSuppliers || 0}</div>
              <p className="text-xs text-muted-foreground">Active suppliers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
              <p className="text-xs text-muted-foreground">Sales transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.lowStockItems || 0}</div>
              <p className="text-xs text-muted-foreground">Items below reorder level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
              <p className="text-xs text-muted-foreground">Purchase transactions</p>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}