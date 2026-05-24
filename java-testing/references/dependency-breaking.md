# Dependency-Breaking Techniques Catalog — Multi-Version

Each technique includes when to use it, the steps, and examples for Java 8/JUnit 4, Java 11/JUnit 5, and Java 17+/JUnit 5.

---

## 1. Parameterize Constructor

**When:** The constructor creates dependencies internally with `new`. This is the "cleanest" technique.

### Legacy Code

```java
public class DataAnalyzer {
    private FileReader reader;

    public DataAnalyzer() {
        this.reader = new FileReader("C:\\data.txt"); // Hidden dependency
    }

    public String analyze() {
        return reader.read().toUpperCase();
    }
}
```

### Refactoring (all versions)

```java
public class DataAnalyzer {
    private final FileReader reader;

    // Legacy constructor: maintains backward compatibility
    public DataAnalyzer() {
        this(new FileReader("C:\\data.txt"));
    }

    // New constructor: allows injection
    public DataAnalyzer(FileReader reader) {
        this.reader = reader;
    }

    public String analyze() {
        return reader.read().toUpperCase();
    }
}
```

### Test — Java 8 + JUnit 4 + Mockito

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class DataAnalyzerTest {

    @Mock
    FileReader readerMock;

    @Test
    public void testAnalyze_convertsToUpperCase() {
        when(readerMock.read()).thenReturn("test data");
        DataAnalyzer analyzer = new DataAnalyzer(readerMock);

        String result = analyzer.analyze();

        assertEquals("TEST DATA", result);
    }
}
```

### Test — Java 11+ + JUnit 5 + Mockito

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataAnalyzerTest {

    @Mock
    FileReader readerMock;

    @Test
    void analyze_convertsToUpperCase() {
        when(readerMock.read()).thenReturn("test data");
        var analyzer = new DataAnalyzer(readerMock);

        var result = analyzer.analyze();

        assertEquals("TEST DATA", result);
    }
}
```

---

## 2. Extract and Override Factory Method

**When:** You can't easily change the constructor signature. You extract the `new` into a protected method and override it in the test.

### Legacy Code

```java
public class PaymentProcessor {
    private BankService service;

    public PaymentProcessor() {
        this.service = new BankService(); // Connects to the real bank
    }

    public boolean process(double amount) {
        return service.charge(amount);
    }
}
```

### Refactoring

```java
public class PaymentProcessor {
    private BankService service;

    public PaymentProcessor() {
        this.service = makeBankService();
    }

    // Seam: overridable protected method
    protected BankService makeBankService() {
        return new BankService();
    }

    public boolean process(double amount) {
        return service.charge(amount);
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class PaymentProcessorTest {

    @Test
    public void testProcess_validAmount_returnsTrue() {
        BankService mockBank = mock(BankService.class);
        when(mockBank.charge(100.0)).thenReturn(true);

        // Test subclass that overrides the factory method
        PaymentProcessor processor = new PaymentProcessor() {
            @Override
            protected BankService makeBankService() {
                return mockBank;
            }
        };

        assertTrue(processor.process(100.0));
        verify(mockBank).charge(100.0);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PaymentProcessorTest {

    @Test
    void process_validAmount_returnsTrue() {
        var mockBank = mock(BankService.class);
        when(mockBank.charge(100.0)).thenReturn(true);

        var processor = new PaymentProcessor() {
            @Override
            protected BankService makeBankService() {
                return mockBank;
            }
        };

        assertTrue(processor.process(100.0));
        verify(mockBank).charge(100.0);
    }
}
```

---

## 3. Extract Interface

**When:** You want to decouple a concrete dependency. The most standard and safest technique.

### Legacy Code

```java
public class PayrollManager {
    private TaxCalculator calculator;

    public PayrollManager() {
        this.calculator = new TaxCalculator();
    }

    public double process(double salary) {
        return salary - calculator.calculate(salary);
    }
}
```

### Refactoring

