'use client';

import { useState, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface GameData {
    id?: string;
    name: string;
    package_name: string;
    cover_image: string;
}

interface AddGameFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    gameToEdit?: GameData | null;
}

export default function AddGameForm({ open, onOpenChange, onSuccess, gameToEdit }: AddGameFormProps) {
    const [name, setName] = useState('');
    const [packageName, setPackageName] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    // Effect to populate form when editing
    useEffect(() => {
        if (open) {
            if (gameToEdit) {
                setName(gameToEdit.name);
                setPackageName(gameToEdit.package_name);
                setPreviewUrl(gameToEdit.cover_image);
                setImageFile(null); // Reset file input
            } else {
                resetForm();
            }
        }
    }, [open, gameToEdit]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            resetForm();
        }
        onOpenChange(newOpen);
    };

    const resetForm = () => {
        setName('');
        setPackageName('');
        setImageFile(null);
        setPreviewUrl(null);
        setIsSubmitting(false);
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                title: 'Invalid file type',
                description: 'Please upload an image file.',
                variant: 'destructive',
            });
            return;
        }

        setImageFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast({ title: 'Validation Error', description: 'Game name is required.', variant: 'destructive' });
            return;
        }
        if (!packageName.trim()) {
            toast({ title: 'Validation Error', description: 'Package name is required.', variant: 'destructive' });
            return;
        }
        // If creating new, image is required. If editing, it's optional (keep existing).
        if (!gameToEdit && !imageFile) {
            toast({ title: 'Validation Error', description: 'Please select a game image.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);

        try {
            let publicUrl = previewUrl;

            // 1. Upload Image (only if NEW file selected)
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_${name.replace(/\s+/g, '_').toLowerCase()}.${fileExt}`;
                const filePath = `games/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(filePath, imageFile);

                if (uploadError) {
                    throw new Error(`Upload failed: ${uploadError.message}`);
                }

                const { data } = supabase.storage
                    .from('images')
                    .getPublicUrl(filePath);

                publicUrl = data.publicUrl;
            }

            // 2. Insert or Update Database
            if (gameToEdit?.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('games')
                    .update({
                        name: name,
                        cover_image: publicUrl,
                        package_name: packageName,
                    })
                    .eq('id', gameToEdit.id);

                if (updateError) throw new Error(`Update failed: ${updateError.message}`);

                toast({ title: 'Success', description: 'Game updated successfully!' });
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('games')
                    .insert({
                        name: name,
                        cover_image: publicUrl,
                        package_name: packageName // Using the correct state variable
                    });

                if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

                toast({ title: 'Success', description: 'Game added successfully!' });
            }

            onSuccess();
            handleOpenChange(false);

        } catch (error: any) {
            console.error('Error saving game:', error);
            toast({
                title: 'Error',
                description: error.message || 'Something went wrong.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{gameToEdit ? 'Edit Game' : 'Add New Game'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Name Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. BGMI"
                        />
                    </div>

                    {/* Image Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="game-image" className="text-right">
                            {gameToEdit ? 'New Image' : 'Game Image'}
                        </Label>
                        <div className="col-span-3">
                            <Input
                                id="game-image"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="cursor-pointer"
                            />
                            {gameToEdit && <p className="text-xs text-muted-foreground mt-1">Leave empty to keep current image</p>}
                        </div>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                        <div className="grid grid-cols-4 gap-4">
                            <div className="col-start-2 col-span-3">
                                <div className="relative h-32 w-full overflow-hidden rounded-md border border-input">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Package Name Field */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="package-name" className="text-right">
                            Package Name
                        </Label>
                        <Input
                            id="package-name"
                            value={packageName}
                            onChange={(e) => setPackageName(e.target.value)}
                            className="col-span-3"
                            placeholder="e.g. com.pubg.imobile"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : (gameToEdit ? 'Update Game' : 'Save Changes')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
