import heroIllustration from "../../assets/homepage-library-transformation.png"

function HomepageHeroIllustration() {
  return (
    <div className="homepage-hero-illustration" aria-hidden="true">
      <img
        className="homepage-hero-illustration-image"
        src={heroIllustration}
        alt=""
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

export default HomepageHeroIllustration
