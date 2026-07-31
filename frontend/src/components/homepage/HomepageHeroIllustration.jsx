import AppBrandMark from "../AppBrandMark"

function HomepageHeroIllustration() {
  return (
    <div className="homepage-hero-illustration">
      <div className="homepage-brand-lockup" role="img" aria-label="Logica by A mentor">
        <AppBrandMark className="homepage-brand-mark" />
        <span className="homepage-brand-copy" aria-hidden="true">
          <span className="homepage-brand-name">Logica</span>
          <span className="homepage-brand-credit">by A mentor</span>
        </span>
      </div>
    </div>
  )
}

export default HomepageHeroIllustration
