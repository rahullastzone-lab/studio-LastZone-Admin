import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  onRefresh?: () => void;
};

export default function PageHeader({
  title,
  description,
  children,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <h1 className="font-headline text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        {description && (
          <p className="mt-1 text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
