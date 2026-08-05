import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'

export default function Output() {
  const { height, width } = useThree(st => st.viewport)

  return (
    <group position={[-(width / 2 - 0.05), height / 2 - 0.05, 2]}>
      <Text anchorX="left" anchorY="top" fontSize={0.02} fontWeight={300} color={"ffffff"}>
        I am an AI engineer, full stack; top ~0.10% token user{'\n'}
        &amp; have been coding since I was 14{'\n'}
        w/ 4 years of professional experience
      </Text>
    </group>
  )
}
