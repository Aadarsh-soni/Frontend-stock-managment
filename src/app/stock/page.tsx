// src/app/stock/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigation } from "@/components/navigation";
import { Package, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/** ---- Types that cover various backend shapes ---- */
type RawStock = {
  id?: string;
  sku?: string;
  productName?: string;
  name?: string;
  product?: { sku?: string; name?: string; unit?: string; reorderLevel?: number | string | null };
  warehouseCode?: string;
  warehouseName?: string;
  warehouse?: { code?: string; name?: string };
  qty?: number | string | null;
  qtyOnHand?: number | string | null;
  quantity?: number | string | null;
  unit?: string;
  reorderLevel?: number | string | null;
};

type StockLevel = {
  id: string;
  sku: string;
  productName: string;
  warehouseCode: string;
  warehouseName: string;
  qty: number;
  reorderLevel: number;
  unit: string;
};

/** ---- Helpers ---- */
function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function normalizeStock(row: RawStock, idx: number): StockLevel {
  const sku = row.sku ?? row.product?.sku ?? "";
  const productName = row.productName ?? row.product?.name ?? row.name ?? "";
  const warehouseCode = row.warehouseCode ?? row.warehouse?.code ?? "";
  const warehouseName = row.warehouseName ?? row.warehouse?.name ?? "";

  const qty = toNumber(row.qty ?? row.qtyOnHand ?? row.quantity, 0);
  const reorderLevel = toNumber(row.reorderLevel ?? row.product?.reorderLevel, 0);
  const unit = row.unit ?? row.product?.unit ?? "";

  // ✅ precedence fixed with parentheses; stable key guaranteed
  const id =
    row.id ??
    (sku && warehouseCode ? `${sku}|${warehouseCode}` : `row-${idx}`);

  return { id, sku, productName, warehouseCode, warehouseName, qty, reorderLevel, unit };
}

/** ---- Page ---- */
export default function StockPage() {
  const [stock, setStock] = useState<StockLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<RawStock[]>("/stock");
        setStock((data ?? []).map(normalizeStock));
      } catch {
        toast.error("Failed to fetch stock levels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalItems = stock.length;
  const totalQuantity = stock.reduce((s, r) => s + toNumber(r.qty, 0), 0);
  const lowStock = stock.filter((r) => toNumber(r.qty, 0) <= toNumber(r.reorderLevel, 0));

  return (
    <div className="flex h-screen">
      <Navigation />
      <div className="flex-1 p-6 bg-gray-50">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Stock Levels</h1>
          <p className="text-gray-600">Current inventory across all warehouses</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">Products in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity}</div>
              <p className="text-xs text-muted-foreground">Units in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStock.length}</div>
              <p className="text-xs text-muted-foreground">Below reorder level</p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading stock levels...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Reorder Level</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stock.map((item) => {
                    const qty = toNumber(item.qty, 0);
                    const rl = toNumber(item.reorderLevel, 0);
                    const low = qty <= rl;

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.sku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>
                          {item.warehouseName}{" "}
                          {item.warehouseCode ? `(${item.warehouseCode})` : ""}
                        </TableCell>
                        <TableCell className="text-right">{qty}</TableCell>
                        <TableCell className="text-right">{rl}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              low ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {low ? "Low Stock" : "In Stock"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}