'use client';

import { useRouter } from 'next/navigation';
import { LearningPathJourney } from '@/components/language-learning';

export default function ChapterPage({ params }: { params: { chapterId: string } }) {
  const router = useRouter();
  const chapterId = parseInt(params.chapterId, 10);

  const handleChangeUnit = (newUnitId: number) => {
    router.push(`/language-learning/learning-path/${newUnitId}`);
  };

  const handleBack = () => {
    router.push('/language-learning/unit-roadmap');
  };

  return (
    <LearningPathJourney 
      unitId={chapterId}
      onChangeUnit={handleChangeUnit}
      onBack={handleBack}
    />
  );
} 