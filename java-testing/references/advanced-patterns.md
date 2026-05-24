# Advanced Patterns — Multi-Version

From *Working Effectively with Legacy Code*, Chapters 11, 12, 16, 17, 20, and 21 (Michael Feathers).

Techniques for complex situations: grouped changes, incomprehensible code, giant classes, and refactoring prioritization.

## Table of Contents
1. [Pinch Points](#1-pinch-points-convergence-points) — Test a cluster of classes through one convergence point (Ch 12)
2. [Effect Sketches and Forward Reasoning](#2-effect-sketches-and-forward-reasoning) — Trace how changes propagate (Ch 11)
3. [God Class / Blob — Clustering and Extraction](#3-god-class--blob--clustering-and-extraction) — Tame enormous classes (Ch 17, 20)
4. [Hot Spots — Refactoring Prioritization](#4-hot-spots--refactoring-prioritization) — Focus effort where it matters (Ch 21)
5. [Scratch Refactoring](#5-scratch-refactoring) — Refactor to understand, then discard (Ch 16)
6. [Responsibility Listing](#6-responsibility-listing) — Identify hidden classes inside a Blob (Ch 16, 17, 20)

---

## 1. Pinch Points (Convergence Points)

**When:** You need to change several closely collaborating classes. Instead of testing each one, you find ONE point where their effects converge.

### Concept

A Pinch Point is a method or class that, when tested, indirectly exercises all the internal classes you need to modify.

### Example — Java 8 + JUnit 4

```java
// Internal classes that are hard to test separately
class LineItem {
    double calculateAmount() { /* complex logic */ return 100.0; }
}

class TaxEngine {
    double applyRate(double amount) { return amount * 0.21; }
}

class Invoice {
    private List<LineItem> items;
    private TaxEngine taxEngine = new TaxEngine();

    public double calculateTotal() {
        double subtotal = 0;
        for (LineItem item : items) {
            subtotal += item.calculateAmount();
        }
        return subtotal + taxEngine.applyRate(subtotal);
    }
}

// PINCH POINT: ReportGenerator uses all internal classes
public class ReportGenerator {
    public double generateTotalWithTaxes(Invoice invoice) {
        return invoice.calculateTotal();
    }
}
```

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class ReportGeneratorTest {

    @Test
    public void testGlobalTaxCalculation_pinchPoint() {
        // STRATEGY: We test the Pinch Point instead of each internal class
        Invoice invoice = createInvoiceWithItems(100.0, 200.0);
        ReportGenerator report = new ReportGenerator();

        double total = report.generateTotalWithTaxes(invoice);

        // If this passes, we know LineItem, TaxEngine, and Invoice
        // work together correctly
        assertEquals(363.0, total, 0.01); // 300 + 300*0.21 = 363
    }

    private Invoice createInvoiceWithItems(double... amounts) {
        Invoice inv = new Invoice();
        for (double a : amounts) {
            inv.addItem(new LineItem(a));
        }
        return inv;
    }
}
```

### Example — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

class ReportGeneratorTest {

    @Test
    @DisplayName("Pinch Point: verifies coordinated calculation across all classes")
    void generateTotal_pinchPointVerifiesEntireCluster() {
        var invoice = createInvoice(100.0, 200.0, 50.0);
        var report = new ReportGenerator();

        var total = report.generateTotalWithTaxes(invoice);

        // 350 + 350*0.21 = 423.5
        assertEquals(423.5, total, 0.01);
    }

    @Test
    @DisplayName("Pinch Point: empty invoice")
    void generateTotal_emptyInvoice_returnsZero() {
        var invoice = createInvoice();
        var report = new ReportGenerator();

        assertEquals(0.0, report.generateTotalWithTaxes(invoice), 0.01);
    }

    private Invoice createInvoice(double... amounts) {
        var inv = new Invoice();
        for (var a : amounts) inv.addItem(new LineItem(a));
        return inv;
    }
}
```

---

## 2. Effect Sketches and Forward Reasoning

**When:** You don't know what to test after a change. You need to trace how effects propagate.

### Concept

Three paths for effect propagation:
1. **Return values** — the caller receives the change directly
2. **State modification** — the object changes internally and others read it
3. **Global/static data** — invisible changes not in the method signature

### Example: Tracing effects

```java
public class InventoryManager {
    private List<Product> products = new ArrayList<>();

    // CHANGE POINT: we want to modify how stock is added
    public void restockProduct(String name, int quantity) {
        for (Product p : products) {
            if (p.getName().equals(name)) {
                p.addQuantity(quantity); // Effect propagates to p.getQuantity()
            }
        }
    }

    // OBSERVATION POINT 1: returns a detectable value
    public int getTotalStock() {
        return products.stream().mapToInt(Product::getQuantity).sum();
    }

    // OBSERVATION POINT 2: another method affected "downstream"
    public boolean isLowStock(String name) {
        return findProduct(name)
            .map(p -> p.getQuantity() < 5)
            .orElse(false);
    }
}
```

### Test — Java 8 + JUnit 4 (Effect Reasoning)

```java
import org.junit.Test;
import org.junit.Before;
import static org.junit.Assert.*;

public class InventoryManagerTest {

    private InventoryManager inventory;

    @Before
    public void setup() {
        inventory = new InventoryManager();
        inventory.addProduct(new Product("Laptop", 3));
    }

    // Reasoning: if we change restockProduct, the effect
    // propagates to getTotalStock() and isLowStock()

    @Test
    public void testRestock_increasesTotalStock() {
        // OBSERVATION POINT 1: verify via getTotalStock
        inventory.restockProduct("Laptop", 7);
        assertEquals(10, inventory.getTotalStock());
    }

    @Test
    public void testRestock_changesLowStockStatus() {
        // OBSERVATION POINT 2: verify via isLowStock
        assertTrue(inventory.isLowStock("Laptop")); // Before: 3 < 5 = true
        inventory.restockProduct("Laptop", 5);
        assertFalse(inventory.isLowStock("Laptop")); // After: 8 < 5 = false
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import static org.junit.jupiter.api.Assertions.*;

class InventoryManagerTest {

    InventoryManager inventory;

    @BeforeEach
    void setup() {
        inventory = new InventoryManager();
        inventory.addProduct(new Product("Laptop", 3));
        inventory.addProduct(new Product("Mouse", 1));
    }

    @Test
    void restock_propagatesEffectToTotalStock() {
        inventory.restockProduct("Laptop", 7);

        assertAll("Effect propagation verification",
            () -> assertEquals(11, inventory.getTotalStock(), "total includes restock"),
            () -> assertFalse(inventory.isLowStock("Laptop"), "no longer low stock")
        );
    }

    @Test
    void restock_nonexistentProduct_noSideEffect() {
        var totalBefore = inventory.getTotalStock();

        inventory.restockProduct("FakeProduct", 100);

        assertEquals(totalBefore, inventory.getTotalStock(),
            "Restocking a nonexistent product should not alter the total");
    }
}
```

---

## 3. God Class / Blob — Clustering and Extraction

**When:** A class has thousands of lines and too many responsibilities.

### Clustering Technique

1. List all instance variables
2. See which methods use which variables
3. Groups sharing variables are candidate classes

### "Tell the Story" Technique

If you say: "This class manages the database **AND** validates users **AND** formats reports," you have 3 classes.

### Extraction Example — Java 8

```java
// LEGACY CODE: God class with 3 mixed responsibilities
public class SalesSystem {
    private double vatRate = 0.16;
    private List<Product> products;
    private Connection dbConnection;
    private PrintWriter reportWriter;

    // Responsibility 1: Tax calculation
    public double calculateTax(double subtotal) {
        return subtotal * vatRate;
    }

    // Responsibility 2: Persistence
    public void saveSale(Sale sale) {
        dbConnection.prepareStatement("INSERT...");
    }

    // Responsibility 3: Reporting
    public void printReport(Sale sale) {
        reportWriter.println("Report: " + sale);
    }
}
```

### Extraction

```java
// EXTRACTED: Class with a single responsibility
public class TaxCalculator {
    private final double rate;

    public TaxCalculator(double rate) {
        this.rate = rate;
    }

    public double apply(double amount) {
        return amount * rate;
    }
}
```

### Test of the Extracted Class — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class TaxCalculatorTest {

    @Test
    public void testApply_standardRate() {
        TaxCalculator calc = new TaxCalculator(0.16);
        assertEquals(16.0, calc.apply(100.0), 0.01);
    }

    @Test
    public void testApply_zeroRate() {
        TaxCalculator calc = new TaxCalculator(0.0);
        assertEquals(0.0, calc.apply(100.0), 0.01);
    }
}
```

### Test of the Extracted Class — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class TaxCalculatorTest {

    @ParameterizedTest(name = "rate={0}, amount={1}, expected={2}")
    @CsvSource({
        "0.16, 100.0, 16.0",
        "0.21, 200.0, 42.0",
        "0.0,  100.0, 0.0",
        "1.0,  50.0,  50.0"
    })
    void apply_variousCombinations(double rate, double amount, double expected) {
        var calc = new TaxCalculator(rate);
        assertEquals(expected, calc.apply(amount), 0.01);
    }
}
```

---

## 4. Hot Spots — Refactoring Prioritization

**When:** You have a massive legacy system. Where do you start?

### Concept

A Hot Spot is a file that gets modified with disproportionate frequency. Apply the Pareto Principle: 20% of the code causes 80% of the problems.

### How to Identify Hot Spots

```bash
# Top 20 most frequently changed files in the last 6 months
git log --since="6 months ago" --pretty=format: --name-only \
  | sort | uniq -c | sort -rn | head -20

# Files with the most commits AND the most bugs
git log --since="6 months ago" --grep="fix\|bug\|hotfix" --pretty=format: --name-only \
  | sort | uniq -c | sort -rn | head -20
```

### Strategy: Boy Scout Rule

Don't stop development to clean up. Every time you enter a Hot Spot:
1. Write a characterization test for what you're about to touch
2. Make your change
3. Leave the code a little cleaner than you found it
4. Repeat

### Example: Refactoring a Hot Spot (growing switch statement)

```java
// HOT SPOT: This switch is modified every time a new risk type is added
public class PremiumCalculator {
    public double calculate(String riskType, double base) {
        switch (riskType) {
            case "LOW":     return base * 1.1;
            case "MEDIUM":  return base * 1.5;
            case "HIGH":    return base * 2.0;
            case "EXTREME": return base * 5.0;
            default:        return base;
        }
    }
}
```

### Refactoring towards the Open/Closed Principle

```java
// Java 8: Functional interface
@FunctionalInterface
interface RiskStrategy {
    double apply(double base);
}

// The calculator becomes stable
public class RefactoredPremiumCalculator {
    private final Map<String, RiskStrategy> strategies;

    public RefactoredPremiumCalculator(Map<String, RiskStrategy> strategies) {
        this.strategies = strategies;
    }

    public double calculate(String riskType, double base) {
        return strategies.getOrDefault(riskType, b -> b).apply(base);
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import org.junit.Before;
import java.util.HashMap;
import java.util.Map;
import static org.junit.Assert.*;

public class PremiumCalculatorTest {

    private RefactoredPremiumCalculator calculator;

    @Before
    public void setup() {
        Map<String, RiskStrategy> strategies = new HashMap<>();
        strategies.put("LOW", base -> base * 1.1);
        strategies.put("MEDIUM", base -> base * 1.5);
        strategies.put("HIGH", base -> base * 2.0);
        strategies.put("EXTREME", base -> base * 5.0);
        calculator = new RefactoredPremiumCalculator(strategies);
    }

    @Test
    public void testCalculate_highRisk() {
        assertEquals(200.0, calculator.calculate("HIGH", 100.0), 0.01);
    }

    @Test
    public void testCalculate_unknownRisk_returnsBase() {
        assertEquals(100.0, calculator.calculate("NEW", 100.0), 0.01);
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

class PremiumCalculatorTest {

    // Java 17+: Map.of for concise setup
    private final RefactoredPremiumCalculator calculator =
        new RefactoredPremiumCalculator(Map.of(
            "LOW",     base -> base * 1.1,
            "MEDIUM",  base -> base * 1.5,
            "HIGH",    base -> base * 2.0,
            "EXTREME", base -> base * 5.0
        ));

    @ParameterizedTest(name = "risk={0}, base={1}, expected={2}")
    @CsvSource({
        "LOW,     100, 110.0",
        "MEDIUM,  100, 150.0",
        "HIGH,    100, 200.0",
        "EXTREME, 100, 500.0"
    })
    void calculate_knownRisks(String risk, double base, double expected) {
        assertEquals(expected, calculator.calculate(risk, base), 0.01);
    }

    @Test
    void calculate_unknownRisk_returnsBase() {
        assertEquals(100.0, calculator.calculate("NONEXISTENT", 100.0), 0.01);
    }

    @Test
    void calculate_newStrategy_withoutModifyingClass() {
        // Demonstrating the OCP: add without modifying
        var withNewRisk = new RefactoredPremiumCalculator(Map.of(
            "PANDEMIC", base -> base * 10.0
        ));

        assertEquals(1000.0, withNewRisk.calculate("PANDEMIC", 100.0), 0.01);
    }
}
```

---

## 5. Scratch Refactoring

**When:** You don't understand the code. You refactor aggressively just to understand it, then **discard everything**.

### Process

1. Create a temporary branch: `git checkout -b scratch/understand-module-X`
2. Rename variables, extract methods, simplify conditionals
3. Do NOT worry about breaking things
4. Once you understand the logic, **delete the branch**
5. Now write characterization tests on the real branch
6. Refactor safely

### Example

```java
// ORIGINAL CODE (incomprehensible)
public void prc(Data d) {
    if (d.getTp() != 1 && (d.getFlg() & 0x4) != 0) {
        if (d.getAmt() > 100) {
            svc.exec(d, true);
        }
    } else {
        svc.exec(d, false);
    }
}

// SCRATCH REFACTORING (only to understand, then discard)
public void processCharge(Data data) {
    boolean isSpecialType = data.getTp() != 1;
    boolean hasPriorityFlag = (data.getFlg() & 4) != 0;
    boolean isHighAmount = data.getAmt() > 100;

    if (isSpecialType && hasPriorityFlag) {
        if (isHighAmount) {
            service.executeWithPriority(data);
        }
        // NOTE: if amount is NOT high AND it's special+flag, it does NOTHING! Bug?
    } else {
        service.executeNormal(data);
    }
}
// Now we understand the logic! Delete this and write tests.
```

### Characterization Test after Scratch

```java
// Java 11+ / JUnit 5
@ParameterizedTest(name = "tp={0}, flag={1}, amt={2} → priority={3}")
@CsvSource({
    "2, 4, 150, true",   // type!=1, flag&4!=0, amt>100 → priority
    "2, 4, 50,  false",  // type!=1, flag&4!=0, amt<=100 → NOTHING! (bug?)
    "1, 4, 150, false",  // type==1 → normal
    "2, 0, 150, false"   // flag&4==0 → normal
})
void prc_fullCharacterization(int tp, int flag, int amt, boolean withPriority) {
    var mockSvc = mock(Service.class);
    var data = new Data(tp, flag, amt);
    var processor = new Processor(mockSvc);

    processor.prc(data);

    if (withPriority) {
        verify(mockSvc).exec(data, true);
    } else if (tp == 2 && (flag & 4) != 0 && amt <= 100) {
        // Special case: calls NOTHING (possible documented bug)
        verify(mockSvc, never()).exec(any(), anyBoolean());
    } else {
        verify(mockSvc).exec(data, false);
    }
}
```

---

## 6. Responsibility Listing

**When:** You're facing a God Class and need to find natural boundaries for extraction. This is a prerequisite for God Class refactoring (Ch 16, 17, 20).

### The "Tell the Story" Technique (Ch 17)

Try to describe the class in one sentence. Every time you use the word "**and**", you've found a separate responsibility:

> "This class manages the database **AND** validates users **AND** formats reports **AND** sends notifications."

That's 4 classes hiding inside one.

### The Variable Clustering Technique (Ch 20)

1. List all instance variables of the class
2. For each method, note which variables it uses
3. Methods that share the same variables form a **cluster** — a candidate class

### Example

```
Instance variables: vatRate, products, dbConnection, reportWriter, emailSender

Cluster 1 (Tax):      vatRate               → used by: calculateTax(), applyDiscount()
Cluster 2 (Storage):  dbConnection          → used by: saveSale(), loadHistory()
Cluster 3 (Reports):  products, reportWriter → used by: printReport(), exportCSV()
Cluster 4 (Notify):   emailSender           → used by: sendConfirmation(), alertAdmin()
```

Each cluster becomes its own class: `TaxCalculator`, `SaleRepository`, `ReportGenerator`, `NotificationService`.

### Process for Extracting

1. Pick the **smallest, most independent** cluster
2. Write characterization tests for the methods in that cluster
3. Extract to a new class (Extract Class refactoring)
4. Make the God Class delegate to the new class
5. Run tests — everything must still pass
6. Repeat with the next cluster

### Stopping the Bleeding (Boy Scout Rule)

While you're refactoring the God Class, use **Sprout Class** for any new functionality. Never add new methods to the God Class — always put them in a separate, tested class. This prevents the class from growing further while you're shrinking it.
