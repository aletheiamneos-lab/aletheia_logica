import heroIllustration from "../../assets/square-of-opposition.png"

function HomepageHeroIllustration() {
  return (
    <div className="homepage-hero-illustration" aria-hidden="true">
      <img
        className="homepage-hero-illustration-image square-of-opposition-hero-image"
        src={heroIllustration}
        alt=""
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

export default HomepageHeroIllustration
