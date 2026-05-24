"""
Section Scaffold Generator

Generates HTML/CSS scaffold files for common landing page sections
based on the frontend-design skill's section composition patterns.

Usage:
  python scaffold_section.py --section hero --style centered --output hero.html
  python scaffold_section.py --section features --style bento --output features.html
  python scaffold_section.py --section pricing --output pricing.html
  python scaffold_section.py --list
  python scaffold_section.py --help
"""

import argparse
import sys
from pathlib import Path


SECTIONS = {
    "hero": {
        "variants": ["centered", "split", "fullscreen"],
        "description": "Hero section with headline, subheadline, CTA buttons",
    },
    "features": {
        "variants": ["grid", "bento", "alternating"],
        "description": "Feature showcase section",
    },
    "pricing": {
        "variants": ["cards", "comparison"],
        "description": "Pricing tiers section",
    },
    "testimonials": {
        "variants": ["carousel", "grid", "marquee"],
        "description": "Testimonials/social proof section",
    },
    "faq": {
        "variants": ["accordion"],
        "description": "Frequently asked questions section",
    },
    "cta": {
        "variants": ["centered", "split"],
        "description": "Call-to-action section",
    },
    "footer": {
        "variants": ["multi-column", "minimal"],
        "description": "Footer with links and info",
    },
    "trust": {
        "variants": ["marquee", "grid"],
        "description": "Trust logos / featured-in section",
    },
}


