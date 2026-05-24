# Split Phase

**Category:** Additional Techniques  
**Sources:** Fowler Ch.6

## Problem

A piece of code does two distinct things using two different sets of data. The phases are mixed together, making both harder to understand.

## Motivation

When code mixes two stages of processing (e.g., parsing and calculating, or pricing and shipping), split them into separate phases connected by an intermediate data structure. Each phase can be understood and modified independently.

## Java 8 Example

```java
// BEFORE: pricing and shipping mixed in one function
double priceOrder(Product product, int quantity, ShippingMethod shipping) {
    double basePrice = product.getBasePrice() * quantity;
    double discount = Math.max(quantity - product.getDiscountThreshold(), 0)
        * product.getBasePrice() * product.getDiscountRate();
    double shippingPerCase = (basePrice > shipping.getDiscountThreshold())
        ? shipping.getDiscountedFee() : shipping.getFeePerCase();
    double shippingCost = quantity * shippingPerCase;
    return basePrice - discount + shippingCost;
}

// AFTER: two clear phases with intermediate data
double priceOrder(Product product, int quantity, ShippingMethod shipping) {
    PriceData priceData = calculatePriceData(product, quantity);
    return applyShipping(priceData, quantity, shipping);
}

// Phase 1: pricing (no shipping knowledge)
PriceData calculatePriceData(Product product, int quantity) {
    double basePrice = product.getBasePrice() * quantity;
    double discount = Math.max(quantity - product.getDiscountThreshold(), 0)
        * product.getBasePrice() * product.getDiscountRate();
    return new PriceData(basePrice, discount);
}

// Phase 2: shipping (no product knowledge)
double applyShipping(PriceData priceData, int quantity, ShippingMethod shipping) {
    double shippingPerCase = (priceData.basePrice > shipping.getDiscountThreshold())
        ? shipping.getDiscountedFee() : shipping.getFeePerCase();
    return priceData.basePrice - priceData.discount + quantity * shippingPerCase;
}
```

## Related Smells

Divergent Change, Long Method
