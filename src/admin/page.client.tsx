"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  ArrowLeft,
  Copy,
  Download,
  Menu,
  Plus,
  QrCode,
  Search,
  Settings,
  ShoppingCart,
  Trash2,
  Users,
  Edit,
  X,
  MessageSquare,
  User, // ← ADD THIS
  LogOut,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Label } from "~/ui/primitives/label";
import Sidebar from "~/ui/components/sidebar/sidebar";
import Header from "~/ui/components/header";

const BUSINESS_TYPES = [
  "Technology & Digital Services",
  "Healthcare & Wellness",
  "Sustainability & Green Energy",
  "Professional & Business Services",
  "Services & Consumer Goods",
  "Food & Hospitality",
  "Home & Lifestyle Services",
  "Artisan & Craft Business",
  " Event & Experiential Services",
  "Other",
];

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void; // This is the key change to fix the type error
  formData: {
    bussines_name: string;
    type: string;
    address: string;
    whatsapp: string;
    link: string;
    bussinesId: string;
  };
  onSubmit: (e: React.FormEvent) => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  logoPreview: string | null;
  submitError: string;
  isSubmitting: boolean;
  // You might have other props here, add them as needed
}

interface MobileNavigationProps {
  toggleMenu: () => void; // Explicitly define toggleMenu as a function returning void
}

interface BusinessPageProps {
  user: UserData;
  biz: Business; // Add the 'biz' property here
}

interface UserData {
  id: string;
  name: string;
  phone: string;
  email: string;
  bussiness: string;
  link: string;
  mplink: string;
  bussinessId: string;
  type: string;
  address: string;
}

interface Business {
  bussinesId: string;
  bussines_name: string;
  type: string;
  address: string;
  link: string;
  mplink: string;
  whatsapp: string;
  state: string;
  userId: string;
  logo?: string;
}

// Header Component (add this before your BusinessPage component)

