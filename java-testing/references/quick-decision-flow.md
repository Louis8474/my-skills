# Quick Decision Flow: "I Can't Test X" (Java)

When the user says "I can't test X", follow this decision tree to identify the right technique and reference file.

## Can I instantiate the class?

**NO** →
- Constructor with heavy parameters → **Parameterize Constructor** or **Pass Null** (`dependency-breaking.md`, `pass-null-subclass-override.md`)
- Hidden dependencies (internal `new`) → **Extract and Override Factory Method** (`dependency-breaking.md`)
- Too many constructor params (onion) → **Pass Null** for unused ones (`pass-null-subclass-override.md`)
- Singleton/Global → **Introduce Static Setter** or **Replace Global Reference with Getter** (`dependency-breaking.md`)
- Long method with many locals → **Break Out Method Object** (`pass-null-subclass-override.md`)

## Can I run the method?

**NO** →
- Private method → Change to package-private or **Extract Class**
- Final class → **Adapt Parameter** (`dependency-breaking.md`)
- Static method dependency → **Skin and Wrap the API** (`method-object-skin-wrap.md`)
- Invisible side effect → **Sensing** with Fake/Mock (`sensing-separation.md`) + **Extract and Override Call** (`dependency-breaking.md`)

## Can I observe the results?

**NO** →
- Method returns void → Use **Sensing** — inject a Fake or Mock to capture the effect (`sensing-separation.md`)
- Effect goes to a global/static → **Encapsulate Global Reference** (`dependency-breaking.md`)
- Effect is invisible → Draw an **Effect Sketch** to find observation points (`advanced-patterns.md`)

## Do I need to add new functionality?

**YES** →
- New logic in the middle of an existing method → **Sprout Method** (`sprout-wrap-techniques.md`)
- Original's dependencies are impossible → **Sprout Class** (`sprout-wrap-techniques.md`)
- Behavior before/after → **Wrap Method** (`sprout-wrap-techniques.md`)
- Decorate the entire class → **Wrap Class** (`sprout-wrap-techniques.md`)
- Can't modify the original at all → **Programming by Difference** (subclass temporarily) (`tdd-legacy.md`)

## Do I need to understand the code first?

**YES** →
- Use **Scratch Refactoring**: refactor aggressively on a throwaway branch to understand, then discard (`advanced-patterns.md`)
- Draw an **Effect Sketch**: trace how changes propagate through variables, return values, and state
- List responsibilities: if you say "this class does X **and** Y **and** Z", you have 3 classes
- Then write **Characterization Tests** (`characterization-tests.md`)

## Do I need to change many classes at once?

**YES** → Look for a **Pinch Point** — one method/class that exercises all the classes you need to modify (`advanced-patterns.md`)

## Is the code a 3rd-party API dependency?

**YES** → **Skin and Wrap the API** — create a thin interface + production wrapper (`method-object-skin-wrap.md`)
