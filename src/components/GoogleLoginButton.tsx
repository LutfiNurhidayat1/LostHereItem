import { GoogleLogin } from '@react-oauth/google';
import { Button } from './ui/Button';
import { FcGoogle } from 'react-icons/fc';
import { useRef } from 'react';

interface GoogleLoginButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: unknown) => void;
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/* Hidden Google Button */}
      <div ref={buttonRef} className="hidden">
        <GoogleLogin
          onSuccess={(res) => {
            if (res.credential) {
              onSuccess(res.credential);
            }
          }}
          onError={() => {
            onError?.('Google login failed');
          }}
          useOneTap={false}
        />
      </div>

      {/* Custom Button */}
      <Button
        size="large"
        fullWidth
        onClick={() => {
          const btn = buttonRef.current?.querySelector('div[role=button]') as HTMLElement;
          btn?.click();
        }}
        className="flex items-center justify-center gap-3"
      >
        <FcGoogle size={20} />
        Masuk dengan Google
      </Button>
    </>
  );
}