// Mobile Navigation Component
const MobileNavigation = ({ toggleMenu }: MobileNavigationProps) => {
  // Apply the interface here
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center border-t bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 md:hidden">
      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button
        className="flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-white"
        onClick={toggleMenu}
      >
        <Menu className="h-5 w-5 mr-2" />
        <span>Menu</span>
      </button>
    </div>
  );
};
export default function BusinessPage({ user, biz }: BusinessPageProps) {
  const router = useRouter();

  // UI State
  const MAX_IMAGES = 3;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [businessSubTab, setBusinessSubTab] = useState<
    "list" | "products" | "qrcode"
  >("list");
  // const [selectedBusinessForSubTab, setSelectedBusinessForSubTab] =
  //   useState<Business | null>(null);

  // Notifications data (ADD THIS)
  const notifications = [
    { id: 1, text: "New order received", time: "2 min ago", read: false },
    { id: 2, text: "Payment processed", time: "1 hour ago", read: true },
    { id: 3, text: "New customer registered", time: "3 hours ago", read: true },
  ];

  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const [businessSubTab, setBusinessSubTab] = useState<
  //   "list" | "products" | "qrcode"
  // >("list");
  const [selectedBusinessForSubTab, setSelectedBusinessForSubTab] =
    useState<Business | null>(null);

  // Data State
  const [phone, setPhone] = useState(user.phone);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [subsStat, setSubStat] = useState(null);
  const [bussines, setBussiness] = useState<Business[]>([]);

  // Modal State
  const [isAddBusinessModalOpen, setIsAddBusinessModalOpen] = useState(false);
  const [isEditBusinessModalOpen, setIsEditBusinessModalOpen] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    bussines_name: "",
    type: "",
    address: "",
    whatsapp: "",

    link: "",
    bussinesId: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Status State
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Tab navigation functions
  const handleBack = () => {
    if (businessSubTab !== "list") {
      setBusinessSubTab("list");
      setSelectedBusinessForSubTab(null);
    } else {
      router.push("/dashboard");
    }
  };

  // Sub-tab handlers
  const handleViewQRCode = (business: Business) => {
    setSelectedBusinessForSubTab(business);
    setBusinessSubTab("qrcode");
  };

  const handleViewProducts = (business: Business) => {
    setSelectedBusinessForSubTab(business);
    setBusinessSubTab("products");
  };

  // Data Fetching
  useEffect(() => {
    fetchBussines();

    const debounceTimer = setTimeout(fetchUser, 500);
    return () => clearTimeout(debounceTimer);
  }, [phone]);

  const fetchBussines = async () => {
    try {
      const res = await fetch(
        `/api/bussiness?userId=${encodeURIComponent(phone)}`,
      );

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = (await res.json()) as Business[];

      // You no longer need the Array.isArray check here since the type is asserted
      setBussiness(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async () => {
    if (!phone) return setUserData(null);

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/user?phone=${encodeURIComponent(phone)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch user data");
      setUserData(normalizeUserData(await response.json()));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Business CRUD Operations
  const openAddBusinessModal = () => {
    setFormData({
      bussines_name: "",
      type: "",
      address: "",
      whatsapp: "",

      link: "",
      bussinesId: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
    setIsAddBusinessModalOpen(true);
  };

  const openEditBusinessModal = (business: Business) => {
    setCurrentBusiness(business);
    setFormData({
      bussines_name: business.bussines_name,
      type: business.type,
      address: business.address,
      link: business.link,
      whatsapp: business.whatsapp,

      bussinesId: business.bussinesId,
    });
    setLogoPreview(business.logo || null);
    setIsEditBusinessModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    }
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formDataWithLogo = new FormData();

      // Create a data object with all business fields
      const businessData = {
        bussines_name: formData.bussines_name,
        type: formData.type,
        address: formData.address,
        whatsapp: formData.whatsapp,
        userId: user.phone,
      };

      // Append the data as a JSON string
      formDataWithLogo.append("data", JSON.stringify(businessData));

      // Append logo file if it exists
      if (logoFile) {
        formDataWithLogo.append("logo", logoFile);
      }

      const response = await fetch("/api/bussiness", {
        method: "POST",
        body: formDataWithLogo,
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = "Failed to create business";

        try {
          const errorData = JSON.parse(responseText);
          // Add a check to ensure errorData is an object before accessing properties
          if (
            typeof errorData === "object" &&
            errorData !== null &&
            "error" in errorData
          ) {
            errorMessage = (errorData.error as string) || errorMessage;
          } else {
            errorMessage = responseText || errorMessage;
          }
        } catch (jsonError) {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const newBusiness = (await response.json()) as {
        bussiness: Business;
        message: string;
      };

      setBussiness([...bussines, newBusiness.bussiness]);
      setIsAddBusinessModalOpen(false);

      toast.success(newBusiness.message || "Business created successfully!");
    } catch (err) {
      console.error("Error creating business:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Submission failed";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const formDataWithLogo = new FormData();

      // Create a data object with all business fields
      const businessData = {
        bussines_name: formData.bussines_name,
        type: formData.type,
        address: formData.address,

        whatsapp: formData.whatsapp,
        bussinesId: currentBusiness.bussinesId,
      };

      // Append the data as a JSON string
      formDataWithLogo.append("data", JSON.stringify(businessData));

      // Append logo file if it exists
      if (logoFile) {
        formDataWithLogo.append("logo", logoFile);
      }

      const response = await fetch("/api/bussiness", {
        method: "PUT",
        body: formDataWithLogo,
      });

      if (!response.ok) {
        const errorData: any = await response.json(); // Cast to 'any'
        throw new Error(errorData.error || "Failed to update business");
      }

      const updatedBusiness: any = await response.json(); // Cast to 'any'
      setBussiness(
        bussines.map((b) =>
          b.bussinesId === currentBusiness.bussinesId
            ? updatedBusiness.bussiness // This is now allowed
            : b,
        ),
      );
      setIsEditBusinessModalOpen(false);
      toast.success(
        updatedBusiness.message || "Business updated successfully!",
      );
    } catch (err) {
      console.error("Error updating business:", err);
      const errorMessage = err instanceof Error ? err.message : "Update failed";
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBusiness = (businessId: string) => {
    setBussiness(bussines.filter((b) => b.bussinesId !== businessId));
  };

  // Helper Functions
  const downloadQR = (title: string, content: string) => {
    try {
      // Find the QR code SVG element
      const qrSvg = document
        .querySelector(`[data-value="${content}"]`)
        ?.closest("svg");

      if (!qrSvg) {
        toast.error("QR code not found");
        return;
      }

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(qrSvg);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Create canvas to convert SVG to PNG
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          ctx.drawImage(img, 0, 0);

          // Create download link
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `${title.replace(/\s+/g, "_")}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Clean up
          URL.revokeObjectURL(svgUrl);
          toast.success(`${title} downloaded successfully!`);
        }
      };

      img.src = svgUrl;
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("Failed to download QR code");
    }
  };

  const normalizeUserData = (data: any): UserData => ({
    id: data.id || "",
    name: data.name || "",
    phone: data.phone || phone,
    email: data.email || "",
    bussiness: data.bussiness[0]?.bussines_name || "",
    link: data.bussiness[0]?.link || "",
    mplink: data.bussiness[0]?.mplink,
    bussinessId: data.bussiness[0]?.bussinesId || "",
    type: data.bussiness[0]?.type || "",
    address: data.bussiness[0]?.address || "",
  });

  // Back Button Component
  const BackButton = ({
    onClick,
    label = "Back",
  }: { onClick: () => void; label?: string }) => (
    <Button
      variant="ghost"
      onClick={onClick}
      className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 mb-4"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );

  // Business Products Sub-Tab
  const BusinessProductsTab = ({
    business,
    onBack,
  }: {
    business: any;
    onBack: () => void;
  }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [isCustomCategory, setIsCustomCategory] = useState(false);

    const [formData, setFormData] = useState({
      name: "",
      category: "",
      stock: 0,
      description: "",
      price: "",
      salePrice: "",
      variants: [{ size: "", price: "" }],
      colorVariants: [""],
    });

    // Changed state to handle multiple files and URLs
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [editingProduct, setEditingProduct] = useState<any>(null);

    useEffect(() => {
      fetchProducts();
    }, [business.bussinesId]);

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/products?bussinessId=${encodeURIComponent(business.bussinesId)}`,
        );

        if (res.ok) {
          const data: any = await res.json();
          const products = data.products;
          setProducts(products || []);
        } else {
          throw new Error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    // Modified function to handle multiple files
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        if (files.length > MAX_IMAGES) {
          toast.error(`You can only upload a maximum of ${MAX_IMAGES} images.`);
          // Reset the file input to prevent re-selection
          if (e.target) {
            e.target.value = "";
          }
          return; // Stop the function
        }

        const fileArray = Array.from(files);
        setSelectedImages(fileArray);
        const urls = fileArray.map((file) => URL.createObjectURL(file));
        setImagePreviewUrls(urls);
      }
    };

    const handleImageClick = () => fileInputRef.current?.click();

    const resetForm = () => {
      setFormData({
        name: "",
        category: "",
        stock: 0,
        description: "",
        price: "",
        salePrice: "",
        variants: [{ size: "", price: "" }],
        colorVariants: [""],
      });
      // Resetting states for multiple images
      setSelectedImages([]);
      setImagePreviewUrls([]);
      setEditingProduct(null);
      setSubmitError("");
      setIsCustomCategory(false);
    };

    const handleOpenModal = (product: any = null) => {
      if (product) {
        const variants = product.variants || [];
        const colorVariants = product.colorVariants || [];
        const displayVariants =
          variants.length > 0 ? variants : [{ size: "", price: "" }];
        const displayColorVariants =
          colorVariants.length > 0 ? colorVariants : [""];

        const isPredefinedCategory = [
          "Electronics",
          "Apparel",
          "Accessories",
          "Food",
          "Beverages",
          "Home",
          "Beauty",
          "Sports",
        ].includes(product.category);

        setEditingProduct(product);
        setFormData({
          name: product.name,
          category: isPredefinedCategory ? product.category : "",
          stock: product.stock,
          description: product.description || "",
          price: product.price || "",
          salePrice: product.salePrice || "",
          variants: displayVariants,
          colorVariants: displayColorVariants,
        });
        setIsCustomCategory(!isPredefinedCategory);
        // Set preview URLs from existing product images
        setImagePreviewUrls(product.images || []);
      } else {
        resetForm();
      }
      setIsModalOpen(true);
    };

    const addVariant = () => {
      setFormData({
        ...formData,
        variants: [...formData.variants, { size: "", price: "" }],
      });
    };

    const removeVariant = (index: number) => {
      if (formData.variants.length === 1) return;
      const newVariants = [...formData.variants];
      newVariants.splice(index, 1);
      setFormData({ ...formData, variants: newVariants });
    };

    const addColorVariant = () => {
      setFormData({
        ...formData,
        colorVariants: [...formData.colorVariants, ""],
      });
    };

    const removeColorVariant = (index: number) => {
      if (formData.colorVariants.length === 1) return;
      const newColorVariants = [...formData.colorVariants];
      newColorVariants.splice(index, 1);
      setFormData({ ...formData, colorVariants: newColorVariants });
    };
    const updateColorVariant = (index: number, value: string) => {
      const newColorVariants = [...formData.colorVariants];
      newColorVariants[index] = value;
      setFormData({ ...formData, colorVariants: newColorVariants });
    };

    const updateVariant = (
      index: number,
      field: "size" | "price",
      value: string,
    ) => {
      const newVariants = [...formData.variants];
      newVariants[index][field] = value;
      setFormData({ ...formData, variants: newVariants });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = e.target;
      if (value === "Other") {
        setIsCustomCategory(true);
        setFormData({ ...formData, category: "" });
      } else {
        setIsCustomCategory(false);
        setFormData({ ...formData, category: value });
      }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setSubmitError("");

      for (const variant of formData.variants) {
        if (!variant.size || !variant.price) {
          setSubmitError(
            "All size variants must have both a size and a price.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("category", formData.category);
        formDataToSend.append("stock", formData.stock.toString());
        formDataToSend.append("description", formData.description);
        formDataToSend.append("price", formData.price);
        formDataToSend.append("salePrice", formData.salePrice || "0");
        formDataToSend.append("bussinessId", business.bussinesId);
        formDataToSend.append("userId", business.userId);

        formDataToSend.append("variants", JSON.stringify(formData.variants));
        formDataToSend.append(
          "colorVariants",
          JSON.stringify(formData.colorVariants),
        );

        // Append all selected images to FormData
        selectedImages.forEach((file) => {
          formDataToSend.append("images", file);
        });

        const response = await fetch("/api/products", {
          method: "POST",
          body: formDataToSend,
        });

        if (!response.ok) throw new Error("Failed to create product");

        resetForm();
        setIsModalOpen(false);
        await fetchProducts();
        toast.success("Product added successfully!");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to add product";
        setSubmitError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleEditProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingProduct) return;

      for (const variant of formData.variants) {
        if (!variant.size || !variant.price) {
          setSubmitError(
            "All size variants must have both a size and a price.",
          );
          setIsSubmitting(false);
          return;
        }
      }

      setIsSubmitting(true);
      setSubmitError("");

      try {
        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("category", formData.category);
        formDataToSend.append("stock", formData.stock.toString());
        formDataToSend.append("description", formData.description);
        formDataToSend.append("price", formData.price);
        formDataToSend.append("salePrice", formData.salePrice || "0");
        formDataToSend.append("variants", JSON.stringify(formData.variants));
        formDataToSend.append(
          "colorVariants",
          JSON.stringify(formData.colorVariants),
        );

        // Append all selected images to FormData
        selectedImages.forEach((file) => {
          formDataToSend.append("images", file);
        });

        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          body: formDataToSend,
        });

        if (!response.ok) throw new Error("Failed to update product");

        resetForm();
        setIsModalOpen(false);
        await fetchProducts();
        toast.success("Product updated successfully!");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to edit product";
        setSubmitError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleDeleteProduct = async (productId: string) => {
      if (!confirm("Are you sure you want to delete this product?")) return;

      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setProducts((prev) => prev.filter((p) => p.id !== productId));
          toast.success("Product deleted successfully!");
        } else {
          throw new Error("Failed to delete product");
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error("Failed to delete product");
      }
    };

    const filteredProducts = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Businesses
          </Button>
          <h2 className="text-xl font-semibold">
            Products - {business.bussines_name}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              className="w-full rounded-lg border bg-white py-2 pl-10 pr-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Product
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCardComponent
                key={product.id}
                product={product}
                onEdit={() => handleOpenModal(product)}
                onDelete={() => handleDeleteProduct(product.id)}
                onRefresh={fetchProducts}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products found"
            description={
              searchQuery
                ? "Try adjusting your search"
                : "Get started by adding your first product"
            }
            actionText="Add Product"
            onAction={() => handleOpenModal()}
          />
        )}

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-lg dark:bg-gray-900">
              <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
                <h2 className="text-xl font-bold">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
              >
                <div className="p-4">
                  {submitError && (
                    <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {submitError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Product Name*
                      </label>
                      <input
                        className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="e.g., Slim-fit T-shirt"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Category*
                      </label>
                      <select
                        className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        required
                        value={isCustomCategory ? "Other" : formData.category}
                        onChange={handleCategoryChange}
                      >
                        <option value="">Select category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Apparel">Apparel</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Food">Food</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Home">Home</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Sports">Sports</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {isCustomCategory && (
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Custom Category*
                        </label>
                        <input
                          className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                          required
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                          placeholder="e.g., Handmade Jewelry"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Price*
                        </label>
                        <input
                          className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                          required
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) =>
                            setFormData({ ...formData, price: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Discount Price
                        </label>
                        <input
                          className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.salePrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              salePrice: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium">
                          Stock
                        </label>
                        <input
                          className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.stock}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              stock: Number.parseInt(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Size Variants
                      </label>
                      <div className="space-y-3">
                        {formData.variants.map((variant, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                              placeholder="Size (e.g., Small, Medium, 250ml)"
                              value={variant.size}
                              onChange={(e) =>
                                updateVariant(index, "size", e.target.value)
                              }
                              required
                            />
                            <input
                              className="w-40 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                              placeholder="Price"
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(index, "price", e.target.value)
                              }
                              required
                            />
                            {formData.variants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addVariant}
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                        >
                          <Plus className="h-4 w-4" />
                          Add Variant
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Color Variants
                      </label>
                      <div className="space-y-3">
                        {formData.colorVariants.map((color, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              className="flex-1 rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                              placeholder="Color (e.g., Red, Blue, Green)"
                              value={color}
                              onChange={(e) =>
                                updateColorVariant(index, e.target.value)
                              }
                            />
                            {formData.colorVariants.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeColorVariant(index)}
                                className="rounded-full p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addColorVariant}
                          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
                        >
                          <Plus className="h-4 w-4" />
                          Add Color Variant
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Description
                      </label>
                      <textarea
                        className="w-full rounded-lg border bg-white px-3 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                        rows={3}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="e.g., Made from 100% organic cotton..."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Product Images
                      </label>
                      <div
                        className="relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center dark:border-gray-800"
                        onClick={handleImageClick}
                      >
                        <input
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                          ref={fileInputRef}
                          type="file"
                          multiple // The key change for multiple uploads
                        />
                        {imagePreviewUrls.length > 0 ? (
                          <div className="flex flex-wrap justify-center gap-4">
                            {imagePreviewUrls.map((url, index) => (
                              <img
                                key={index}
                                alt={`Product Preview ${index + 1}`}
                                className="h-24 w-24 rounded-lg object-contain"
                                src={url}
                              />
                            ))}
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                              Drag and drop or click to browse for images
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      className="rounded-lg border bg-white px-4 py-2 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      type="button"
                      onClick={() => {
                        resetForm();
                        setIsModalOpen(false);
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-70"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? editingProduct
                          ? "Saving..."
                          : "Adding..."
                        : editingProduct
                          ? "Save Changes"
                          : "Add Product"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Business QR Code Sub-Tab
  const BusinessQRCodeTab = ({
    business,
    onBack,
    onDownload,
  }: {
    business: Business;
    onBack: () => void;
    onDownload: (title: string, content: string) => void;
  }) => {
    const businessCardData = `MECARD:N:${business.bussines_name};TEL:${business.whatsapp};ADR:${business.address};URL:${business.link};`;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Businesses
          </Button>
          <h2 className="text-xl font-semibold">
            QR Codes - {business.bussines_name}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Product QR Code */}
          <div className="rounded-lg border bg-blue-50 p-6 shadow-sm dark:border-gray-800 dark:bg-blue-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Product Catalog QR</h3>
              <ShoppingCart className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center justify-center rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <QRCode
                  bgColor="transparent"
                  className="h-full w-full text-black dark:text-white"
                  fgColor="currentColor"
                  size={160}
                  value={business.link}
                  data-value={business.link}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 text-center">
                Scan to view all products from {business.bussines_name}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium">Store Link:</span>
                <a
                  href={business.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  {business.link}
                </a>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(business.link);
                    toast.success("Link copied to clipboard");
                  }}
                  className="text-gray-500 hover:text-blue-600"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <Button
                onClick={() =>
                  onDownload(
                    `${business.bussines_name} Product QR`,
                    business.link,
                  )
                }
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </div>

          {/* Business Card QR Code */}
          <div className="rounded-lg border bg-purple-50 p-6 shadow-sm dark:border-gray-800 dark:bg-purple-900/30">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Business Card QR</h3>
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex items-center justify-center rounded border bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                <QRCode
                  bgColor="transparent"
                  className="h-full w-full text-black dark:text-white"
                  fgColor="currentColor"
                  size={160}
                  value={businessCardData}
                  data-value={businessCardData}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 text-center">
                Scan to save {business.bussines_name} contact details
              </p>
              <div className="text-sm space-y-1 mb-3">
                <p>
                  <strong>Name:</strong> {business.bussines_name}
                </p>
                <p>
                  <strong>Phone:</strong> {business.whatsapp}
                </p>
                <p>
                  <strong>Address:</strong> {business.address}
                </p>
              </div>
              <Button
                onClick={() =>
                  onDownload(
                    `${business.bussines_name} Business Card`,
                    businessCardData,
                  )
                }
                className="flex items-center gap-2"
                size="sm"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
          <h3 className="font-medium mb-3">Quick Actions</h3>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => window.open(business.mplink, "_blank")}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Store
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(business.link, "_blank")}
              className="flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              Visit Store
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render Functions
  const renderContent = () => {
    if (businessSubTab === "products" && selectedBusinessForSubTab) {
      return (
        <BusinessProductsTab
          business={selectedBusinessForSubTab}
          onBack={() => {
            setBusinessSubTab("list");
            setSelectedBusinessForSubTab(null);
          }}
        />
      );
    }

    if (businessSubTab === "qrcode" && selectedBusinessForSubTab) {
      return (
        <BusinessQRCodeTab
          business={selectedBusinessForSubTab}
          onBack={() => {
            setBusinessSubTab("list");
            setSelectedBusinessForSubTab(null);
          }}
          onDownload={downloadQR}
        />
      );
    }

    // Default business list view
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h2 className="text-xl font-semibold">Add edit business </h2>
        </div>

        <div className="flex justify-between items-center">
          <Button
            onClick={openAddBusinessModal}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Business
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bussines.length > 0 ? (
            bussines.map((business) => (
              <BusinessCardComponent
                key={business.bussinesId}
                business={business}
                onEdit={() => openEditBusinessModal(business)}
                onDelete={() => handleDeleteBusiness(business.bussinesId)}
                onManageProducts={() => handleViewProducts(business)}
                onViewQR={() => handleViewQRCode(business)}
              />
            ))
          ) : (
            <EmptyState
              title="No businesses added yet"
              description="Get started by adding your first business"
              actionText="Add Business"
              onAction={openAddBusinessModal}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-50">
      {/* Header */}
      <Header
        userData={userData}
        notifications={notifications}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="flex-1 p-4 pb-24 md:pb-6 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold md:text-3xl">
              Business Management
            </h1>
          </div>

          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation
        toggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* All Modals - KEEP YOUR EXISTING MODALS HERE */}
      <AddBusinessModal
        isOpen={isAddBusinessModalOpen}
        onClose={() => setIsAddBusinessModalOpen(false)}
        formData={formData}
        onSubmit={handleAddBusiness}
        onChange={(
          e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
          >,
        ) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        logoPreview={logoPreview}
        onLogoChange={handleLogoChange}
        isSubmitting={isSubmitting} // Add this
        submitError={submitError} // Add this
      />

      <EditBusinessModal
        isOpen={isEditBusinessModalOpen}
        onClose={() => setIsEditBusinessModalOpen(false)}
        formData={formData}
        onSubmit={handleEditBusiness}
        onChange={(
          e: React.ChangeEvent<HTMLInputElement>, // <-- Explicit type here
        ) => setFormData({ ...formData, [e.target.name]: e.target.value })}
        logoPreview={logoPreview}
        onLogoChange={handleLogoChange}
      />
    </div>
  );
}

const ProductCardComponent = ({
  product,
  onEdit,
  onDelete,
  onRefresh,
}: {
  product: any;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) => {
  // CORRECTED: Parse size variants from the product.variants field
  const parseVariants = () => {
    if (!product.variants) return [];

    let variantsData = product.variants;
    if (typeof variantsData === "string") {
      try {
        variantsData = JSON.parse(variantsData);
      } catch (error) {
        console.error("Failed to parse variants JSON:", error);
        return [];
      }
    }
    return Array.isArray(variantsData) ? variantsData : [];
  };

  // CORRECTED: Parse color variants from product.colorVariants
  const parseColorVariants = () => {
    if (!product.colorVariants) return [];
    let colorVariantsData = product.colorVariants;

    if (typeof colorVariantsData === "string") {
      try {
        colorVariantsData = JSON.parse(colorVariantsData);
      } catch (error) {
        console.error("Failed to parse color variants JSON:", error);
        return [];
      }
    }
    // The main form saves a simple array of strings, so we handle that case.
    if (Array.isArray(colorVariantsData)) {
      return colorVariantsData;
    }
    return [];
  };

  const variants = parseVariants();
  const hasVariants = variants.length > 0;

  const colorVariants = parseColorVariants();
  const hasColorVariants = colorVariants.length > 0;

  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariants, setEditingVariants] = useState<any[]>([]);
  // CORRECTED: State is now a simple string array to match the backend.
  const [editingColorVariants, setEditingColorVariants] = useState<string[]>(
    [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Function to open variant editor
  const openVariantEditor = () => {
    // CORRECTED: Initialize state with correctly parsed variants from the product prop.
    const initialVariants = hasVariants ? variants : [{ size: "", price: "" }];
    const initialColorVariants = hasColorVariants ? colorVariants : [""];

    setEditingVariants(initialVariants);
    setEditingColorVariants(initialColorVariants);
    setIsVariantModalOpen(true);
  };

  const updateVariant = (
    index: number,
    field: "size" | "price",
    value: string,
  ) => {
    const newVariants = [...editingVariants];
    newVariants[index][field] = value;
    setEditingVariants(newVariants);
  };

  const removeVariant = (index: number) => {
    if (editingVariants.length <= 1) {
      toast.error("At least one variant is required");
      return;
    }
    const newVariants = editingVariants.filter((_, i) => i !== index);
    setEditingVariants(newVariants);
  };

  const addVariant = () => {
    setEditingVariants([...editingVariants, { size: "", price: "" }]);
  };

  // NEW: Update color variant to handle a simple string array.
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
      // Validate size variants
      const validationErrors = [];
      for (const variant of editingVariants) {
        if (
          !variant.size.trim() ||
          !variant.price.trim() ||
          isNaN(Number(variant.price))
        ) {
          validationErrors.push(
            "All size variants must have a size and a valid price.",
          );
          break;
        }
      }
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        setIsSubmitting(false);
        return;
      }

      const formattedVariants = editingVariants.map((variant) => ({
        size: variant.size.trim(),
        price: Number(variant.price),
      }));

      // CORRECTED: Simple filtering and mapping for color variants.
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
      setIsVariantModalOpen(false);
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

  const prices = variants.map((v) => Number(v.price) || 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.price;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : product.price;

  return (
    <>
      <div className="rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
        <div className="flex aspect-square w-full items-center justify-center rounded-t-lg bg-gray-100 dark:bg-gray-800">
          {product.images ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-12 w-12 text-gray-400" />
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between">
            <h3 className="line-clamp-1 font-medium">{product.name}</h3>
            {/* Show price range if variants exist, otherwise show single price */}
            <div className="text-right">
              {hasVariants ? (
                <span className="font-bold text-primary">₦{product.price}</span>
              ) : product.salePrice && product.salePrice !== product.price ? (
                <div>
                  <span className="font-bold text-primary">
                    ₦{product.salePrice}
                  </span>
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    ₦{product.price}
                  </span>
                </div>
              ) : (
                <span className="font-bold text-primary">${product.price}</span>
              )}
            </div>
          </div>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {product.category}
          </p>

          {/* Display variants if they exist */}
          {hasVariants && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Size Variants:
                </p>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                {/* <button
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={openVariantEditor}
                >
                  Edit Variants
                </button> */}
              </div>
              {variants.slice(0, 3).map((variant, index) => (
                <div key={index} className="flex justify-between text-xs">
                  <span>{variant.size}</span>
                  <span>₦{variant.price}</span>
                </div>
              ))}
              {variants.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{variants.length - 3} more
                </p>
              )}
            </div>
          )}

          {hasColorVariants && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Colors:
                </p>
              </div>
              {/* CORRECTED: Displaying simple color names */}
              {colorVariants.slice(0, 3).map((color, index) => (
                <div key={index} className="text-xs">
                  <span>{color}</span>
                </div>
              ))}
              {colorVariants.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{colorVariants.length - 3} more colors
                </p>
              )}
            </div>
          )}

          {product.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {product.description}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <span
              className={`text-xs ${
                product.stock > 50
                  ? "text-green-600 dark:text-green-400"
                  : product.stock > 10
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
              }`}
            >
              {product.stock} in stock
            </span>
            <div className="flex gap-2">
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={onEdit}
              >
                Edit Product
              </button>

              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Editor Modal */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-lg dark:bg-gray-900">
            <div className="flex items-center justify-between border-b p-4 dark:border-gray-800">
              <h2 className="text-xl font-bold">
                Edit Variants - {product.name}
              </h2>
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={() => setIsVariantModalOpen(false)}
                disabled={isSubmitting}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {/* Size Variants Section */}
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
                        <X className="h-4 w-4" />
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

              {/* Color Variants Section */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Color Variants</h3>
                <div className="space-y-3">
                  {/* CORRECTED: Now maps over a simple string array */}
                  {editingColorVariants.map((color, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                        placeholder="Color (e.g., Red, Blue)"
                        value={color}
                        onChange={(e) =>
                          updateColorVariant(index, e.target.value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeColorVariant(index)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        disabled={editingColorVariants.length <= 1}
                      >
                        <X className="h-4 w-4" />
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
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
                <button
                  onClick={() => setIsVariantModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
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
      )}
    </>
  );
};
// Business Card Component
const BusinessCardComponent = ({
  business,
  onEdit,
  onDelete,
  onManageProducts,
  onViewQR,
}: {
  business: Business;
  onEdit: () => void;
  onDelete: () => void;
  onManageProducts: () => void;
  onViewQR: () => void;
}) => (
  <div className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-start gap-3">
      {business.logo && (
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border">
          <img
            src={business.logo}
            alt={`${business.bussines_name} logo`}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{business.bussines_name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {business.type}
            </p>
          </div>
          <div className="flex gap-2">
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              onClick={onEdit}
              className="text-gray-500 hover:text-primary"
            >
              <Edit size={16} />
            </button>
            {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
            <button
              onClick={onDelete}
              className="text-gray-500 hover:text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          <p className="truncate">
            <span className="font-medium">Address:</span> {business.address}
          </p>
          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium">Store: </span>
            <a
              href={business.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {business.link}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(business.link);
                  toast.success("Link copied to clipboard");
                }}
                className="text-gray-500 hover:text-primary"
              >
                <Copy size={14} />
              </button>
            </a>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="font-medium">Manage: </span>
            <a
              href={business.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1"
            >
              {business.mplink}
              {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(business.mplink);
                  toast.success("Link copied to clipboard");
                }}
                className="text-gray-500 hover:text-primary"
              >
                <Copy size={14} />
              </button>
            </a>
          </div>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={onManageProducts}
          >
            <ShoppingCart size={14} />
            Products
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={onViewQR}
          >
            <QrCode size={14} />
            QR Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => window.open(business.mplink, "_blank")}
          >
            <Settings size={14} />
            Manage
          </Button>
        </div>
      </div>
    </div>
  </div>
);

const EmptyState = ({
  title,
  description,
  actionText,
  onAction,
}: {
  title: string;
  description: string;
  actionText: string;
  onAction: () => void;
}) => (
  <div className="col-span-full rounded-lg border bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
    <p className="text-gray-500">{title}</p>
    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
      {description}
    </p>
    <Button onClick={onAction} className="mt-4 flex items-center gap-2">
      <Plus size={16} />
      {actionText}
    </Button>
  </div>
);

// Modal Components
const AddBusinessModal = ({
  isOpen,
  onClose,
  formData,
  onSubmit,
  onChange,
  logoPreview,
  onLogoChange,
  isSubmitting, // Add this prop
  submitError, // Add this prop
}) => {
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const handleTypeChange = (e) => {
    const { value } = e.target;
    if (value === "Other") {
      setIsCustomCategory(true);
      onChange({ target: { name: "type", value: "" } });
    } else {
      setIsCustomCategory(false);
      onChange(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-xl font-semibold">
              Add New Business
            </Dialog.Title>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {submitError && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Logo Upload Section */}
            <div className="space-y-2">
              <Label htmlFor="logo">Business Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 rounded-full border border-dashed border-gray-300 overflow-hidden">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    accept="image/*"
                    onChange={onLogoChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="logo"
                    className={`cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 ${
                      isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {logoPreview ? "Change Logo" : "Upload Logo"}
                  </Label>
                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG up to 2MB
                  </p>
                </div>
              </div>
            </div>

            <FormField
              label="Business Name"
              id="bussines_name"
              name="bussines_name"
              value={formData.bussines_name}
              onChange={onChange}
              required
              placeholder="e.g., Jane's Boutique"
              disabled={isSubmitting}
            />

            <div className="grid gap-2">
              <Label htmlFor="type">Business Type</Label>
              <select
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                }`}
                id="type"
                name="type"
                onChange={handleTypeChange}
                required
                value={isCustomCategory ? "Other" : formData.type}
                disabled={isSubmitting}
              >
                <option value="">Select your business type</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {isCustomCategory && (
              <FormField
                label="Custom Category"
                id="customType"
                name="type"
                value={formData.type}
                onChange={onChange}
                required
                disabled={isSubmitting}
              />
            )}

            <FormField
              label="Address"
              id="address"
              name="address"
              value={formData.address}
              onChange={onChange}
              required
              disabled={isSubmitting}
            />

            <FormField
              label="WhatsApp"
              id="whatsapp"
              name="whatsapp"
              type="tel"
              value={formData.whatsapp}
              onChange={onChange}
              required
              disabled={isSubmitting}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  "Add Business"
                )}
              </Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

const EditBusinessModal = ({
  isOpen,
  onClose,
  formData,
  onSubmit,
  onChange,
  logoPreview,
  onLogoChange,
}: {
  isOpen: boolean;
  onClose: void;
  formData: any;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logoPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <Dialog open={isOpen} onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-900">
        <div className="flex justify-between items-center mb-4">
          <Dialog.Title className="text-xl font-semibold">
            Edit Business
          </Dialog.Title>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label htmlFor="logo">Business Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-full border border-dashed border-gray-300 overflow-hidden">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={onLogoChange}
                  className="hidden"
                />
                <Label
                  htmlFor="logo"
                  className="cursor-pointer rounded-md border border-gray-300 px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
                >
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </Label>
                <p className="mt-1 text-xs text-gray-500">JPG, PNG up to 2MB</p>
              </div>
            </div>
          </div>

          <FormField
            label="Business Name"
            id="edit_bussines_name"
            name="bussines_name"
            value={formData.bussines_name}
            onChange={onChange}
            required
          />

          <div className="grid gap-2">
            <Label htmlFor="edit_type">Business Type</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              id="edit_type"
              name="type"
              onChange={onChange}
              required
              value={formData.type}
            >
              <option value="">Select your business type</option>
              {BUSINESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <FormField
            label="Address"
            id="edit_address"
            name="address"
            value={formData.address}
            onChange={onChange}
            required
          />

          <FormField
            label="WhatsApp"
            id="edit_whatsapp"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={onChange}
            required
          />

          <FormField
            label="Website Link"
            id="edit_link"
            name="link"
            type="url"
            value={formData.link}
            onChange={onChange}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Update Business</Button>
          </div>
        </form>
      </Dialog.Panel>
    </div>
  </Dialog>
);

const FormField = ({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  required,
  step,
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  value: string | number | boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  required?: boolean;
  step?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium mb-1">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={typeof value === "boolean" ? undefined : value}
      checked={typeof value === "boolean" ? value : undefined}
      onChange={onChange}
      required={required}
      step={step}
      className="w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
    />
  </div>
);
