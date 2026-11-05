import { Hero } from './landing/Hero'
import { Capabilities } from './landing/Capabilities'
import { HowItWorksPreview } from './landing/HowItWorks'
import { XaiShowcase } from './landing/XaiShowcase'
import { TreatmentShowcase } from './landing/TreatmentShowcase'
import { ResearchTrust, FinalCta } from './landing/ResearchTrust'
import { usePageTitle } from '../hooks'

/**
 * Landing page — deliberately compact. Hero → capabilities → the four-step
 * flow → two live previews → credibility → one closing CTA. Deep feature
 * tours live on /features and /how-it-works instead of stretching the home
 * page scroll.
 */
export function LandingPage() {
  usePageTitle('')
  return (
    <>
      <Hero />
      <Capabilities />
      <HowItWorksPreview />
      <XaiShowcase />
      <TreatmentShowcase />
      <ResearchTrust />
      <FinalCta />
    </>
  )
}
