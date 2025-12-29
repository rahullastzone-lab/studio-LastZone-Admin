
'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category?: string;
};

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [currentFaq, setCurrentFaq] = useState<Partial<FAQ> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching FAQs",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setFaqs(data as FAQ[] || []);
    }
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('faqs').delete().eq('id', id);
      if (error) throw error;

      setFaqs((prevFaqs) => prevFaqs.filter((faq) => faq.id !== id));
      toast({
        title: 'FAQ Deleted',
        description: 'The FAQ has been successfully removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (faq: Partial<FAQ> | null = null) => {
    setCurrentFaq(faq || { question: '', answer: '', category: 'General' });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentFaq?.question || !currentFaq?.answer) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Question and Answer fields cannot be empty.',
      });
      return;
    }

    try {
      if (currentFaq.id) {
        // Update
        const { error } = await supabase
          .from('faqs')
          .update({
            question: currentFaq.question,
            answer: currentFaq.answer,
            category: currentFaq.category
          })
          .eq('id', currentFaq.id);

        if (error) throw error;

        toast({
          title: 'FAQ Updated',
          description: 'The FAQ has been successfully updated.',
        });
      } else {
        // Create
        const { error } = await supabase
          .from('faqs')
          .insert({
            question: currentFaq.question,
            answer: currentFaq.answer,
            category: currentFaq.category || 'General'
          });

        if (error) throw error;

        toast({
          title: 'FAQ Added',
          description: 'A new FAQ has been successfully created.',
        });
      }
      fetchFaqs(); // Refresh list
      setIsDialogOpen(false);
      setCurrentFaq(null);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (isLoading && faqs.length === 0) {
    return <div className="p-8">Loading FAQs...</div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="FAQs Management"
        description="Manage Frequently Asked Questions."
      >
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New FAQ
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Existing FAQs</CardTitle>
          <CardDescription>Click on a question to expand, edit, or delete it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.length > 0 ? faqs.map((faq) => (
              <AccordionItem value={faq.id} key={faq.id}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>
                  <p className="mb-4">{faq.answer}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(faq)}
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the FAQ.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(faq.id)}
                          >
                            Continue
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )) : (
              <div className="text-center text-muted-foreground p-8">
                No FAQs found. Add one to get started.
              </div>
            )}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {currentFaq?.id ? 'Edit FAQ' : 'Add New FAQ'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="question" className="text-right">
                Question
              </Label>
              <Input
                id="question"
                value={currentFaq?.question || ''}
                onChange={(e) =>
                  setCurrentFaq({ ...currentFaq, question: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="answer" className="text-right">
                Answer
              </Label>
              <Textarea
                id="answer"
                value={currentFaq?.answer || ''}
                onChange={(e) =>
                  setCurrentFaq({ ...currentFaq, answer: e.target.value })
                }
                className="col-span-3"
                rows={5}
              />
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
