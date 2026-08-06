import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/api';
import { useRoles } from '@/hooks/api/useRoles';
import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import { AboutSection, ServicesSection } from '@/components/landing/AboutServices';
import PlatformSection from '@/components/landing/PlatformSection';
import TeamSection from '@/components/landing/TeamSection';
import ContactSection from '@/components/landing/ContactSection';
import LandingFooter from '@/components/landing/LandingFooter';

const Home = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useCurrentUser();
  const { isStaff, isRider, isLoading: rolesLoading } = useRoles();

  useEffect(() => {
    if (isLoading || !user || rolesLoading) return;
    if (isStaff) navigate('/dashboard', { replace: true });
    else if (isRider) navigate('/smart-meter', { replace: true });
  }, [user, isLoading, rolesLoading, isStaff, isRider, navigate]);

  return (
    <div className="min-h-screen scroll-smooth bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <AboutSection />
        <ServicesSection />
        <PlatformSection />
        <TeamSection />
        <ContactSection />
      </main>
      <LandingFooter />
    </div>
  );
};

export default Home;
