import { Dialog } from "@headlessui/react";
import { X, ImageIcon } from "lucide-react";
import { Button } from "~/ui/primitives/button";
import { Label } from "~/ui/primitives/label";
import { FormField } from "./form-field";

const BUSINESS_TYPES = [
  "Restaurant",
  "Retail",
  "Service",
  "Manufacturing",
  "Healthcare",
  "Technology",
  "Consulting",
  "Other",
];

interface AddBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: any;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  logoPreview: string | null;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AddBusinessModal({
  isOpen,
  onClose,
  formData,
  onSubmit,
  onChange,
  logoPreview,
  onLogoChange,
}: AddBusinessModalProps) {
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
            />

            <div className="grid gap-2">
              <Label htmlFor="type">Business Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                id="type"
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
              id="address"
              name="address"
              value={formData.address}
              onChange={onChange}
              required
            />

            <FormField
              label="State"
              id="state"
              name="state"
              value={formData.state}
              onChange={onChange}
              required
            />

            <FormField
              label="WhatsApp"
              id="whatsapp"
              name="whatsapp"
              type="number"
              value={formData.whatsapp}
              onChange={onChange}
              required
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Business</Button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
