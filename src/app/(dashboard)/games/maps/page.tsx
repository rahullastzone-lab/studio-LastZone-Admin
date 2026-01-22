'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Upload, ImageIcon } from 'lucide-react';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import Image from 'next/image';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Map = {
    id: string;
    name: string;
    game_id: string;
    image_url: string | null;
    game: {
        name: string;
    };
};

export default function MapsPage() {
    const [maps, setMaps] = useState<Map[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedMap, setSelectedMap] = useState<Map | null>(null);
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        fetchMaps();
    }, []);

    const fetchMaps = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('maps')
            .select('*, game:games(name)') // Assuming foreign key relationship is named or auto-detected. If not, we might need explicit join logic or ensure FK name.
            .order('game_id', { ascending: true })
            .order('name', { ascending: true });

        if (error) {
            toast({
                title: "Error fetching maps",
                description: error.message,
                variant: "destructive"
            });
        } else {
            setMaps(data as unknown as Map[] || []);
        }
        setIsLoading(false);
    };

    const handleEdit = (map: Map) => {
        setSelectedMap(map);
        setUploadedImage(null);
        setIsEditOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadedImage(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!selectedMap || !uploadedImage) return;

        setIsUploading(true);
        try {
            const fileExt = uploadedImage.name.split('.').pop();
            const fileName = `${selectedMap.game.name}_${selectedMap.name}_${Date.now()}.${fileExt}`.replace(/\s+/g, '_');
            const filePath = `maps/${fileName}`;

            // 1. Upload Image
            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, uploadedImage);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            // 3. Update Database
            const { error: updateError } = await supabase
                .from('maps')
                .update({ image_url: publicUrl })
                .eq('id', selectedMap.id);

            if (updateError) throw updateError;

            toast({
                title: "Map Updated",
                description: "Map image has been successfully updated.",
            });

            setIsEditOpen(false);
            fetchMaps();

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    // Group maps by Game
    const groupedMaps = maps.reduce((acc, map) => {
        const gameName = map.game?.name || 'Unknown Game';
        if (!acc[gameName]) acc[gameName] = [];
        acc[gameName].push(map);
        return acc;
    }, {} as Record<string, Map[]>);

    if (isLoading && maps.length === 0) {
        return <div className="p-8">Loading maps...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Map Management"
                description="Manage map images for all games."
            />

            {Object.entries(groupedMaps).map(([gameName, gameMaps]) => (
                <Card key={gameName} className="overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b font-semibold text-lg">
                        {gameName}
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {gameMaps.map((map) => (
                                <div key={map.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-16 w-28 bg-muted rounded-md overflow-hidden border">
                                            {map.image_url ? (
                                                <Image
                                                    src={map.image_url}
                                                    alt={map.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                                    <ImageIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="font-medium">{map.name}</div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(map)}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Update Image
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Map Image - {selectedMap?.name}</DialogTitle>
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
                                className="col-span-3"
                                onChange={handleFileChange}
                            />
                        </div>
                        {uploadedImage && (
                            <div className="text-sm text-muted-foreground text-center">
                                Selected: {uploadedImage.name}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button onClick={handleSave} disabled={isUploading || !uploadedImage}>
                            {isUploading ? "Uploading..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
