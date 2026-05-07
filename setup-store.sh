#!/bin/bash

echo "Creating storefront integration files..."

# Create directories if they don't exist
mkdir -p src/components/layout
mkdir -p src/components/ui
mkdir -p src/pages

# 1. StoreLayout.astro (Created instead of SiteLayout.astro to prevent overwriting your existing layout)
echo "Writing src/components/layout/StoreLayout.astro..."
cat << 'EOF' > src/components/layout/StoreLayout.astro
---
// This is your store layout wrapper. 
// Snipcart requires its CSS, JS, and a hidden config div to be present on every page where a cart might be used.

interface Props {
	title?: string;
	description?: string;
}

const { 
  title = "White Hot Weld Store", 
  description = "Custom welded art and sculptures for sale." 
} = Astro.props;
---

<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
		<meta name="description" content={description} />
		<title>{title}</title>

    <!-- 1. SNIPCART CSS -->
    <link rel="preconnect" href="https://app.snipcart.com" />
    <link rel="preconnect" href="https://cdn.snipcart.com" />
    <link rel="stylesheet" href="https://cdn.snipcart.com/themes/v3.2.2/default/snipcart.css" />
	</head>
	<body>
    <!-- Main Header would go here -->
    
    <main>
		  <slot />
    </main>

    <!-- Main Footer would go here -->

    <!-- 2. SNIPCART HIDDEN CONFIG -->
    <!-- Replace data-api-key with your actual public Test or Live key from your Snipcart Dashboard -->
    <div hidden id="snipcart" data-api-key="YOUR_SNIPCART_PUBLIC_API_KEY"></div>

    <!-- 3. SNIPCART JAVASCRIPT -->
    <script async src="https://cdn.snipcart.com/themes/v3.2.2/default/snipcart.js"></script>
	</body>
</html>
EOF

# 2. BuyButton.astro
echo "Writing src/components/ui/BuyButton.astro..."
cat << 'EOF' > src/components/ui/BuyButton.astro
---
// A reusable component to handle either Stripe or Snipcart checkouts.
// This keeps your page markdown/components clean.

interface Props {
  mode: "stripe" | "snipcart";
  
  // Shared props
  name: string;
  price: number | string;
  
  // Stripe specific props
  stripeLink?: string; // e.g., https://buy.stripe.com/test_aFa8wPc04eUR6ladzQ2wU00
  
  // Snipcart specific props
  id?: string;
  url?: string;
  image?: string;
  description?: string;
}

const {
  mode,
  name,
  price,
  stripeLink,
  id,
  url,
  image,
  description
} = Astro.props;
---

{mode === "stripe" ? (
  <!-- STRIPE PAYMENT LINK INTEGRATION -->
  <a 
    href={stripeLink} 
    class="buy-button stripe-button"
    target="_blank"
    rel="noopener noreferrer"
  >
    Buy {name} - ${price}
  </a>
) : (
  <!-- SNIPCART BUTTON INTEGRATION -->
  <button 
    class="buy-button snipcart-add-item"
    data-item-id={id}
    data-item-price={price}
    data-item-url={url}
    data-item-description={description}
    data-item-image={image}
    data-item-name={name}
  >
    Add {name} to Cart - ${price}
  </button>
)}

<style>
  /* Basic styling to match the White Hot Weld premium feel */
  .buy-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: #f1f1f1;
    color: #111;
    text-transform: uppercase;
    font-weight: bold;
    letter-spacing: 0.05em;
    border: 1px solid #fff;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.3s ease;
    font-family: inherit;
  }

  .buy-button:hover {
    background-color: #111;
    color: #f1f1f1;
    border-color: #555;
  }
</style>
EOF

# 3. store-example.astro
echo "Writing src/pages/store-example.astro..."
cat << 'EOF' > src/pages/store-example.astro
---
import StoreLayout from '../components/layout/StoreLayout.astro';
import BuyButton from '../components/ui/BuyButton.astro';
---

<StoreLayout title="Store Examples | White Hot Weld">
  <section class="store-demo">
    <h1>Storefront Integration Demo</h1>
    
    <div class="product-grid">
      
      <!-- Example 1: Stripe Integration -->
      <article class="product-card">
        <img src="/images/library/store/dragon catcher/dragon_catcher_1.jpg" alt="Dragon Catcher" width="400" />
        <h2>Dragon Catcher (Stripe Example)</h2>
        <p>This button uses the ultra-lean Stripe Payment Link. Clicking it will take you directly to Stripe's secure checkout.</p>
        
        <BuyButton 
          mode="stripe"
          name="Dragon Catcher"
          price="850.00"
          ="https://buy.stripe.com/test_your_generated_link_here"
        />
      </article>

      <!-- Example 2: Snipcart Integration -->
      <article class="product-card">
        <img src="/images/library/store/dragon catcher/dragon_catcher_2.jpg" alt="Dragon Catcher Detail" width="400" />
        <h2>Dragon Catcher (Snipcart Example)</h2>
        <p>This button uses Snipcart. Clicking it will open an interactive shopping cart overlay right here on the website.</p>
        
        <!-- 
          Note: data-item-url MUST match the URL where this button lives 
          so Snipcart's servers can verify the price hasn't been tampered with.
        -->
        <BuyButton 
          mode="snipcart"
          id="dragon-catcher-01"
          name="Dragon Catcher"
          price="850.00"
          url="/store-example" 
          image="/images/library/store/dragon catcher/dragon_catcher_1.jpg"
          description="Custom welded dragon catcher physical sculpture."
        />
      </article>

    </div>
  </section>
</StoreLayout>

<style>
  .store-demo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 4rem 2rem;
    color: #fff;
  }

  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 3rem;
    margin-top: 2rem;
  }

  .product-card {
    border: 1px solid #333;
    padding: 1.5rem;
    background: rgba(20, 20, 20, 0.8);
  }

  .product-card img {
    width: 100%;
    height: auto;
    object-fit: cover;
    margin-bottom: 1rem;
    border-radius: 4px;
  }

  h1, h2 {
    font-family: serif;
    letter-spacing: 0.05em;
  }
</style>
EOF

echo "Done! You can view the demo by running your dev server and navigating to http://localhost:4321/store-example"