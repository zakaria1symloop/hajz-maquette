import { ProAuthProvider } from '@/context/ProAuthContext';

export default function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProAuthProvider>
      {children}
    </ProAuthProvider>
  );
}