```java
// New interface
public interface ITaxCalculator {
    double calculate(double salary);
}

// Original class implements the interface
public class TaxCalculator implements ITaxCalculator {
    @Override
    public double calculate(double salary) {
        return salary * 0.20;
    }
}

// Client depends on the interface
public class PayrollManager {
    private final ITaxCalculator calculator;

    public PayrollManager() {
        this(new TaxCalculator());
    }

    public PayrollManager(ITaxCalculator calculator) {
        this.calculator = calculator;
    }

    public double process(double salary) {
        return salary - calculator.calculate(salary);
    }
}
```

### Test — Java 8 + JUnit 4 (manual mock with anonymous class)

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class PayrollManagerTest {

    @Test
    public void testProcess_subtractsFixedRate() {
        // Manual mock: anonymous class implementing the interface
        ITaxCalculator mockCalc = new ITaxCalculator() {
            @Override
            public double calculate(double salary) {
                return 10.0; // Always returns 10
            }
        };

        PayrollManager manager = new PayrollManager(mockCalc);
        assertEquals(90.0, manager.process(100.0), 0.01);
    }
}
```

### Test — Java 11+ + JUnit 5 (Lambda)

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PayrollManagerTest {

    @Test
    void process_subtractsFixedRate() {
        // Java 8+: lambda because the interface is functional
        ITaxCalculator mockCalc = salary -> 10.0;

        var manager = new PayrollManager(mockCalc);
        assertEquals(90.0, manager.process(100.0), 0.01);
    }
}
```

### Test — Java 17+ + JUnit 5 (with sealed interfaces)

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PayrollManagerTest {

    // Java 17: sealed interface to restrict implementations
    // Useful when documenting which calculator types exist
    sealed interface CalculatorType permits FixedCalculator, PercentageCalculator {}
    record FixedCalculator(double value) implements CalculatorType, ITaxCalculator {
        @Override public double calculate(double salary) { return value; }
    }
    record PercentageCalculator(double rate) implements CalculatorType, ITaxCalculator {
        @Override public double calculate(double salary) { return salary * rate; }
    }

    @Test
    void process_withFixedCalculator() {
        var manager = new PayrollManager(new FixedCalculator(10.0));
        assertEquals(90.0, manager.process(100.0), 0.01);
    }
}
```

---

## 4. Adapt Parameter

**When:** The method receives a parameter you can't control (HttpServletRequest, framework objects).

### Legacy Code

```java
public class PaymentProcessor {
    public void process(HttpServletRequest request) {
        String amount = request.getParameter("amount");
        String userId = request.getParameter("userId");
        // business logic...
    }
}
```

### Refactoring

```java
// Thin interface with only what we need
interface ParameterSource {
    String getParameter(String name);
}

// Wrapper for production
class ServletParameterAdapter implements ParameterSource {
    private final HttpServletRequest request;

    ServletParameterAdapter(HttpServletRequest request) {
        this.request = request;
    }

    @Override
    public String getParameter(String name) {
        return request.getParameter(name);
    }
}

