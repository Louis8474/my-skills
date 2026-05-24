# TDD in Legacy Code and Programming by Difference

Techniques from "Working Effectively with Legacy Code" (Michael Feathers), Chapter 8. Covers the Legacy TDD Algorithm, Programming by Difference, and Lean on the Compiler. All examples are complete and compilable.

---

## The Legacy TDD Algorithm

When adding a new feature to legacy code using TDD, follow these steps:

1. **Put the class under test** -- break dependencies if needed (see `dependency-breaking.md`).
2. **Write a failing test** for the new functionality.
3. **Make it compile** -- add just enough production code for the test to compile.
4. **Make it pass** -- without modifying existing code if possible.
5. **Remove duplication** -- refactor while keeping all tests green.

The key insight: in legacy code you often cannot write a test first because the class has hidden dependencies. Step 1 exists specifically for this reason. Once the class is testable, the remaining steps follow standard TDD.

---

### Example: Adding a Discount Feature to a Legacy OrderProcessor

#### The Legacy Class (Hard to Test)

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class OrderProcessor {
    private Connection connection;

    public OrderProcessor() {
        try {
            // Hidden dependency: connects to a real database in the constructor
            this.connection = DriverManager.getConnection(
                "jdbc:mysql://prod-server:3306/orders", "admin", "secret");
        } catch (SQLException e) {
            throw new RuntimeException("Cannot connect to database", e);
        }
    }

    public double calculateTotal(int orderId) throws SQLException {
        double total = 0.0;
        PreparedStatement stmt = connection.prepareStatement(
            "SELECT price, quantity FROM order_items WHERE order_id = ?");
        stmt.setInt(1, orderId);
        ResultSet rs = stmt.executeQuery();
        while (rs.next()) {
            total += rs.getDouble("price") * rs.getInt("quantity");
        }
        return total;
    }
}
```

Problems:
- The constructor connects to a real database -- impossible to instantiate in a test.
- `calculateTotal` uses a live `Connection` -- no way to feed test data.

---

#### Step 1: Break the Dependency (Parameterize Constructor)

```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class OrderProcessor {
    private final Connection connection;

    // Legacy constructor: preserves existing behavior
    public OrderProcessor() {
        try {
            this.connection = DriverManager.getConnection(
                "jdbc:mysql://prod-server:3306/orders", "admin", "secret");
        } catch (SQLException e) {
            throw new RuntimeException("Cannot connect to database", e);
        }
    }

    // New constructor: allows injection for testing
    public OrderProcessor(Connection connection) {
        this.connection = connection;
    }

    public double calculateTotal(int orderId) throws SQLException {
        double total = 0.0;
        PreparedStatement stmt = connection.prepareStatement(
            "SELECT price, quantity FROM order_items WHERE order_id = ?");
        stmt.setInt(1, orderId);
        ResultSet rs = stmt.executeQuery();
        while (rs.next()) {
            total += rs.getDouble("price") * rs.getInt("quantity");
        }
        return total;
    }

    // New feature: apply a discount percentage to the total
    // This method does not exist yet -- we will TDD it below.
}
```

---

#### Step 2-5: Full TDD Cycle -- Java 8 + JUnit 4

##### Step 2: Write a Failing Test

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.junit.Assert.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@RunWith(MockitoJUnitRunner.class)
public class OrderProcessorTest {

    @Mock private Connection connection;
    @Mock private PreparedStatement stmt;
    @Mock private ResultSet rs;

    private void stubOrderItems(double price, int quantity) throws SQLException {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(rs.next()).thenReturn(true, false);
        when(rs.getDouble("price")).thenReturn(price);
        when(rs.getInt("quantity")).thenReturn(quantity);
        when(stmt.executeQuery()).thenReturn(rs);
    }

    @Test
    public void shouldReturnTotalWithoutDiscount() throws SQLException {
        stubOrderItems(25.0, 4);
        OrderProcessor processor = new OrderProcessor(connection);

        double total = processor.calculateTotal(1);

        assertEquals(100.0, total, 0.001);
    }

    // This test will NOT compile until we add calculateTotalWithDiscount
    @Test
    public void shouldApplyDiscountToTotal() throws SQLException {
        stubOrderItems(25.0, 4);
        OrderProcessor processor = new OrderProcessor(connection);

        double discounted = processor.calculateTotalWithDiscount(1, 10.0);

        assertEquals(90.0, discounted, 0.001);
    }
}
```

