import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EmailRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to emails page
    router.push('/emails');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p>Redirecting to email management...</p>
    </div>
  );
} 