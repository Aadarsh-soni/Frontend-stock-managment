// src/app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Navigation } from "@/components/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart3, TrendingUp, DollarSign, Download } from "lucide-react";

type ReportType = "stock" | "cogs" | "valuation";

/* ---------------- utilities ---------------- */
const toNum = (v: unknown, fallback = 0) => {
  const n =
    typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};
const money = (v: unknown) => `$${toNum(v, 0).toFixed(2)}`;

/* ---------------- tolerant raw row ---------------- */
type Raw = {
  id?: string;
  sku?: string;
  name?: string;
  productName?: string;
  qty?: unknown;
  quantity?: unknown;
  totalSold?: unknown;
  unitCost?: unknown;
  avgCost?: unknown;
  totalCost?: unknown;
  totalRevenue?: unknown;
  grossProfit?: unknown;
  totalValue?: unknown;
  value?: unknown;
  warehouseCode?: string;
  warehouse?: { code?: string; name?: string } | null;
};

/* normalizers to the shapes your table expects */
const normStock = (r: Raw, i: number) => {
  const sku = r.sku ?? "";
  const productName = r.productName ?? r.name ?? "";
  const warehouseCode = r.warehouseCode ?? r.warehouse?.code ?? "";
  const qty = toNum(r.qty ?? r.quantity);
  const unitCost = toNum(r.unitCost ?? r.avgCost);
  const totalValue = toNum(r.totalValue ?? r.value ?? qty * unitCost);
  return {
    id: r.id ?? (sku && warehouseCode ? `${sku}|${warehouseCode}` : `stock-${i}`),
    sku,
    productName,
    warehouseCode,
    qty,
    unitCost,
    totalValue,
  };
};

const normCOGS = (r: Raw, i: number) => {
  const sku = r.sku ?? "";
  const productName = r.productName ?? r.name ?? "";
  const totalSold = toNum(r.totalSold ?? r.qty ?? r.quantity);
  const totalCost = toNum(r.totalCost);
  const totalRevenue = toNum(r.totalRevenue);
  const grossProfit = toNum(r.grossProfit ?? totalRevenue - totalCost);
  return {
    id: r.id ?? (sku ? `cogs-${sku}-${i}` : `cogs-${i}`),
    sku,
    productName,
    totalSold,
    totalCost,
    totalRevenue,
    grossProfit,
  };
};

const normValuation = (r: Raw, i: number) => {
  const sku = r.sku ?? "";
  const productName = r.productName ?? r.name ?? "";
  const totalStock = toNum(r.quantity ?? r.qty);
  const avgCost = toNum(r.avgCost ?? r.unitCost);
  const totalValue = toNum(r.totalValue ?? r.value ?? totalStock * avgCost);
  return {
    id: r.id ?? (sku ? `val-${sku}-${i}` : `val-${i}`),
    sku,
    productName,
    totalStock,
    avgCost,
    totalValue,
  };
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>("stock");

  const [stockReport, setStockReport] = useState<ReturnType<typeof normStock>[]>([]);
  const [cogsReport, setCogsReport] = useState<ReturnType<typeof normCOGS>[]>([]);
  const [valuationReport, setValuationReport] = useState<ReturnType<typeof normValuation>[]>([]);

  // if backend sent an aggregate (e.g., valuation.totalValue or cogs.totals.profit)
  const [serverTotal, setServerTotal] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);

  async function fetchReport(type: ReportType) {
    setLoading(true);
    setServerTotal(null);
    try {
      // accept either Array or { rows, ... }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = await apiFetch<any>(`/reports/${type}`);
      const rows: Raw[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.rows)
        ? payload.rows
        : [];

      if (type === "stock") {
        setStockReport(rows.map(normStock));
        // compute total locally
        const total = rows.map(normStock).reduce((s, r) => s + r.totalValue, 0);
        setServerTotal(total);
      } else if (type === "cogs") {
        setCogsReport(rows.map(normCOGS));
        // prefer server totals if present
        const profit = toNum(payload?.totals?.profit, NaN);
        setServerTotal(Number.isFinite(profit) ? profit : rows.map(normCOGS).reduce((s, r) => s + r.grossProfit, 0));
      } else {
        // valuation
        setValuationReport(rows.map(normValuation));
        const totalVal = toNum(payload?.totalValue, NaN);
        setServerTotal(Number.isFinite(totalVal) ? totalVal : rows.map(normValuation).reduce((s, r) => s + r.totalValue, 0));
      }
    } catch {
      toast.error(`Failed to fetch ${type} report`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchReport(activeReport);
  }, [activeReport]);

  const totalValueDisplay =
    activeReport === "stock"
      ? stockReport.reduce((s, r) => s + r.totalValue, 0)
      : activeReport === "cogs"
      ? cogsReport.reduce((s, r) => s + r.grossProfit, 0)
      : valuationReport.reduce((s, r) => s + r.totalValue, 0);

  const grandTotal = serverTotal ?? totalValueDisplay;

  /* -------------- tables -------------- */
  const renderStock = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Warehouse</TableHead>
          <TableHead className="text-right">Quantity</TableHead>
          <TableHead className="text-right">Unit Cost</TableHead>
          <TableHead className="text-right">Total Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stockReport.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-medium">{it.sku}</TableCell>
            <TableCell>{it.productName}</TableCell>
            <TableCell>{it.warehouseCode}</TableCell>
            <TableCell className="text-right">{it.qty}</TableCell>
            <TableCell className="text-right">{money(it.unitCost)}</TableCell>
            <TableCell className="text-right">{money(it.totalValue)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderCOGS = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Total Sold</TableHead>
          <TableHead className="text-right">Total Cost</TableHead>
          <TableHead className="text-right">Total Revenue</TableHead>
          <TableHead className="text-right">Gross Profit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cogsReport.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-medium">{it.sku}</TableCell>
            <TableCell>{it.productName}</TableCell>
            <TableCell className="text-right">{it.totalSold}</TableCell>
            <TableCell className="text-right">{money(it.totalCost)}</TableCell>
            <TableCell className="text-right">{money(it.totalRevenue)}</TableCell>
            <TableCell className="text-right">{money(it.grossProfit)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderValuation = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Total Stock</TableHead>
          <TableHead className="text-right">Avg Cost</TableHead>
          <TableHead className="text-right">Total Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {valuationReport.map((it) => (
          <TableRow key={it.id}>
            <TableCell className="font-medium">{it.sku}</TableCell>
            <TableCell>{it.productName}</TableCell>
            <TableCell className="text-right">{it.totalStock}</TableCell>
            <TableCell className="text-right">{money(it.avgCost)}</TableCell>
            <TableCell className="text-right">{money(it.totalValue)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="flex h-screen">
      <Navigation />
      <div className="flex-1 p-6 bg-gray-50">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Analytics and insights for your business</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button
            variant={activeReport === "stock" ? "default" : "outline"}
            onClick={() => setActiveReport("stock")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stock Report
          </Button>
          <Button
            variant={activeReport === "cogs" ? "default" : "outline"}
            onClick={() => setActiveReport("cogs")}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            COGS Report
          </Button>
          <Button
            variant={activeReport === "valuation" ? "default" : "outline"}
            onClick={() => setActiveReport("valuation")}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Valuation Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Report Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{activeReport}</div>
              <p className="text-xs text-muted-foreground">Current report</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{money(grandTotal)}</div>
              <p className="text-xs text-muted-foreground">Calculated / server total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading report...</div>
            ) : (
              <div className="overflow-x-auto">
                {activeReport === "stock" && renderStock()}
                {activeReport === "cogs" && renderCOGS()}
                {activeReport === "valuation" && renderValuation()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}