public class PaymentProcessor {
    public void process(ParameterSource params) {
        String amount = params.getParameter("amount");
        String userId = params.getParameter("userId");
        // business logic...
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import java.util.HashMap;
import java.util.Map;

public class PaymentProcessorTest {

    static class FakeParameterSource implements ParameterSource {
        private final Map<String, String> params = new HashMap<>();

        void set(String key, String value) {
            params.put(key, value);
        }

        @Override
        public String getParameter(String name) {
            return params.get(name);
        }
    }

    @Test
    public void testProcess_validParameters() {
        FakeParameterSource fake = new FakeParameterSource();
        fake.set("amount", "100.0");
        fake.set("userId", "user123");

        PaymentProcessor processor = new PaymentProcessor();
        processor.process(fake);
        // Assertions depending on logic...
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import java.util.Map;

class PaymentProcessorTest {

    @Test
    void process_validParameters() {
        var params = Map.of("amount", "100.0", "userId", "user123");
        // Lambda as ParameterSource
        ParameterSource fake = params::get;

        var processor = new PaymentProcessor();
        processor.process(fake);
    }
}
```

---

## 5. Introduce Static Setter (Taming Singletons)

**When:** The code uses Singleton.getInstance() and you can't change it.

### Legacy Code

```java
public class PaymentService {
    private static PaymentService instance = new PaymentService();

    private PaymentService() {
        // Connects to real banking API
    }

    public static PaymentService getInstance() { return instance; }

    public boolean charge(double amount) { return true; }
}

public class Store {
    public void purchase(double price) {
        PaymentService.getInstance().charge(price);
    }
}
```

### Singleton Refactoring

```java
public class PaymentService {
    private static PaymentService instance = new PaymentService();

    protected PaymentService() {} // Open constructor for subclasses

    public static PaymentService getInstance() { return instance; }

    // Static setter for tests
    public static void setInstanceForTest(PaymentService newInstance) {
        instance = newInstance;
    }

    // Reset for tearDown
    public static void resetInstance() {
        instance = new PaymentService();
    }

    public boolean charge(double amount) { return true; }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.mockito.Mockito.*;

public class StoreTest {

    @Before
    public void setup() {
        PaymentService mockPayment = mock(PaymentService.class);
        when(mockPayment.charge(anyDouble())).thenReturn(true);
        PaymentService.setInstanceForTest(mockPayment);
    }

    @After
    public void tearDown() {
        // CRITICAL: restore global state
        PaymentService.resetInstance();
    }

    @Test
    public void testPurchase_usesPaymentService() {
        Store store = new Store();
        store.purchase(50.0);
        verify(PaymentService.getInstance()).charge(50.0);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.*;

class StoreTest {

    @BeforeEach
    void setup() {
        var mockPayment = mock(PaymentService.class);
        when(mockPayment.charge(anyDouble())).thenReturn(true);
        PaymentService.setInstanceForTest(mockPayment);
    }

    @AfterEach
    void tearDown() {
        PaymentService.resetInstance();
    }

    @Test
    void purchase_usesPaymentService() {
        var store = new Store();
        store.purchase(50.0);
        verify(PaymentService.getInstance()).charge(50.0);
    }
}
```

---

## 6. Extract and Override Call

**When:** A single line inside a method prevents you from testing it (e.g., printing, sending email).

### Legacy Code

```java
public class ReportGenerator {
    public String generate() {
        String header = "ANNUAL REPORT";
        String body = computeData();
        // This line breaks the test if no printer is available
        HardwarePrinter.print(header + "\n" + body);
        return header + "\n" + body;
    }

    private String computeData() {
        return "Total: 15000";
    }
}
```

### Refactoring

```java
public class ReportGenerator {
    public String generate() {
        String header = "ANNUAL REPORT";
        String body = computeData();
        String document = header + "\n" + body;
        printDocument(document); // Extracted to a protected method
        return document;
    }

    // Seam: can be overridden in the test
    protected void printDocument(String doc) {
        HardwarePrinter.print(doc);
    }

    private String computeData() {
        return "Total: 15000";
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class ReportGeneratorTest {

    // Subclass that neutralizes the printing
    static class ReportGeneratorWithoutPrinter extends ReportGenerator {
        String capturedDocument;

        @Override
        protected void printDocument(String doc) {
            capturedDocument = doc; // Sensing instead of printing
        }
    }

    @Test
    public void testGenerate_producesCompleteReport() {
        ReportGeneratorWithoutPrinter gen = new ReportGeneratorWithoutPrinter();
        String result = gen.generate();

        assertEquals("ANNUAL REPORT\nTotal: 15000", result);
        assertEquals("ANNUAL REPORT\nTotal: 15000", gen.capturedDocument);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ReportGeneratorTest {

    @Test
    void generate_producesCompleteReport() {
        var printedDocuments = new java.util.ArrayList<String>();

        var gen = new ReportGenerator() {
            @Override
            protected void printDocument(String doc) {
                printedDocuments.add(doc); // Capture in a list
            }
        };

        var result = gen.generate();

        assertEquals("ANNUAL REPORT\nTotal: 15000", result);
        assertEquals(1, printedDocuments.size());
    }
}
```

---

## 7. Encapsulate Global Reference / Replace Global Reference with Getter

**When:** The code accesses a Singleton or global variable directly. You don't want to (or can't) modify the Singleton.

### Legacy Code

```java
public class PriceCalculator {
    public double calculate(double basePrice) {
        // Direct access to Singleton
        if (GlobalConfig.instance.isSaleDay()) {
            return basePrice * 0.5;
        }
        return basePrice;
    }
}
```

### Refactoring

```java
public class PriceCalculator {
    public double calculate(double basePrice) {
        if (isSaleDay()) { // Access via protected method
            return basePrice * 0.5;
        }
        return basePrice;
    }

    // Getter that encapsulates the global reference
    protected boolean isSaleDay() {
        return GlobalConfig.instance.isSaleDay();
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class PriceCalculatorTest {

    @Test
    public void testCalculate_onSaleDay_appliesDiscount() {
        PriceCalculator calc = new PriceCalculator() {
            @Override
            protected boolean isSaleDay() {
                return true; // Force the scenario
            }
        };

        assertEquals(50.0, calc.calculate(100.0), 0.01);
    }

    @Test
    public void testCalculate_noSale_fullPrice() {
        PriceCalculator calc = new PriceCalculator() {
            @Override
            protected boolean isSaleDay() {
                return false;
            }
        };

        assertEquals(100.0, calc.calculate(100.0), 0.01);
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class PriceCalculatorTest {

    private PriceCalculator createWithSale(boolean isSale) {
        return new PriceCalculator() {
            @Override
            protected boolean isSaleDay() {
                return isSale;
            }
        };
    }

    @ParameterizedTest
    @CsvSource({
        "100.0, true,  50.0",
        "100.0, false, 100.0",
        "200.0, true,  100.0"
    })
    void calculate_dependingOnSaleDay(double base, boolean sale, double expected) {
        var calc = createWithSale(sale);
        assertEquals(expected, calc.calculate(base), 0.01);
    }
}
```

---

## 8. Push Down Dependency

**When:** You want the main class to contain only pure logic and "push down" the toxic dependencies into a production subclass.

### Legacy Code

```java
public class LogAnalyzer {
    public int analyze(List<String> lines) {
        int errors = 0;
        for (String line : lines) {
            if (line.contains("ERROR")) {
                errors++;
                PrinterDriver.printLine("ALERT: " + line); // Toxic
            }
        }
        return errors;
    }
}
```

### Refactoring

```java
// Class becomes abstract (contains pure logic)
public abstract class LogAnalyzer {
    public int analyze(List<String> lines) {
        int errors = 0;
        for (String line : lines) {
            if (line.contains("ERROR")) {
                errors++;
                recordError(line);
            }
        }
        return errors;
    }

    protected abstract void recordError(String error);
}

// Production subclass (takes on the dependency)
class LogAnalyzerProduction extends LogAnalyzer {
    @Override
    protected void recordError(String error) {
        PrinterDriver.printLine("ALERT: " + error);
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.*;

public class LogAnalyzerTest {

    static class TestableLogAnalyzer extends LogAnalyzer {
        List<String> recordedErrors = new ArrayList<>();

        @Override
        protected void recordError(String error) {
            recordedErrors.add(error);
        }
    }

    @Test
    public void testAnalyze_detectsTwoErrors() {
        TestableLogAnalyzer analyzer = new TestableLogAnalyzer();
        List<String> logs = Arrays.asList(
            "INFO: All OK",
            "ERROR: Disk full",
            "INFO: Restarting",
            "ERROR: Network timeout"
        );

        int errors = analyzer.analyze(logs);

        assertEquals(2, errors);
        assertEquals(2, analyzer.recordedErrors.size());
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.ArrayList;
import static org.junit.jupiter.api.Assertions.*;

class LogAnalyzerTest {

    @Test
    void analyze_detectsAndRecordsErrors() {
        var capturedErrors = new ArrayList<String>();

        var analyzer = new LogAnalyzer() {
            @Override
            protected void recordError(String error) {
                capturedErrors.add(error);
            }
        };

        var logs = List.of("INFO: OK", "ERROR: Disk full", "ERROR: Timeout");
        var totalErrors = analyzer.analyze(logs);

        assertAll(
            () -> assertEquals(2, totalErrors),
            () -> assertEquals(2, capturedErrors.size()),
            () -> assertTrue(capturedErrors.get(0).contains("Disk"))
        );
    }
}
```