##### Step 3: Make It Compile

Add the method signature to `OrderProcessor`:

```java
public double calculateTotalWithDiscount(int orderId, double discountPercent) throws SQLException {
    return 0.0; // Placeholder -- test will fail
}
```

##### Step 4: Make It Pass

```java
public double calculateTotalWithDiscount(int orderId, double discountPercent) throws SQLException {
    double total = calculateTotal(orderId);
    return total - (total * discountPercent / 100.0);
}
```

##### Step 5: Refactor (Remove Duplication)

No duplication in this case. If `calculateTotalWithDiscount` had duplicated the SQL logic from `calculateTotal`, you would extract that into a shared private method.

---

#### Step 2-5: Full TDD Cycle -- Java 11+ + JUnit 5

##### Step 2: Write a Failing Test

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderProcessorTest {

    @Mock private Connection connection;
    @Mock private PreparedStatement stmt;
    @Mock private ResultSet rs;

    private OrderProcessor processor;

    @BeforeEach
    void setUp() {
        processor = new OrderProcessor(connection);
    }

    private void stubOrderItems(double price, int quantity) throws SQLException {
        when(connection.prepareStatement(anyString())).thenReturn(stmt);
        when(rs.next()).thenReturn(true, false);
        when(rs.getDouble("price")).thenReturn(price);
        when(rs.getInt("quantity")).thenReturn(quantity);
        when(stmt.executeQuery()).thenReturn(rs);
    }

    @Test
    void shouldReturnTotalWithoutDiscount() throws SQLException {
        // Given
        stubOrderItems(25.0, 4);

        // When
        double total = processor.calculateTotal(1);

        // Then
        assertThat(total).isCloseTo(100.0, within(0.001));
    }

    // This test will NOT compile until we add calculateTotalWithDiscount
    @Test
    void shouldApplyDiscountToTotal() throws SQLException {
        // Given
        stubOrderItems(25.0, 4);

        // When
        double discounted = processor.calculateTotalWithDiscount(1, 10.0);

        // Then
        assertThat(discounted).isCloseTo(90.0, within(0.001));
    }

    @Test
    void shouldApplyZeroDiscount() throws SQLException {
        // Given
        stubOrderItems(50.0, 2);

        // When
        double discounted = processor.calculateTotalWithDiscount(1, 0.0);

        // Then
        assertThat(discounted).isCloseTo(100.0, within(0.001));
    }

    @Test
    void shouldApplyFullDiscount() throws SQLException {
        // Given
        stubOrderItems(50.0, 2);

        // When
        double discounted = processor.calculateTotalWithDiscount(1, 100.0);

        // Then
        assertThat(discounted).isCloseTo(0.0, within(0.001));
    }
}
```

##### Step 3: Make It Compile

```java
public double calculateTotalWithDiscount(int orderId, double discountPercent) throws SQLException {
    return 0.0;
}
```

##### Step 4: Make It Pass

```java
public double calculateTotalWithDiscount(int orderId, double discountPercent) throws SQLException {
    double total = calculateTotal(orderId);
    return total * (1.0 - discountPercent / 100.0);
}
```

##### Step 5: Refactor

The implementation is clean. If you had edge-case validation to add (e.g., negative discount), write a failing test first, then add the guard.

---

## Programming by Difference

When you cannot easily modify a legacy class -- perhaps it is used by many other parts of the system, or you do not have permission to change it -- use inheritance as a **temporary** strategy:

1. Create a subclass that adds or overrides only what you need.
2. Test the subclass independently.
3. Later refactor toward composition (Strategy, Decorator, etc.).

This technique lets you add behavior without touching existing code, reducing the risk of breaking something.

---

### The Liskov Substitution Principle (LSP) Warning

When using Programming by Difference, you must respect LSP:

- A subclass must be **substitutable** for its parent in every context.
- **Danger:** overriding a method to do something radically different (e.g., `calculate()` returns a negative value when the parent always returns positive) breaks LSP.
- Clients that depend on the parent's contract will behave incorrectly if the subclass violates expectations.

**Rule of thumb:** use inheritance only as a stepping stone. Once you have tests in place, refactor to composition. The subclass is scaffolding, not the final architecture.

---

### Example: Programming by Difference -- Java 8 + JUnit 4

#### The Legacy Class

```java
import java.time.LocalDate;
import java.util.List;

