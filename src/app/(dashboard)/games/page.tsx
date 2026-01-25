'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
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
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import AddGameForm from '@/components/games/AddGameForm';

export type Game = {
  id: string;
  name: string;
  cover_image: string;
  package_name: string;
  is_active: boolean;
};

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching games",
        description: error.message,
        variant: "destructive"
      });
    } else {
      // Filter out any games that might have empty names or invalid data
      const validGames = (data as Game[] || []).filter(g => g.name && g.name.trim() !== '');
      setGames(validGames);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('games').delete().eq('id', id);
      if (error) throw error;

      setGames((prevGames) => prevGames.filter((game) => game.id !== id));
      toast({
        title: 'Game Deleted',
        description: 'The game has been successfully removed.',
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

  const toggleStatus = async (game: Game, checked: boolean) => {
    // Optimistic Update
    setGames(games.map(g => g.id === game.id ? { ...g, is_active: checked } : g));

    try {
      const { error } = await supabase
        .from('games')
        .update({ is_active: checked })
        .eq('id', game.id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Game is now ${checked ? 'Active' : 'Coming Soon'}.`
      });
    } catch (error: any) {
      // Revert if error
      setGames(games.map(g => g.id === game.id ? { ...g, is_active: !checked } : g));
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (game: Game) => {
    setGameToEdit(game);
    setIsAddGameOpen(true);
  };

  if (isLoading && games.length === 0) {
    return <div className="p-8">Loading games...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Game Management"
        description="Manage the games available for tournaments."
        onRefresh={fetchGames}
      >
        <Button onClick={() => { setGameToEdit(null); setIsAddGameOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Game
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Available Games</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {games.length > 0 ? (
            games.map((game) => (
              <Card key={game.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-video w-full bg-muted">
                  {game.cover_image ? (
                    <Image
                      src={game.cover_image}
                      alt={game.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={game.is_active ? "default" : "secondary"}>
                      {game.is_active ? "Active" : "Coming Soon"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col flex-grow p-4">
                  <div className="flex-grow">
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <CardDescription className="mt-1 text-xs truncate" title={game.package_name}>
                      {game.package_name}
                    </CardDescription>
                  </div>

                  <div className="mt-4 flex items-center space-x-2">
                    <Switch
                      id={`switch-${game.id}`}
                      checked={game.is_active}
                      onCheckedChange={(checked) => toggleStatus(game, checked)}
                    />
                    <Label htmlFor={`switch-${game.id}`} className="text-sm cursor-pointer text-muted-foreground">
                      {game.is_active ? 'Active' : 'Coming Soon'}
                    </Label>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleEdit(game)}
                    >
                      <Edit className="mr-1.5 h-3 w-3" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="flex-1 text-xs">
                          <Trash2 className="mr-1.5 h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the game "{game.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(game.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              No games found. Add one to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <AddGameForm
        open={isAddGameOpen}
        onOpenChange={setIsAddGameOpen}
        onSuccess={fetchGames}
        gameToEdit={gameToEdit}
      />
    </div>
  );
}
