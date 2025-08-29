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

type Purchase = {
  id: string;
  invoiceNo: string;
  docDate: string;
  supplierName?: string;
  totalAmount?: number;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  cost: number;
};

type Warehouse = {
  id: string;
  name: string;
  code: string;
};

type Supplier = {
  id: string;
  name: string;
};

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplierName: "",
    docDate: new Date().toISOString().split('T')[0],
    invoiceNo: "",
    items: [{ sku: "", warehouseCode: "", qty: "", unitCost: "" }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsData, warehousesData, suppliersData] = await Promise.all([
        apiFetch<Product[]>("/products"),
        apiFetch<Warehouse[]>("/warehouses"),
        apiFetch<Supplier[]>("/suppliers"),
      ]);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setSuppliers(suppliersData);
      // Note: Purchases list API might not exist yet, so we'll handle that separately
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("/purchases/by-keys", {
        method: "POST",
        body: JSON.stringify({
          supplierName: formData.supplierName,
          docDate: formData.docDate,
          invoiceNo: formData.invoiceNo,
          items: formData.items.map(item => ({
            sku: item.sku,
            warehouseCode: item.warehouseCode,
            qty: parseInt(item.qty),
            unitCost: parseFloat(item.unitCost),
          })),
        }),
      });
      toast.success("Purchase created successfully");
      setShowForm(false);
      setFormData({
        supplierName: "",
        docDate: new Date().toISOString().split('T')[0],
        invoiceNo: "",
        items: [{ sku: "", warehouseCode: "", qty: "", unitCost: "" }],
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create purchase");
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { sku: "", warehouseCode: "", qty: "", unitCost: "" }],
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
            <h1 className="text-3xl font-bold text-gray-900">Purchases</h1>
            <p className="text-gray-600">Manage your purchase transactions</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Purchase
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Purchase</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="supplierName">Supplier Name</Label>
                    <select
                      id="supplierName"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      required
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.name}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
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
                    <Label htmlFor="invoiceNo">Invoice No</Label>
                    <Input
                      id="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
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
                          placeholder="Unit Cost"
                          value={item.unitCost}
                          onChange={(e) => updateItem(index, "unitCost", e.target.value)}
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
                  <Button type="submit">Create Purchase</Button>
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
              <div className="p-6 text-center">Loading purchases...</div>
            ) : purchases.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No purchases found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-medium">{purchase.invoiceNo}</TableCell>
                      <TableCell>{new Date(purchase.docDate).toLocaleDateString()}</TableCell>
                      <TableCell>{purchase.supplierName || "-"}</TableCell>
                      <TableCell className="text-right">${purchase.totalAmount || 0}</TableCell>
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