public class ReportGenerator {
    private final List<String> data;

    public ReportGenerator(List<String> data) {
        this.data = data;
    }

    public String generateHeader() {
        return "=== STANDARD REPORT ===\nDate: " + LocalDate.now() + "\n";
    }

    public String generateBody() {
        StringBuilder sb = new StringBuilder();
        for (String line : data) {
            sb.append("  ").append(line).append("\n");
        }
        return sb.toString();
    }

    public String generateFooter() {
        return "=== END OF REPORT ===\nTotal lines: " + data.size() + "\n";
    }

    public String generate() {
        return generateHeader() + generateBody() + generateFooter();
    }
}
```

#### Step 1: Subclass to Override the Header

```java
import java.time.LocalDate;
import java.util.List;

public class FinancialReportGenerator extends ReportGenerator {
    private final String department;

    public FinancialReportGenerator(List<String> data, String department) {
        super(data);
        this.department = department;
    }

    @Override
    public String generateHeader() {
        return "=== FINANCIAL REPORT ===\n"
             + "Department: " + department + "\n"
             + "Date: " + LocalDate.now() + "\n";
    }
}
```

#### Step 2: Test the Subclass

```java
import org.junit.Test;
import org.junit.Before;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

public class FinancialReportGeneratorTest {

    private List<String> testData;
    private FinancialReportGenerator generator;

    @Before
    public void setUp() {
        testData = Arrays.asList("Revenue: 50000", "Expenses: 30000", "Profit: 20000");
        generator = new FinancialReportGenerator(testData, "Finance");
    }

    @Test
    public void shouldGenerateFinancialHeader() {
        String header = generator.generateHeader();

        assertTrue(header.contains("FINANCIAL REPORT"));
        assertTrue(header.contains("Department: Finance"));
        assertTrue(header.contains("Date: " + LocalDate.now()));
    }

    @Test
    public void shouldPreserveBodyFromParent() {
        String body = generator.generateBody();

        assertTrue(body.contains("Revenue: 50000"));
        assertTrue(body.contains("Expenses: 30000"));
        assertTrue(body.contains("Profit: 20000"));
    }

    @Test
    public void shouldPreserveFooterFromParent() {
        String footer = generator.generateFooter();

        assertTrue(footer.contains("Total lines: 3"));
    }

    @Test
    public void shouldBeSubstitutableForParent() {
        // LSP check: FinancialReportGenerator works wherever ReportGenerator is expected
        ReportGenerator asParent = generator;
        String report = asParent.generate();

        assertTrue(report.contains("FINANCIAL REPORT"));
        assertTrue(report.contains("Revenue: 50000"));
        assertTrue(report.contains("END OF REPORT"));
    }
}
```

#### Step 3: Evolve Toward Composition (Strategy Pattern)

Once you have tests, replace inheritance with a `HeaderStrategy`:

```java
import java.time.LocalDate;

public interface HeaderStrategy {
    String generateHeader();
}

public class StandardHeader implements HeaderStrategy {
    @Override
    public String generateHeader() {
        return "=== STANDARD REPORT ===\nDate: " + LocalDate.now() + "\n";
    }
}

public class FinancialHeader implements HeaderStrategy {
    private final String department;

    public FinancialHeader(String department) {
        this.department = department;
    }

    @Override
    public String generateHeader() {
        return "=== FINANCIAL REPORT ===\n"
             + "Department: " + department + "\n"
             + "Date: " + LocalDate.now() + "\n";
    }
}
```

Refactored `ReportGenerator`:

```java
import java.util.List;

public class ReportGenerator {
    private final List<String> data;
    private final HeaderStrategy headerStrategy;

    // Legacy constructor: preserves backward compatibility
    public ReportGenerator(List<String> data) {
        this(data, new StandardHeader());
    }

    // New constructor: accepts strategy
    public ReportGenerator(List<String> data, HeaderStrategy headerStrategy) {
        this.data = data;
        this.headerStrategy = headerStrategy;
    }

    public String generateHeader() {
        return headerStrategy.generateHeader();
    }

