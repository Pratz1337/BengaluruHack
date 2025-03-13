"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Text, Line, Html } from "@react-three/drei"

type TimelineEvent = {
  id: string
  title: string
  date: string
  description: string
  type: "post" | "comment" | "achievement"
}

const events: TimelineEvent[] = [
  {
    id: "1",
    title: "Joined Community",
    date: "Jun 15, 2022",
    description: "Started your journey in the financial community",
    type: "achievement",
  },
  {
    id: "2",
    title: "First Post",
    date: "Jun 20, 2022",
    description: "Created your first discussion thread about budgeting",
    type: "post",
  },
  {
    id: "3",
    title: "Helpful Member Badge",
    date: "Aug 5, 2022",
    description: "Received recognition for your helpful contributions",
    type: "achievement",
  },
  {
    id: "4",
    title: "Most Popular Thread",
    date: "Oct 12, 2022",
    description: "Your thread about retirement planning became the most discussed",
    type: "post",
  },
  {
    id: "5",
    title: "Verified Expert Badge",
    date: "Jan 3, 2023",
    description: "Recognized as an expert in personal finance",
    type: "achievement",
  },
]

function TimelineNode({
  event,
  position,
  isActive,
  onClick,
}: {
  event: TimelineEvent
  position: [number, number, number]
  isActive: boolean
  onClick: () => void
}) {
  const nodeRef = useRef<any>()
  const { camera } = useThree()

  useFrame(() => {
    if (nodeRef.current) {
      // Make text always face the camera
      nodeRef.current.quaternion.copy(camera.quaternion)
    }
  })

  const getNodeColor = () => {
    switch (event.type) {
      case "post":
        return "#8b5cf6" // purple
      case "comment":
        return "#3b82f6" // blue
      case "achievement":
        return "#f59e0b" // amber
      default:
        return "#8b5cf6"
    }
  }

  return (
    <group position={position}>
      {/* Node */}
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.15, 32, 32]} />
        <meshStandardMaterial
          color={getNodeColor()}
          emissive={getNodeColor()}
          emissiveIntensity={isActive ? 0.5 : 0.2}
        />
      </mesh>

      {/* Label */}
      <group ref={nodeRef} position={[0, 0.3, 0]}>
        <Text position={[0, 0, 0]} fontSize={0.15} color="#ffffff" anchorX="center" anchorY="middle">
          {event.title}
        </Text>

        {isActive && (
          <Html position={[0, -0.5, 0]} center>
            <div className="bg-white p-3 rounded-lg shadow-lg w-48 text-center">
              <h4 className="font-bold text-sm">{event.title}</h4>
              <p className="text-xs text-gray-500">{event.date}</p>
              <p className="text-xs mt-1">{event.description}</p>
            </div>
          </Html>
        )}
      </group>
    </group>
  )
}

function TimelinePath() {
  return <Line points={events.map((_, i) => [i * 2 - 4, 0, 0])} color="#8b5cf6" lineWidth={2} />
}

function TimelineScene() {
  const [activeEvent, setActiveEvent] = useState<string | null>(null)

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <TimelinePath />

      {events.map((event, i) => (
        <TimelineNode
          key={event.id}
          event={event}
          position={[i * 2 - 4, 0, 0]}
          isActive={activeEvent === event.id}
          onClick={() => setActiveEvent(event.id === activeEvent ? null : event.id)}
        />
      ))}
    </>
  )
}

export default function Timeline() {
  return (
    <div className="w-full h-[300px] bg-gray-50 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [0, 2, 5], fov: 60 }}>
        <TimelineScene />
      </Canvas>
    </div>
  )
}