TEMPLATES = {
    "hero-centered": """<section class="hero" id="hero">
  <div class="container">
    <span class="hero-tag">Your Tagline Here</span>
    <h1 class="hero-title">Your Headline Goes Here</h1>
    <p class="hero-subtitle">A brief description of your value proposition. Keep it under two lines for maximum impact.</p>
    <div class="hero-actions">
      <a href="#" class="btn btn-primary">Get Started</a>
      <a href="#" class="btn btn-secondary">Learn More</a>
    </div>
    <div class="hero-image">
      <!-- Product screenshot, 3D element, or illustration -->
      <img src="placeholder.png" alt="Product preview" />
    </div>
  </div>
</section>

<style>
.hero {
  padding: var(--space-32) var(--space-4);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero .container {
  max-width: var(--width-page);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
}

.hero-tag {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-primary);
  padding: var(--space-1) var(--space-3);
  border: 1px solid hsl(var(--color-primary-hsl) / 0.3);
  border-radius: var(--radius-full);
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, var(--text-7xl));
  font-weight: 700;
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  max-width: 15ch;
  text-wrap: balance;
}

.hero-subtitle {
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  color: hsl(var(--color-fg-hsl) / 0.7);
  max-width: 50ch;
}

.hero-actions {
  display: flex;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.hero-image {
  margin-top: var(--space-12);
  max-width: 900px;
  width: 100%;
}

.hero-image img {
  width: 100%;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}
</style>
""",
    "hero-split": """<section class="hero hero-split" id="hero">
  <div class="container">
    <div class="hero-content">
      <span class="hero-tag">Your Tagline Here</span>
      <h1 class="hero-title">Your Headline Goes Here</h1>
      <p class="hero-subtitle">A brief description of your value proposition.</p>
      <div class="hero-actions">
        <a href="#" class="btn btn-primary">Get Started</a>
        <a href="#" class="btn btn-secondary">Learn More</a>
      </div>
    </div>
    <div class="hero-visual">
      <!-- Product screenshot, 3D element, or illustration -->
      <img src="placeholder.png" alt="Product preview" />
    </div>
  </div>
</section>

<style>
.hero-split .container {
  max-width: var(--width-page);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  align-items: center;
  padding: var(--space-32) var(--space-4);
}

@media (max-width: 768px) {
  .hero-split .container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .hero-content { order: 2; }
  .hero-visual { order: 1; }
}
</style>
""",
    "features-grid": """<section class="features" id="features">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Features</span>
      <h2 class="section-title">Everything You Need</h2>
      <p class="section-subtitle">A brief description of your feature set.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon"><!-- Icon --></div>
        <h3 class="feature-title">Feature One</h3>
        <p class="feature-description">Brief description of this feature and its benefit.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><!-- Icon --></div>
        <h3 class="feature-title">Feature Two</h3>
        <p class="feature-description">Brief description of this feature and its benefit.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><!-- Icon --></div>
        <h3 class="feature-title">Feature Three</h3>
        <p class="feature-description">Brief description of this feature and its benefit.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><!-- Icon --></div>
        <h3 class="feature-title">Feature Four</h3>
        <p class="feature-description">Brief description of this feature and its benefit.</p>
      </div>
    </div>
  </div>
</section>

<style>
.features {
  padding: var(--space-24) var(--space-4);
}

.features .container {
  max-width: var(--width-page);
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: var(--space-12);
}

.section-tag {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--color-primary);
}

.section-title {
  font-size: var(--text-4xl);
  margin-top: var(--space-3);
}

.section-subtitle {
  font-size: var(--text-lg);
  color: hsl(var(--color-fg-hsl) / 0.7);
  max-width: 50ch;
  margin: var(--space-3) auto 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-6);
}

.feature-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  transition: transform var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  color: var(--color-primary);
}

.feature-title {
  font-size: var(--text-xl);
  margin-bottom: var(--space-2);
}

.feature-description {
  font-size: var(--text-sm);
  color: hsl(var(--color-fg-hsl) / 0.7);
  line-height: var(--leading-relaxed);
}
</style>
""",
    "features-bento": """<section class="features-bento" id="features">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Features</span>
      <h2 class="section-title">Everything You Need</h2>
    </div>
    <div class="bento-grid">
      <div class="bento-item bento-large">
        <h3>Primary Feature</h3>
        <p>Detailed description of the main feature.</p>
      </div>
      <div class="bento-item">
        <h3>Feature Two</h3>
        <p>Brief description.</p>
      </div>
      <div class="bento-item">
        <h3>Feature Three</h3>
        <p>Brief description.</p>
      </div>
      <div class="bento-item bento-wide">
        <h3>Feature Four</h3>
        <p>Short description of a wider feature.</p>
      </div>
      <div class="bento-item">
        <h3>Feature Five</h3>
        <p>Brief description.</p>
      </div>
    </div>
  </div>
</section>

<style>
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 200px;
  gap: var(--space-4);
  max-width: var(--width-page);
  margin: 0 auto;
}

.bento-item {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.bento-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-wide {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
  }
  .bento-large, .bento-wide {
    grid-column: span 1;
    grid-row: span 1;
  }
}
</style>
""",
    "pricing-cards": """<section class="pricing" id="pricing">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">Pricing</span>
      <h2 class="section-title">Simple, Transparent Pricing</h2>
      <p class="section-subtitle">Choose the plan that fits your needs.</p>
    </div>
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3 class="pricing-name">Free</h3>
        <div class="pricing-price">$0<span>/mo</span></div>
        <p class="pricing-desc">For individuals getting started.</p>
        <ul class="pricing-features">
          <li>Feature one</li>
          <li>Feature two</li>
          <li>Feature three</li>
        </ul>
        <a href="#" class="btn btn-secondary">Get Started</a>
      </div>
      <div class="pricing-card pricing-featured">
        <span class="pricing-badge">Most Popular</span>
        <h3 class="pricing-name">Pro</h3>
        <div class="pricing-price">$29<span>/mo</span></div>
        <p class="pricing-desc">For growing teams.</p>
        <ul class="pricing-features">
          <li>Everything in Free</li>
          <li>Feature four</li>
          <li>Feature five</li>
          <li>Priority support</li>
        </ul>
        <a href="#" class="btn btn-primary">Get Started</a>
      </div>
      <div class="pricing-card">
        <h3 class="pricing-name">Enterprise</h3>
        <div class="pricing-price">Custom</div>
        <p class="pricing-desc">For large organizations.</p>
        <ul class="pricing-features">
          <li>Everything in Pro</li>
          <li>Custom integrations</li>
          <li>Dedicated support</li>
          <li>SLA guarantee</li>
        </ul>
        <a href="#" class="btn btn-secondary">Contact Sales</a>
      </div>
    </div>
  </div>
</section>

<style>
.pricing {
  padding: var(--space-24) var(--space-4);
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
  max-width: 960px;
  margin: 0 auto;
  align-items: start;
}

.pricing-card {
  padding: var(--space-8);
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  text-align: center;
  position: relative;
}

.pricing-featured {
  border-color: var(--color-primary);
  box-shadow: 0 0 30px hsl(var(--color-primary-hsl) / 0.15);
  transform: scale(1.05);
}

.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-primary);
  color: white;
  font-size: var(--text-xs);
  font-weight: 600;
  padding: var(--space-1) var(--space-4);
  border-radius: var(--radius-full);
  letter-spacing: var(--tracking-wide);
}

.pricing-price {
  font-family: var(--font-display);
  font-size: var(--text-5xl);
  font-weight: 700;
  margin: var(--space-4) 0;
}

.pricing-price span {
  font-size: var(--text-lg);
  font-weight: 400;
  opacity: 0.6;
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: var(--space-6) 0;
  text-align: left;
}

.pricing-features li {
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
}

@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
    max-width: 400px;
  }
  .pricing-featured { transform: none; }
}
</style>
""",
    "faq-accordion": """<section class="faq" id="faq">
  <div class="container">
    <div class="section-header">
      <span class="section-tag">FAQ</span>
      <h2 class="section-title">Frequently Asked Questions</h2>
    </div>
    <div class="faq-list">
      <details class="faq-item">
        <summary class="faq-question">Question one goes here?</summary>
        <div class="faq-answer">
          <p>Detailed answer to the question. Keep it concise but informative.</p>
        </div>
      </details>
      <details class="faq-item">
        <summary class="faq-question">Question two goes here?</summary>
        <div class="faq-answer">
          <p>Detailed answer to the question.</p>
        </div>
      </details>
      <details class="faq-item">
        <summary class="faq-question">Question three goes here?</summary>
        <div class="faq-answer">
          <p>Detailed answer to the question.</p>
        </div>
      </details>
    </div>
  </div>
</section>

<style>
.faq {
  padding: var(--space-24) var(--space-4);
}

.faq-list {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.faq-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.faq-question {
  padding: var(--space-5) var(--space-6);
  cursor: pointer;
  font-weight: 500;
  font-size: var(--text-lg);
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-question::-webkit-details-marker { display: none; }

.faq-question::after {
  content: '+';
  font-size: var(--text-xl);
  color: var(--color-muted);
  transition: transform var(--duration-fast) var(--ease-out);
}

.faq-item[open] .faq-question::after {
  transform: rotate(45deg);
}

.faq-answer {
  padding: 0 var(--space-6) var(--space-5);
  color: hsl(var(--color-fg-hsl) / 0.7);
  line-height: var(--leading-relaxed);
}
</style>
""",
    "trust-marquee": """<section class="trust" id="trust">
  <div class="trust-inner">
    <p class="trust-label">Trusted by teams at</p>
    <div class="marquee">
      <div class="marquee-content">
        <img src="logo1.svg" alt="Company 1" class="trust-logo" />
        <img src="logo2.svg" alt="Company 2" class="trust-logo" />
        <img src="logo3.svg" alt="Company 3" class="trust-logo" />
        <img src="logo4.svg" alt="Company 4" class="trust-logo" />
        <img src="logo5.svg" alt="Company 5" class="trust-logo" />
        <!-- Duplicate for seamless loop -->
        <img src="logo1.svg" alt="Company 1" class="trust-logo" />
        <img src="logo2.svg" alt="Company 2" class="trust-logo" />
        <img src="logo3.svg" alt="Company 3" class="trust-logo" />
        <img src="logo4.svg" alt="Company 4" class="trust-logo" />
        <img src="logo5.svg" alt="Company 5" class="trust-logo" />
      </div>
    </div>
  </div>
</section>

<style>
.trust {
  padding: var(--space-12) 0;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.trust-label {
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-muted);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  margin-bottom: var(--space-6);
}

.marquee {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-flex;
  gap: var(--space-12);
  align-items: center;
  animation: marquee 30s linear infinite;
}

.trust-logo {
  height: 28px;
  opacity: 0.5;
  filter: grayscale(100%);
  transition: opacity var(--duration-fast) ease, filter var(--duration-fast) ease;
}

.trust-logo:hover {
  opacity: 1;
  filter: grayscale(0%);
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
</style>
""",
}


