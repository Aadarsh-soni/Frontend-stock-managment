"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Navigation } from "@/components/navigation";
import { Plus, Eye } from "lucide-react";
import { toast } from "sonner";

type Sale = {
  id: string;
  billNo: string;
  docDate: string;
  customerName?: string;
  totalAmount?: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
};

type Warehouse = {
  id: string;
  name: string;
  code: string;
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    docDate: new Date().toISOString().split('T')[0],
    billNo: "",
    items: [{ sku: "", warehouseCode: "", qty: "", unitPrice: "" }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesData, productsData, warehousesData] = await Promise.all([
        apiFetch<Sale[]>("/sales/list"),
        apiFetch<Product[]>("/products"),
        apiFetch<Warehouse[]>("/warehouses"),
      ]);
      setSales(salesData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/sales/by-keys", {
        method: "POST",
        body: JSON.stringify({
          customerName: formData.customerName,
          docDate: formData.docDate,
          billNo: formData.billNo,
          items: formData.items.map(item => ({
            sku: item.sku,
            warehouseCode: item.warehouseCode,
            qty: parseInt(item.qty),
            unitPrice: parseFloat(item.unitPrice),
          })),
        }),
      });
      toast.success("Sale created successfully");
      setShowForm(false);
      setFormData({
        customerName: "",
        docDate: new Date().toISOString().split('T')[0],
        billNo: "",
        items: [{ sku: "", warehouseCode: "", qty: "", unitPrice: "" }],
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create sale");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { sku: "", warehouseCode: "", qty: "", unitPrice: "" }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="flex h-screen">
      <Navigation />
      <div className="flex-1 p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
            <p className="text-gray-600">Manage your sales transactions</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Sale
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Sale</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="docDate">Date</Label>
                    <Input
                      id="docDate"
                      type="date"
                      value={formData.docDate}
                      onChange={(e) => setFormData({ ...formData, docDate: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="billNo">Bill No</Label>
                    <Input
                      id="billNo"
                      value={formData.billNo}
                      onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Items</Label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="grid grid-cols-5 gap-2">
                        <select
                          value={item.sku}
                          onChange={(e) => updateItem(index, "sku", e.target.value)}
                          className="border rounded px-3 py-2"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.sku}>
                              {product.name} ({product.sku})
                            </option>
                          ))}
                        </select>
                        <select
                          value={item.warehouseCode}
                          onChange={(e) => updateItem(index, "warehouseCode", e.target.value)}
                          className="border rounded px-3 py-2"
                          required
                        >
                          <option value="">Select Warehouse</option>
                          {warehouses.map((warehouse) => (
                            <option key={warehouse.id} value={warehouse.code}>
                              {warehouse.name} ({warehouse.code})
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => updateItem(index, "qty", e.target.value)}
                          required
                        />
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" onClick={addItem}>
                      Add Item
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit">Create Sale</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading sales...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.billNo}</TableCell>
                      <TableCell>{new Date(sale.docDate).toLocaleDateString()}</TableCell>
                      <TableCell>{sale.customerName || "-"}</TableCell>
                      <TableCell className="text-right">${sale.totalAmount || 0}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
