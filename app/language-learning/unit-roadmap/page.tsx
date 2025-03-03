'use client';

import { useRouter } from 'next/navigation';
import { UnitRoadmap } from '@/components/language-learning';
import { sampleUnits } from '@/components/language-learning';

export default function UnitRoadmapPage() {
  const router = useRouter();

  const handleUnitClick = (unitId: number) => {
    router.push(`/language-learning/learning-path/${unitId}`);
  };

  const handleBackClick = () => {
    router.push('/language-learning');
  };

  return (
    <UnitRoadmap 
      units={sampleUnits}
      onUnitClick={handleUnitClick}
      onBackClick={handleBackClick}
    />
  );
} 