def list_sections():
    """Print available sections and variants."""
    print("\nAvailable Sections:")
    print("=" * 50)
    for name, info in SECTIONS.items():
        print(f"\n  {name}")
        print(f"    {info['description']}")
        print(f"    Variants: {', '.join(info['variants'])}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Generate HTML/CSS scaffold for landing page sections.",
    )
    parser.add_argument(
        "--section", choices=SECTIONS.keys(), help="Section type to generate"
    )
    parser.add_argument(
        "--style", help="Style variant (e.g., centered, split, grid, bento)"
    )
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument(
        "--list", action="store_true", help="List available sections and variants"
    )

    args = parser.parse_args()

    if args.list:
        list_sections()
        sys.exit(0)

    if not args.section:
        print("Error: --section is required. Use --list to see available sections.")
        sys.exit(1)

    # Determine variant
    section = args.section
    variant = args.style or SECTIONS[section]["variants"][0]
    template_key = f"{section}-{variant}"

    if template_key not in TEMPLATES:
        available = ", ".join(SECTIONS[section]["variants"])
        print(f"Error: variant '{variant}' not found for '{section}'.")
        print(f"Available variants: {available}")
        sys.exit(1)

    html = TEMPLATES[template_key]
    output = args.output or f"{section}-{variant}.html"

    Path(output).write_text(html, encoding="utf-8")
    print(f"Section scaffold written to: {output}")
    print(f"Section: {section} ({variant})")


if __name__ == "__main__":
    main()
