'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Smartphone, 
  Palette, 
  Settings2, 
  Image as ImageIcon, 
  Sparkles,
  Loader2,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const configSchema = z.object({
  appName: z.string().min(1, 'App name is required').max(50),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/, 'Invalid package name (e.g., com.example.myapp)'),
  versionName: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in format x.x.x'),
  versionCode: z.number().int().min(1),
  websiteUrl: z.string().url('Must be a valid URL'),
  iconUrl: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  orientation: z.enum(['portrait', 'landscape', 'unspecified']),
  enableCache: z.boolean(),
  enableZoom: z.boolean(),
  showSplash: z.boolean(),
  splashText: z.string().max(100).optional(),
});

type ConfigFormValues = z.infer<typeof configSchema>;

interface AppConfigFormProps {
  onSubmit: (data: ConfigFormValues) => Promise<void>;
  isLoading?: boolean;
}

const defaultValues: ConfigFormValues = {
  appName: 'My WebView App',
  packageName: 'com.example.myapp',
  versionName: '1.0.0',
  versionCode: 1,
  websiteUrl: 'https://example.com',
  iconUrl: '',
  primaryColor: '#10b981',
  orientation: 'portrait',
  enableCache: true,
  enableZoom: false,
  showSplash: true,
  splashText: '',
};

export function AppConfigForm({ onSubmit, isLoading }: AppConfigFormProps) {
  const [step, setStep] = useState(1);

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues,
  });

  const handleSubmit = useCallback(async (data: ConfigFormValues) => {
    try {
      await onSubmit(data);
      toast.success('Configuration saved!');
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error(error);
    }
  }, [onSubmit]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                step >= s
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-20 h-1 mx-2 rounded transition-all duration-300 ${
                  step > s ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card className="border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Smartphone className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Configure your app&apos;s identity</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="appName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>App Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="My WebView App" 
                            className="h-12 text-lg"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>The name shown on the home screen</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="packageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="com.example.myapp" 
                            className="h-12 font-mono"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Unique identifier for your app</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Website URL
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com" 
                          className="h-12"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>The website to load in your app</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="versionName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version Name</FormLabel>
                        <FormControl>
                          <Input placeholder="1.0.0" className="h-12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="versionCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version Code</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1}
                            className="h-12" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Appearance */}
          {step === 2 && (
            <Card className="border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Palette className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look of your app</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Color</FormLabel>
                        <div className="flex gap-3">
                          <FormControl>
                            <Input 
                              type="color"
                              className="w-16 h-12 p-1 cursor-pointer"
                              {...field}
                            />
                          </FormControl>
                          <Input 
                            className="h-12 font-mono flex-1"
                            {...field}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="iconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Icon URL (optional)
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/icon.png" 
                            className="h-12"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>URL to your app icon (PNG recommended)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="orientation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Screen Orientation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select orientation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="portrait">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4" />
                              Portrait
                            </div>
                          </SelectItem>
                          <SelectItem value="landscape">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-4 border-2 border-current rounded" />
                              Landscape
                            </div>
                          </SelectItem>
                          <SelectItem value="unspecified">
                            <div className="flex items-center gap-2">
                              <Settings2 className="w-4 h-4" />
                              Auto Rotate
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="showSplash"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-emerald-500/5 to-transparent">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-500" />
                          Show Splash Screen
                        </FormLabel>
                        <FormDescription>
                          Display a splash screen when app launches
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch('showSplash') && (
                  <FormField
                    control={form.control}
                    name="splashText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Splash Screen Text</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={form.watch('appName')} 
                            className="h-12"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Text shown on splash screen (defaults to app name)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 3: Features */}
          {step === 3 && (
            <Card className="border-2 border-emerald-500/20 shadow-xl shadow-emerald-500/5">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Settings2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <CardTitle>Features</CardTitle>
                    <CardDescription>Configure WebView features</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="enableCache"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Cache</FormLabel>
                        <FormDescription>
                          Cache web content for faster loading
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableZoom"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="space-y-0.5">
                        <FormLabel>Enable Zoom</FormLabel>
                        <FormDescription>
                          Allow users to zoom in/out on web content
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Preview Card */}
                <Card className="bg-gradient-to-br from-emerald-500/10 via-background to-background">
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: form.watch('primaryColor') }}
                      >
                        <span className="text-white text-2xl font-bold">
                          {form.watch('appName').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{form.watch('appName')}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{form.watch('packageName')}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">v{form.watch('versionName')}</Badge>
                          <Badge variant="outline">{form.watch('orientation')}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            {step > 1 ? (
              <Button type="button" variant="outline" onClick={prevStep} className="h-12 px-8">
                Previous
              </Button>
            ) : (
              <div />
            )}
            
            {step < 3 ? (
              <Button type="button" onClick={nextStep} className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600">
                Continue
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isLoading}
                className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Starting Build...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 w-4 h-4" />
                    Build APK
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
