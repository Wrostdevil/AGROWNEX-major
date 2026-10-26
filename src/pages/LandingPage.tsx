import { Hero } from './landing/Hero'
import { Capabilities } from './landing/Capabilities'
import { FeatureShowcase } from './landing/FeatureShowcase'
import { XaiShowcase } from './landing/XaiShowcase'
import { TreatmentShowcase } from './landing/TreatmentShowcase'
import { CommunityShowcase } from './landing/CommunityShowcase'
import { ResearchTrust, FinalCta } from './landing/ResearchTrust'
import { HowItWorksPreview } from './landing/HowItWorks'
import { usePageTitle } from '../hooks'

export function LandingPage() {
  usePageTitle('')
  return (
    <>
      <Hero />
      <Capabilities />
      <FeatureShowcase />
      <XaiShowcase />
      <TreatmentShowcase />
      <CommunityShowcase />
      <ResearchTrust />
      <HowItWorksPreview />
      <FinalCta />
    </>
  )
}
