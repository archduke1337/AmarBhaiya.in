'use client'
import React, { Suspense, useRef } from 'react'
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react'
import { useMediaQuery } from '@/components/use-media-query'

/**
 * Hero section with animated shader gradient background.
 * This is used on the landing page for visual impact.
 * Content is rendered by the page component on top of this.
 */
export const HeroDigitalSuccess = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  return (
    <section
      ref={containerRef}
      className="relative h-[50vh] min-h-[320px] max-h-[500px] overflow-hidden bg-background"
    >
      <Suspense>
        <ShaderGradientCanvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
          lazyLoad={!isMobile}
          pixelDensity={isMobile ? 0.5 : 1}
          pointerEvents="none"
        >
          <ShaderGradient
            animate="on"
            type="sphere"
            wireframe={false}
            shader="defaults"
            uTime={0}
            uSpeed={0.2}
            uStrength={0.3}
            uDensity={0.8}
            uFrequency={5.5}
            uAmplitude={3.2}
            positionX={-0.1}
            positionY={0}
            positionZ={0}
            rotationX={0}
            rotationY={130}
            rotationZ={70}
            color1="#c8885e"
            color2="#8b5a3e"
            color3="#5a8aa6"
            reflection={0.4}
            cAzimuthAngle={270}
            cPolarAngle={180}
            cDistance={0.5}
            cameraZoom={15.1}
            lightType="env"
            brightness={0.8}
            envPreset="city"
            grain="on"
            toggleAxis={false}
            zoomOut={false}
            hoverState=""
            enableTransition={false}
          />
        </ShaderGradientCanvas>
      </Suspense>
    </section>
  )
}
