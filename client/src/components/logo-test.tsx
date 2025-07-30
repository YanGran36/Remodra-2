import React, { useState } from 'react';

export default function LogoTest() {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className="p-4">
      <h2>Logo Test Component</h2>
      <div className="mb-4">
        <p>Status: {imageStatus}</p>
      </div>
      
      <div className="mb-4">
        <h3>Test 1: Direct URL</h3>
        <img 
          src={`/remodra-logo.png?v=${Date.now()}`}
          alt="Test Logo 1" 
          style={{ width: '100px', height: '100px', border: '1px solid red' }}
          onLoad={() => setImageStatus('loaded')}
          onError={() => setImageStatus('error')}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 2: With error handling</h3>
        <img 
          src="/remodra-logo.png?v=2" 
          alt="Test Logo 2" 
          style={{ width: '100px', height: '100px', border: '1px solid blue' }}
          onLoad={() => console.log('Logo 2 loaded successfully')}
          onError={(e) => {
            console.error('Logo 2 failed to load:', e);
            e.currentTarget.style.border = '2px solid red';
          }}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 3: Different path</h3>
        <img 
          src="http://localhost:3001/remodra-logo.png?v=3" 
          alt="Test Logo 3" 
          style={{ width: '100px', height: '100px', border: '1px solid green' }}
          onLoad={() => console.log('Logo 3 loaded successfully')}
          onError={(e) => {
            console.error('Logo 3 failed to load:', e);
            e.currentTarget.style.border = '2px solid red';
          }}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 4: Fallback approach</h3>
        <div 
          style={{ 
            width: '100px', 
            height: '100px', 
            border: '1px solid purple',
            backgroundImage: 'url(/remodra-logo.png?v=4)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 5: Test logo</h3>
        <img 
          src="/test-logo.png" 
          alt="Test Logo 5" 
          style={{ width: '100px', height: '100px', border: '1px solid orange' }}
          onLoad={() => console.log('Test logo loaded successfully')}
          onError={(e) => {
            console.error('Test logo failed to load:', e);
            e.currentTarget.style.border = '2px solid red';
          }}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 6: SVG Logo</h3>
        <img 
          src="/remodra-logo.svg" 
          alt="SVG Logo" 
          style={{ width: '100px', height: '100px', border: '1px solid yellow' }}
          onLoad={() => console.log('SVG logo loaded successfully')}
          onError={(e) => {
            console.error('SVG logo failed to load:', e);
            e.currentTarget.style.border = '2px solid red';
          }}
        />
      </div>
      
      <div className="mb-4">
        <h3>Test 7: Inline SVG</h3>
        <svg width="100" height="100" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ border: '1px solid green' }}>
          <rect width="64" height="64" rx="8" fill="#F59E0B"/>
          <text x="32" y="40" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="white">R</text>
          <circle cx="32" cy="32" r="24" stroke="white" stroke-width="2" fill="none"/>
        </svg>
      </div>
    </div>
  );
} 