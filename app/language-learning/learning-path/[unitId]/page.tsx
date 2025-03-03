'use client';

import { useRouter } from 'next/navigation';
import { LearningPathJourney } from '@/components/language-learning';

export default function LearningPathPage({ params }: { params: { unitId: string } }) {
  const router = useRouter();
  const unitId = parseInt(params.unitId, 10);

  const handleChangeUnit = (newUnitId: number) => {
    router.push(`/language-learning/learning-path/${newUnitId}`);
  };

  const handleBack = () => {
    router.push('/language-learning/unit-roadmap');
  };

  return (
    <LearningPathJourney 
      unitId={unitId}
      onChangeUnit={handleChangeUnit}
      onBack={handleBack}
    />
  );
} 