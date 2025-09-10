// ui/components/edit-variants-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Plus, MinusCircle } from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  variants?: string;
  colorVariants?: string;
}

interface Variant {
  size: string;
  price: string;
}

interface EditVariantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onRefresh: () => void;
}

export function EditVariantsModal({
  isOpen,
  onClose,
  product,
  onRefresh,
}: EditVariantsModalProps) {
  const parseVariants = (variantsData: string | undefined) => {
    if (!variantsData) return [{ size: "", price: "" }];
    try {
      const data =
        typeof variantsData === "string"
          ? JSON.parse(variantsData)
          : variantsData;
      return Array.isArray(data) ? data : [{ size: "", price: "" }];
    } catch (error) {
      console.error("Failed to parse variants JSON:", error);
      return [{ size: "", price: "" }];
    }
  };

  const parseColorVariants = (colorVariantsData: string | undefined) => {
    if (!colorVariantsData) return [""];
    try {
      const data =
        typeof colorVariantsData === "string"
          ? JSON.parse(colorVariantsData)
          : colorVariantsData;
      return Array.isArray(data) ? data : [""];
    } catch (error) {
      console.error("Failed to parse color variants JSON:", error);
      return [""];
    }
  };

  const [editingVariants, setEditingVariants] = useState<Variant[]>(
    parseVariants(product.variants),
  );
  const [editingColorVariants, setEditingColorVariants] = useState<string[]>(
    parseColorVariants(product.colorVariants),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVariant = (
    index: number,
    field: "size" | "price",
    value: string,
  ) => {
    const newVariants = [...editingVariants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setEditingVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    if (editingVariants.length <= 1) {
      toast.error("At least one variant is required.");
      return;
    }
    const newVariants = editingVariants.filter((_, i) => i !== index);
    setEditingVariants(newVariants);
  };

  const addVariant = () => {
    setEditingVariants([...editingVariants, { size: "", price: "" }]);
  };

  const updateColorVariant = (index: number, value: string) => {
    const newColorVariants = [...editingColorVariants];
    newColorVariants[index] = value;
    setEditingColorVariants(newColorVariants);
  };

  const addColorVariant = () => {
    setEditingColorVariants([...editingColorVariants, ""]);
  };

  const removeColorVariant = (index: number) => {
    if (editingColorVariants.length <= 1) return;
    const newColorVariants = editingColorVariants.filter((_, i) => i !== index);
    setEditingColorVariants(newColorVariants);
  };

  const saveVariants = async () => {
    setIsSubmitting(true);
    try {
      for (const variant of editingVariants) {
        if (
          !variant.size.trim() ||
          !variant.price.trim() ||
          isNaN(Number(variant.price))
        ) {
          toast.error("All size variants must have a size and a valid price.");
          setIsSubmitting(false);
          return;
        }
      }

      const formattedVariants = editingVariants.map((variant) => ({
        size: variant.size.trim(),
        price: Number(variant.price),
      }));

      const formattedColorVariants = editingColorVariants.filter(
        (color) => color.trim() !== "",
      );

      const response = await fetch(`/api/products/variants`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variants: formattedVariants,
          colorVariants: formattedColorVariants,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update variants");
      }

      toast.success("Variants updated successfully!");
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error saving variants:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update variants",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-900">
        <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
          <h2 className="text-xl font-bold">Edit Variants - {product.name}</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-6">
            <h3 className="font-medium mb-3">Size Variants</h3>
            <div className="space-y-3">
              {editingVariants.map((variant, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Size (e.g., Small, Medium)"
                    value={variant.size}
                    onChange={(e) =>
                      updateVariant(index, "size", e.target.value)
                    }
                  />
                  <input
                    className="w-20 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Price"
                    type="number"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(index, "price", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={editingVariants.length <= 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              Add Size Variant
            </button>
          </div>

          <div className="mb-6">
            <h3 className="font-medium mb-3">Color Variants</h3>
            <div className="space-y-3">
              {editingColorVariants.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                    placeholder="Color (e.g., Red, Blue)"
                    value={color}
                    onChange={(e) => updateColorVariant(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeColorVariant(index)}
                    className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={editingColorVariants.length <= 1}
                  >
                    <MinusCircle className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addColorVariant}
              className="mt-3 flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4" />
              Add Color Variant
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={saveVariants}
              disabled={isSubmitting}
              className="rounded bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save All Variants"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
