import NavigationLayout from '../components/NavigationLayout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return <NavigationLayout>{children}</NavigationLayout>;
}
