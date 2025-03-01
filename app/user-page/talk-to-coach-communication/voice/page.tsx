import { AryaVoicePracticeComponent } from "@/components/components-arya-voice-practice"

export default function Page() {
  return <AryaVoicePracticeComponent 
    topic="Grammar" 
    initialPrompt="I want to learn grammar." 
    difficulty="Beginner" // Changed difficulty to a valid type
    onComplete={() => console.log("Completed")} // Added onComplete callback
  />
}

// 'use client'

// import { useSearchParams } from 'next/navigation'
// import { AryaVoicePracticeComponent } from "@/components/components-arya-voice-practice"

// export default function AryaVoicePracticeComponent() {
//   const searchParams = useSearchParams()
//   const topic = searchParams.get('topic') || 'Small Talk'; // Default to 'Small Talk' if not provided
//   const category = searchParams.get('category') || 'General'; // Default category
//   const difficulty = searchParams.get('difficulty') || 'Easy'; // Default difficulty

//   // Generate a prompt for the AI model based on the selected topic
//   const aiPrompt = `Let's have a conversation about ${topic}. This is a ${category} topic at a ${difficulty} level. Please guide the student through a small talk scenario related to this topic.`;

//   return (
//     <div>
//       {/* <h1>Chat with AI Coach</h1>
//       <p>Topic: {topic}</p>
//       <p>Category: {category}</p>
//       <p>Difficulty: {difficulty}</p> */}
//       < AryaVoicePracticeComponent topic={topic} initialPrompt={aiPrompt} />
//     </div>
//   )
// }