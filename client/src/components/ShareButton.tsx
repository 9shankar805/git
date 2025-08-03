
import React from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { 
  generateProductDeepLink, 
  generateStoreDeepLink, 
  generateShareableProductLink 
} from '@/lib/deepLinking';

interface ShareButtonProps {
  type: 'product' | 'store' | 'custom';
  id?: number;
  url?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function ShareButton({ 
  type, 
  id, 
  url, 
  title = 'Check this out!', 
  description = 'Found something amazing on Siraha Bazaar',
  className 
}: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const getShareUrl = () => {
    if (url) return url;
    
    switch (type) {
      case 'product':
        return id ? generateShareableProductLink(id, 'share_button') : window.location.href;
      case 'store':
        return id ? generateStoreDeepLink(id, { utm_source: 'share_button' }) : window.location.href;
      default:
        return window.location.href;
    }
  };

  const shareUrl = getShareUrl();

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
        toast({
          title: "Shared successfully!",
          description: "Content shared via native sharing.",
        });
      } catch (error) {
        console.log('Native sharing cancelled or failed');
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleAndroidShare = () => {
    // Check if Android bridge is available
    if ((window as any).shareDeepLink) {
      (window as any).shareDeepLink(shareUrl, title, description);
    } else {
      handleNativeShare();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleAndroidShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <Check className="h-4 w-4 mr-2 text-green-600" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? 'Copied!' : 'Copy Link'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
