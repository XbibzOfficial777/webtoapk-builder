import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ConfigurationFormProps {
  onSuccess?: () => void;
}

export default function ConfigurationForm({ onSuccess }: ConfigurationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    appName: "",
    packageId: "",
    appVersion: "1.0.0",
    targetUrl: "",
    description: "",
    iconUrl: "",
    splashUrl: "",
  });

  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [splashPreview, setSplashPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const createConfig = trpc.configurations.create.useMutation({
    onSuccess: () => {
      toast.success("Configuration created successfully!");
      setFormData({
        name: "",
        appName: "",
        packageId: "",
        appVersion: "1.0.0",
        targetUrl: "",
        description: "",
        iconUrl: "",
        splashUrl: "",
      });
      setIconPreview(null);
      setSplashPreview(null);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create configuration");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "icon" | "splash") => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = event.target?.result as string;
        if (type === "icon") {
          setIconPreview(preview);
          setFormData(prev => ({ ...prev, iconUrl: preview }));
        } else {
          setSplashPreview(preview);
          setFormData(prev => ({ ...prev, splashUrl: preview }));
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.appName || !formData.packageId || !formData.targetUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate package ID format
    if (!/^[a-z][a-z0-9]*(\.[a-z0-9]+)*$/.test(formData.packageId)) {
      toast.error("Invalid package ID format (e.g., com.example.app)");
      return;
    }

    // Validate URL
    try {
      new URL(formData.targetUrl);
    } catch {
      toast.error("Invalid URL format");
      return;
    }

    setIsLoading(true);
    try {
      await createConfig.mutateAsync({
        name: formData.name,
        appName: formData.appName,
        packageId: formData.packageId,
        appVersion: formData.appVersion,
        targetUrl: formData.targetUrl,
        description: formData.description,
        iconUrl: formData.iconUrl,
        splashUrl: formData.splashUrl,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Basic Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">
              Configuration Name *
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., My Awesome App"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <Label htmlFor="appName" className="text-slate-300">
              App Display Name *
            </Label>
            <Input
              id="appName"
              name="appName"
              placeholder="e.g., Awesome App"
              value={formData.appName}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
          </div>

          <div>
            <Label htmlFor="packageId" className="text-slate-300">
              Package ID *
            </Label>
            <Input
              id="packageId"
              name="packageId"
              placeholder="e.g., com.example.app"
              value={formData.packageId}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">Format: com.company.appname</p>
          </div>

          <div>
            <Label htmlFor="appVersion" className="text-slate-300">
              App Version
            </Label>
            <Input
              id="appVersion"
              name="appVersion"
              placeholder="1.0.0"
              value={formData.appVersion}
              onChange={handleInputChange}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Target URL */}
      <div>
        <Label htmlFor="targetUrl" className="text-slate-300">
          Target Website URL *
        </Label>
        <Input
          id="targetUrl"
          name="targetUrl"
          type="url"
          placeholder="https://example.com"
          value={formData.targetUrl}
          onChange={handleInputChange}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
        />
        <p className="text-xs text-slate-500 mt-1">The website URL to convert to APK</p>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-slate-300">
          Description
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe your app..."
          value={formData.description}
          onChange={handleInputChange}
          className="bg-slate-700 border-slate-600 text-white placeholder-slate-500 min-h-24"
        />
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">App Images</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* App Icon */}
          <div>
            <Label className="text-slate-300 mb-2 block">App Icon</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition">
              {iconPreview ? (
                <div className="relative">
                  <img src={iconPreview} alt="Icon preview" className="w-24 h-24 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setIconPreview(null);
                      setFormData(prev => ({ ...prev, iconUrl: "" }));
                    }}
                    className="absolute top-0 right-0 bg-red-600 rounded-full p-1 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Click to upload icon</p>
                  <p className="text-xs text-slate-500">PNG, JPG (max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "icon")}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Splash Screen */}
          <div>
            <Label className="text-slate-300 mb-2 block">Splash Screen</Label>
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-slate-500 transition">
              {splashPreview ? (
                <div className="relative">
                  <img src={splashPreview} alt="Splash preview" className="w-24 h-24 mx-auto rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setSplashPreview(null);
                      setFormData(prev => ({ ...prev, splashUrl: "" }));
                    }}
                    className="absolute top-0 right-0 bg-red-600 rounded-full p-1 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-300">Click to upload splash</p>
                  <p className="text-xs text-slate-500">PNG, JPG (max 5MB)</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "splash")}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Configuration"
          )}
        </Button>
      </div>
    </form>
  );
}
