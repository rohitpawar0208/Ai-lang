'use client';

import { useRouter } from 'next/navigation';
import { LearningPathJourney } from '@/components/language-learning';

export default function LearningPathPage() {
  const router = useRouter();

  const handleChangeUnit = (newUnitId: number) => {
    router.push(`/language-learning/learning-path/${newUnitId}`);
  };

  const handleBack = () => {
    router.push('/language-learning/unit-roadmap');
  };

  // Default to first unit if no unit is specified
  return (
    <LearningPathJourney 
      unitId={1}
      onChangeUnit={handleChangeUnit}
      onBack={handleBack}
    />
  );
} 