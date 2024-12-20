/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleAdProps } from '@/interfaces/googleAdProps';
import { useEffect } from 'react';
import { trackAdEvent } from '@/utils/analytics';

const isDevelopment = process.env.NODE_ENV === 'development';

export const GoogleAd: React.FC<GoogleAdProps> = ({
  adSlot,
  adClient = 'ca-pub-6552957595045294',
  adFormat = 'auto',
  fullWidthResponsive = true,
  style = { display: 'block' }
}) => {
  useEffect(() => {
    if (!isDevelopment) {
      try {
        trackAdEvent('impression', {
          ad_unit_id: adSlot,
          format: adFormat,
          platform: 'adsense'
        });

        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});

        const adContainer = document.querySelector(`[data-ad-slot="${adSlot}"]`);
        const handleAdClick = () => {
          trackAdEvent('click', {
            ad_unit_id: adSlot,
            format: adFormat,
            platform: 'adsense'
          });
        };

        adContainer?.addEventListener('click', handleAdClick);

        return () => {
          adContainer?.removeEventListener('click', handleAdClick);
        };
      } catch (error) {
        console.error('Error loading Google AdSense:', error);
      }
    }
  }, [adSlot, adFormat]);

  if (isDevelopment) {
    type AdSize = {
      width: string;
      height?: string;
      minHeight?: string;
    };

    const adSizes: Record<string, AdSize> = {
      'Responsive': { width: '100%', minHeight: '250px' },
      'Large Rectangle': { width: '336px', height: '280px' },
      'Medium Rectangle': { width: '300px', height: '280px' },
      'Leaderboard': { width: '728px', height: '90px' },
      'Mobile Banner': { width: '320px', height: '100px' }
    };

    const size = adFormat === 'auto' ? adSizes.Responsive : adSizes['Medium Rectangle'];
    const heightStyle = size.minHeight ? { minHeight: size.minHeight } : { height: size.height };

    return (
      <div
        className="ad-placeholder"
        style={{
          ...style,
          width: size.width,
          ...heightStyle,
          background: '#ffeb3b',
          border: '4px dashed #f44336',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '2rem auto',
          padding: '2rem',
          borderRadius: '8px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 10
        }}
      >
        <div 
          style={{ 
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}
        >
          {adFormat === 'auto' ? 'Responsive' : `${size.width} × ${size.height}`}
        </div>
        <div style={{ 
          textAlign: 'center', 
          color: '#333',
          fontWeight: 'bold',
          fontSize: '1.2rem'
        }}>
          <p style={{ marginBottom: '8px' }}>📢 Ad Placeholder</p>
          <p style={{ fontSize: '1rem', opacity: 0.8 }}>Slot: {adSlot}</p>
          <p style={{ 
            fontSize: '0.9rem', 
            marginTop: '8px',
            background: '#f44336',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>Development Mode</p>
        </div>
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={style}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
};

export default GoogleAd;
