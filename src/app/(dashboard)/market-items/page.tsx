'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Switch } from '@/components/ui/switch';

type MarketItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
};

export default function MarketItemsPage() {
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentItem, setCurrentItem] = useState<Partial<MarketItem> | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchMarketItems();
  }, []);

  const fetchMarketItems = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('market_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching market items:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch market items.',
      });
    } else {
      setMarketItems(data || []);
    }
    setIsLoading(false);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('market_items').delete().eq('id', id);

    if (error) {
      console.error('Error deleting item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete item.',
      });
    } else {
      setMarketItems((prevItems) => prevItems.filter((item) => item.id !== id));
      toast({
        title: 'Item Deleted',
        description: 'The item has been successfully removed from the market.',
      });
    }
  };

  const handleOpenDialog = (item: Partial<MarketItem> | null = null) => {
    setCurrentItem(
      item || { name: '', price: 0, description: '', is_active: true }
    );
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSave = async () => {
    if (!currentItem?.name || currentItem.price === undefined) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name and Price are required.',
      });
      return;
    }

    let imageUrl = currentItem.image_url;

    if (imageFile) {
      try {
        imageUrl = await convertToBase64(imageFile);
      } catch (error) {
        console.error('Error converting image:', error);
        toast({
          variant: 'destructive',
          title: 'Image Error',
          description: 'Failed to process image.',
        });
        return;
      }
    }

    const itemData = {
      name: currentItem.name,
      description: currentItem.description || '',
      price: currentItem.price,
      is_active: currentItem.is_active ?? true,
      image_url: imageUrl,
    };

    try {
      if (currentItem.id) {
        // Update existing
        const { error } = await supabase
          .from('market_items')
          .update(itemData)
          .eq('id', currentItem.id);

        if (error) throw error;

        toast({
          title: 'Item Updated',
          description: 'The market item has been successfully updated.',
        });
      } else {
        // Create new
        const { error } = await supabase.from('market_items').insert([itemData]);

        if (error) throw error;

        toast({
          title: 'Item Added',
          description: 'A new item has been successfully added to the market.',
        });
      }

      await fetchMarketItems();
      setIsDialogOpen(false);
      setCurrentItem(null);
    } catch (error: any) {
      console.error('Error saving item:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save item.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Marketplace"
        description="Manage items available for purchase."
        onRefresh={fetchMarketItems}
      >
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Market Items</CardTitle>
          <CardDescription>
            In-game items, vouchers, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Price (Coins)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading items...
                    </TableCell>
                  </TableRow>
                ) : marketItems.length > 0 ? (
                  marketItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('en-IN').format(item.price)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.is_active ? 'default' : 'secondary'}
                        >
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(item)}
                          >
                            <Edit className="mr-1.5 h-3 w-3" />
                            Edit
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive">
                                <Trash2 className="mr-1.5 h-3 w-3" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently
                                  delete the item.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.id)}
                                >
                                  Continue
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No market items found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentItem?.id ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Image
              </Label>
              <div className="col-span-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                />
                {currentItem?.image_url && !imageFile && (
                  <div className="mt-2">
                    <img
                      src={currentItem.image_url}
                      alt="Preview"
                      className="h-16 w-16 rounded-md object-cover border"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentItem?.name || ''}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, name: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={currentItem?.description || ''}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, description: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price (Coins)
              </Label>
              <Input
                id="price"
                type="number"
                value={currentItem?.price || 0}
                onChange={(e) =>
                  setCurrentItem({ ...currentItem, price: +e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Status
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={currentItem?.is_active ?? true}
                  onCheckedChange={(checked) =>
                    setCurrentItem({ ...currentItem, is_active: checked })
                  }
                />
                <Label htmlFor="active">{currentItem?.is_active !== false ? 'Active' : 'Inactive'}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