    public String generateBody() {
        StringBuilder sb = new StringBuilder();
        for (String line : data) {
            sb.append("  ").append(line).append("\n");
        }
        return sb.toString();
    }

    public String generateFooter() {
        return "=== END OF REPORT ===\nTotal lines: " + data.size() + "\n";
    }

    public String generate() {
        return generateHeader() + generateBody() + generateFooter();
    }
}
```

Now `FinancialReportGenerator` subclass can be deleted. All tests continue to pass with the composition-based version.

---

### Example: Programming by Difference -- Java 11+ + JUnit 5

#### The Legacy Class

Same `ReportGenerator` class as above.

#### Step 1: Subclass to Override the Header

Same `FinancialReportGenerator` class as above.

#### Step 2: Test the Subclass

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class FinancialReportGeneratorTest {

    private List<String> testData;
    private FinancialReportGenerator generator;

    @BeforeEach
    void setUp() {
        testData = List.of("Revenue: 50000", "Expenses: 30000", "Profit: 20000");
        generator = new FinancialReportGenerator(testData, "Finance");
    }

    @Test
    void shouldGenerateFinancialHeader() {
        // When
        String header = generator.generateHeader();

        // Then
        assertThat(header)
            .contains("FINANCIAL REPORT")
            .contains("Department: Finance")
            .contains("Date: " + LocalDate.now());
    }

    @Test
    void shouldPreserveBodyFromParent() {
        // When
        String body = generator.generateBody();

        // Then
        assertThat(body)
            .contains("Revenue: 50000")
            .contains("Expenses: 30000")
            .contains("Profit: 20000");
    }

    @Test
    void shouldPreserveFooterFromParent() {
        // When
        String footer = generator.generateFooter();

        // Then
        assertThat(footer).contains("Total lines: 3");
    }

    @Test
    void shouldBeSubstitutableForParent() {
        // Given
        ReportGenerator asParent = generator;

        // When
        String report = asParent.generate();

        // Then
        assertThat(report)
            .contains("FINANCIAL REPORT")
            .contains("Revenue: 50000")
            .contains("END OF REPORT");
    }
}
```

#### Step 3: Evolve Toward Composition (Strategy Pattern)

With Java 11+, the `HeaderStrategy` can also be expressed as a functional interface:

```java
import java.time.LocalDate;

@FunctionalInterface
public interface HeaderStrategy {
    String generateHeader();
}
```

This allows lambda-based usage in tests and production code:

```java
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ReportGeneratorCompositionTest {

    @Test
    void shouldUseCustomHeaderViaLambda() {
        // Given
        HeaderStrategy customHeader = () ->
            "=== CUSTOM REPORT ===\nDate: " + LocalDate.now() + "\n";
        var generator = new ReportGenerator(
            List.of("Line 1", "Line 2"), customHeader);

        // When
        String report = generator.generate();

        // Then
        assertThat(report)
            .contains("CUSTOM REPORT")
            .contains("Line 1")
            .contains("END OF REPORT");
    }

    @Test
    void shouldUseFinancialHeaderStrategy() {
        // Given
        var generator = new ReportGenerator(
            List.of("Revenue: 50000"),
            new FinancialHeader("Accounting"));

        // When
        String header = generator.generateHeader();

        // Then
        assertThat(header)
            .contains("FINANCIAL REPORT")
            .contains("Department: Accounting");
    }
}
```

---

## Lean on the Compiler (Chapter 23)

When you need to find every place affected by a change, let the compiler do the work:

1. **Change a method signature or return type** in the class you are modifying.
2. **Compile the project** -- do NOT fix anything yet.
3. **The compiler errors are your free impact map** -- each error shows a call site that depends on the changed method.
4. **Fix each call site** one at a time, adding tests where needed.

This technique is especially useful when:
- You want to change a type (e.g., `int` to `double`, `String` to a domain object).
- You want to add a required parameter to a method.
- You want to rename a method to better express intent.

### Example: Changing a Method Signature

#### Before: Original Class

```java
public class PricingEngine {

    public int calculate(int basePrice) {
        return basePrice + (basePrice * 10 / 100); // 10% markup
    }
}
```

#### Dependent Code (Multiple Call Sites)

