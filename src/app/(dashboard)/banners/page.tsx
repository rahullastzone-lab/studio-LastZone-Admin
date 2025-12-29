
'use client';

import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  PlusCircle,
  Edit,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useState, type ChangeEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';

type Banner = {
  id: string;
  image_url: string;
  target_url?: string;
  is_active: boolean;
  position: number;
  created_at?: string;
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentBanner, setCurrentBanner] =
    useState<Partial<Banner> | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  // Fetch Banners
  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load banners.",
        variant: "destructive"
      });
    } else {
      setBanners(data as Banner[] || []);
    }
    setIsLoading(false);
  };

  const handleOpenDialog = (banner: Partial<Banner> | null = null) => {
    setCurrentBanner(
      banner || { id: '', image_url: '', target_url: '', is_active: true }
    );
    setIsDialogOpen(true);
  };

  const handleDelete = async (bannerId: string) => {
    try {
      const { error } = await supabase.from('banners').delete().eq('id', bannerId);
      if (error) throw error;

      setBanners((prevBanners) =>
        prevBanners.filter((banner) => banner.id !== bannerId)
      );
      toast({
        title: 'Banner Deleted',
        description: 'The banner has been removed.',
        variant: 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit for Base64 Strings in DB ideally
      toast({
        variant: 'destructive',
        title: 'File Too Large',
        description: 'Please upload an image smaller than 5MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCurrentBanner((prev) => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentBanner?.image_url) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Image field cannot be empty.',
      });
      return;
    }

    try {
      if (currentBanner.id) {
        // Update
        const { error } = await supabase
          .from('banners')
          .update({
            image_url: currentBanner.image_url,
            target_url: currentBanner.target_url
          })
          .eq('id', currentBanner.id);

        if (error) throw error;

        toast({
          title: 'Banner Updated',
          description: 'The banner has been successfully updated.',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('banners')
          .insert({
            image_url: currentBanner.image_url,
            target_url: currentBanner.target_url,
            is_active: true
          });

        if (error) throw error;

        toast({
          title: 'Banner Added',
          description: 'A new banner has been successfully created.',
        });
      }

      fetchBanners(); // Refresh list
      setIsDialogOpen(false);
      setCurrentBanner(null);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading && banners.length === 0) {
    return <div className="p-8">Loading banners...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Banner Management"
        description="Update the promotional banners on the main website."
      >
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Banner
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-4">
          {banners.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="group relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted"
                >
                  {/* Handle base64 or url images safe check */}
                  {banner.image_url && (
                    <Image
                      src={banner.image_url}
                      alt="Banner"
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <Edit className="mr-1.5 h-3 w-3" /> Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the banner.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(banner.id)}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/30 p-12 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-xl font-bold tracking-tight">
                No Banners Found
              </h3>
              <p className="text-muted-foreground">
                Add a new banner to get started.
              </p>
              <Button onClick={() => handleOpenDialog()} className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Banner
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentBanner?.id ? 'Edit Banner' : 'Add New Banner'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="col-span-3"
              />
            </div>
            {currentBanner?.image_url && (
              <div className="col-span-4 flex justify-end pr-4">
                <div className="relative h-[67px] w-[200px]">
                  <Image
                    src={currentBanner.image_url}
                    alt="Preview"
                    fill
                    className="aspect-[3/1] rounded-md object-cover"
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="target_url" className="text-right">
                Target URL
              </Label>
              <Input
                id="target_url"
                value={currentBanner?.target_url || ''}
                onChange={(e) =>
                  setCurrentBanner({
                    ...currentBanner,
                    target_url: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="e.g., https://example.com/promo"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save Banner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