```java
public class InvoiceService {
    private final PricingEngine engine = new PricingEngine();

    public int getInvoiceTotal(int basePrice, int quantity) {
        int unitPrice = engine.calculate(basePrice);
        return unitPrice * quantity;
    }
}
```

```java
public class QuoteService {
    private final PricingEngine engine = new PricingEngine();

    public String formatQuote(int basePrice) {
        int finalPrice = engine.calculate(basePrice);
        return "Quote: $" + finalPrice;
    }
}
```

```java
public class DiscountService {
    private final PricingEngine engine = new PricingEngine();

    public int applyDiscount(int basePrice, int discountPercent) {
        int fullPrice = engine.calculate(basePrice);
        return fullPrice - (fullPrice * discountPercent / 100);
    }
}
```

#### Step 1: Change the Signature

Change `PricingEngine.calculate` from `int` to `double`:

```java
public class PricingEngine {

    public double calculate(double basePrice) {
        return basePrice + (basePrice * 10.0 / 100.0);
    }
}
```

#### Step 2: Compile -- Read the Error Map

```
InvoiceService.java:6: error: possible lossy conversion from double to int
        int unitPrice = engine.calculate(basePrice);
                                        ^
QuoteService.java:6: error: possible lossy conversion from double to int
        int finalPrice = engine.calculate(basePrice);
                                         ^
DiscountService.java:6: error: possible lossy conversion from double to int
        int fullPrice = engine.calculate(basePrice);
                                        ^
```

The compiler has identified all three call sites. This is your checklist.

#### Step 3: Fix Each Call Site

```java
public class InvoiceService {
    private final PricingEngine engine = new PricingEngine();

    public double getInvoiceTotal(double basePrice, int quantity) {
        double unitPrice = engine.calculate(basePrice);
        return unitPrice * quantity;
    }
}
```

```java
public class QuoteService {
    private final PricingEngine engine = new PricingEngine();

    public String formatQuote(double basePrice) {
        double finalPrice = engine.calculate(basePrice);
        return String.format("Quote: $%.2f", finalPrice);
    }
}
```

```java
public class DiscountService {
    private final PricingEngine engine = new PricingEngine();

    public double applyDiscount(double basePrice, int discountPercent) {
        double fullPrice = engine.calculate(basePrice);
        return fullPrice - (fullPrice * discountPercent / 100.0);
    }
}
```

#### Step 4: Add Tests for the Updated Code

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

@ExtendWith(MockitoExtension.class)
class PricingEngineTest {

    private final PricingEngine engine = new PricingEngine();

    @Test
    void shouldApplyTenPercentMarkup() {
        // When
        double result = engine.calculate(100.0);

        // Then
        assertThat(result).isCloseTo(110.0, within(0.001));
    }

    @Test
    void shouldHandleFractionalPrices() {
        // When
        double result = engine.calculate(99.99);

        // Then
        assertThat(result).isCloseTo(109.989, within(0.001));
    }
}

class InvoiceServiceTest {

    private final InvoiceService service = new InvoiceService();

    @Test
    void shouldCalculateInvoiceTotal() {
        // When
        double total = service.getInvoiceTotal(100.0, 3);

        // Then
        assertThat(total).isCloseTo(330.0, within(0.001));
    }
}

class QuoteServiceTest {

    private final QuoteService service = new QuoteService();

    @Test
    void shouldFormatQuoteWithTwoDecimals() {
        // When
        String quote = service.formatQuote(99.99);

        // Then
        assertThat(quote).isEqualTo("Quote: $109.99");
    }
}

class DiscountServiceTest {

    private final DiscountService service = new DiscountService();

    @Test
    void shouldApplyDiscountAfterMarkup() {
        // When
        double result = service.applyDiscount(100.0, 20);

        // Then
        assertThat(result).isCloseTo(88.0, within(0.001));
    }
}
```

#### Summary of the Lean on the Compiler Technique

| Step | Action | Result |
|------|--------|--------|
| 1 | Change signature | Intentionally break callers |
| 2 | Compile | Get a complete list of affected call sites |
| 3 | Fix each site | Update types, variables, formatting |
| 4 | Add tests | Lock in the new behavior |

**Warning:** This technique works only with statically-typed languages and only for compile-time detectable changes. It will not find issues caused by reflection, serialization, or dynamic dispatch through `Object` references.
