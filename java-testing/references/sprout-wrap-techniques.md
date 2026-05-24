# Sprout and Wrap Techniques — Multi-Version

These techniques allow you to add new functionality to legacy code safely, without needing to refactor the entire class first.

---

## 1. Sprout Method

**When:** You need to add new logic in the middle of a long, complex method. Instead of mixing it inline, you isolate it in a new, testable method.

### Legacy Code

```java
public class OrderProcessor {
    public void processOrder(Order order) {
        // ... 50 lines of complex legacy logic ...
        double total = calculateSubtotal(order);
        // ... 50 more lines of legacy logic ...
        saveToDatabase(order, total);
    }
}
```

### Need: Add fraud validation before saving

### Refactoring with Sprout Method

```java
public class OrderProcessor {
    public void processOrder(Order order) {
        // ... 50 lines of complex legacy logic ...
        double total = calculateSubtotal(order);
        // ... 50 more lines of legacy logic ...

        // SPROUT: New method we CAN test
        if (isFraudulent(order)) {
            throw new FraudException("Suspicious order");
        }

        saveToDatabase(order, total);
    }

    // Sprout Method: testable in isolation
    protected boolean isFraudulent(Order order) {
        return order.getAmount() > 10000 && order.isNewUser();
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class OrderProcessorTest {

    @Test
    public void testIsFraudulent_highAmountAndNewUser_detectsFraud() {
        OrderProcessor processor = new OrderProcessor();
        Order suspiciousOrder = new Order(15000, true);

        assertTrue(processor.isFraudulent(suspiciousOrder));
    }

    @Test
    public void testIsFraudulent_highAmountOldUser_notFraud() {
        OrderProcessor processor = new OrderProcessor();
        Order normalOrder = new Order(15000, false);

        assertFalse(processor.isFraudulent(normalOrder));
    }

    @Test
    public void testIsFraudulent_lowAmountNewUser_notFraud() {
        OrderProcessor processor = new OrderProcessor();
        Order normalOrder = new Order(500, true);

        assertFalse(processor.isFraudulent(normalOrder));
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class OrderProcessorTest {

    @ParameterizedTest(name = "amount={0}, newUser={1}, fraud={2}")
    @CsvSource({
        "15000, true,  true",
        "15000, false, false",
        "500,   true,  false",
        "10000, true,  false",
        "10001, true,  true"
    })
    void isFraudulent_combinations(double amount, boolean newUser, boolean expected) {
        var processor = new OrderProcessor();
        var order = new Order(amount, newUser);

        assertEquals(expected, processor.isFraudulent(order));
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import static org.junit.jupiter.api.Assertions.*;
import java.util.stream.Stream;

class OrderProcessorTest {

    record FraudCase(double amount, boolean isNewUser, boolean isFraud, String description) {}

    static Stream<FraudCase> fraudCases() {
        return Stream.of(
            new FraudCase(15000, true, true, "high amount + new user = fraud"),
            new FraudCase(15000, false, false, "high amount + old user = OK"),
            new FraudCase(500, true, false, "low amount + new user = OK"),
            new FraudCase(10000, true, false, "boundary at 10000 = NOT fraud"),
            new FraudCase(10001, true, true, "just above threshold = fraud")
        );
    }

    @ParameterizedTest(name = "{3}")
    @MethodSource("fraudCases")
    void isFraudulent_fullValidation(double amount, boolean isNewUser, boolean isFraud, String desc) {
        var processor = new OrderProcessor();
        var order = new Order(amount, isNewUser);

        assertEquals(isFraud, processor.isFraudulent(order));
    }
}
```

---

## 2. Sprout Class

**When:** The original class's dependencies are so complex that you can't even instantiate it for the Sprout Method. You create a completely independent new class.

### Need: Validate inventory before processing orders

```java
// New independent class, fully testable
public class InventoryValidator {
    private final InventoryRepository inventory;

    public InventoryValidator(InventoryRepository inventory) {
        this.inventory = inventory;
    }

    public ValidationResult validate(Order order) {
        List<String> errors = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            int stock = inventory.getStock(item.getId());
            if (stock < item.getQuantity()) {
                errors.add("Insufficient stock for: " + item.getName() +
                    " (available: " + stock + ", requested: " + item.getQuantity() + ")");
            }
        }
        return errors.isEmpty()
            ? ValidationResult.success()
            : ValidationResult.failure(errors);
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
public class InventoryValidatorTest {

    @Mock
    InventoryRepository inventoryMock;

    @Test
    public void testValidate_sufficientStock_returnsSuccess() {
        when(inventoryMock.getStock("SKU-001")).thenReturn(10);
        InventoryValidator validator = new InventoryValidator(inventoryMock);

        Order order = createOrderWith("SKU-001", 5);
        ValidationResult result = validator.validate(order);

        assertTrue(result.isValid());
    }

    @Test
    public void testValidate_insufficientStock_returnsFailure() {
        when(inventoryMock.getStock("SKU-001")).thenReturn(2);
        InventoryValidator validator = new InventoryValidator(inventoryMock);

        Order order = createOrderWith("SKU-001", 5);
        ValidationResult result = validator.validate(order);

        assertFalse(result.isValid());
        assertEquals(1, result.getErrors().size());
    }

    private Order createOrderWith(String sku, int quantity) {
        Order o = new Order();
        o.addItem(new OrderItem(sku, "Product", quantity));
        return o;
    }
}
```

### Test — Java 17+ + JUnit 5 + Mockito

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryValidatorTest {

    @Mock
    InventoryRepository inventoryMock;

    // Java 17: records for clean test data
    record TestItem(String sku, String name, int quantity) {}

    private Order createOrder(TestItem... items) {
        var order = new Order();
        for (var item : items) {
            order.addItem(new OrderItem(item.sku(), item.name(), item.quantity()));
        }
        return order;
    }

    @Test
    void validate_allInStock_success() {
        when(inventoryMock.getStock("A")).thenReturn(10);
        when(inventoryMock.getStock("B")).thenReturn(20);

        var validator = new InventoryValidator(inventoryMock);
        var order = createOrder(
            new TestItem("A", "Product A", 5),
            new TestItem("B", "Product B", 15)
        );

        var result = validator.validate(order);

        assertTrue(result.isValid());
    }

    @Test
    void validate_oneItemOutOfStock_failure() {
        when(inventoryMock.getStock("A")).thenReturn(10);
        when(inventoryMock.getStock("B")).thenReturn(3);

        var validator = new InventoryValidator(inventoryMock);
        var order = createOrder(
            new TestItem("A", "Product A", 5),
            new TestItem("B", "Product B", 15)
        );

        var result = validator.validate(order);

        assertAll(
            () -> assertFalse(result.isValid()),
            () -> assertEquals(1, result.getErrors().size()),
            () -> assertTrue(result.getErrors().get(0).contains("Product B"))
        );
    }
}
```

---

## 3. Wrap Method

**When:** You need to add behavior before or after an existing functionality.

### Legacy Code

```java
public class PaymentProcessor {
    public void pay(Payment payment) {
        // Complex legacy logic of 200 lines
        executeTransaction(payment);
    }
}
```

### Need: Add logging before and validation after

### Refactoring with Wrap Method

```java
public class PaymentProcessor {
    // Original public method (now the wrapper)
    public void pay(Payment payment) {
        logPaymentAttempt(payment);   // NEW: before
        payCore(payment);             // OLD: renamed
        verifyResult(payment);        // NEW: after
    }

    // Original method renamed
    private void payCore(Payment payment) {
        // Legacy logic untouched
        executeTransaction(payment);
    }

    // New testable method
    protected void logPaymentAttempt(Payment payment) {
        AuditLog.record("Payment attempt: " + payment.getId());
    }

    // New testable method
    protected void verifyResult(Payment payment) {
        if (payment.getStatus() == PaymentStatus.FAILED) {
            FraudNotifier.alert(payment);
        }
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class PaymentProcessorTest {

    @Test
    public void testVerifyResult_failedPayment_triggersAlert() {
        final boolean[] wasAlerted = {false};

        PaymentProcessor processor = new PaymentProcessor() {
            @Override
            protected void verifyResult(Payment payment) {
                if (payment.getStatus() == PaymentStatus.FAILED) {
                    wasAlerted[0] = true;
                }
            }
        };

        Payment failedPayment = new Payment("P-001", PaymentStatus.FAILED);
        processor.verifyResult(failedPayment);

        assertTrue(wasAlerted[0]);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import java.util.concurrent.atomic.AtomicBoolean;
import static org.junit.jupiter.api.Assertions.*;

class PaymentProcessorTest {

    @Test
    void verifyResult_failedPayment_triggersAlert() {
        var wasAlerted = new AtomicBoolean(false);

        var processor = new PaymentProcessor() {
            @Override
            protected void verifyResult(Payment payment) {
                if (payment.getStatus() == PaymentStatus.FAILED) {
                    wasAlerted.set(true);
                }
            }
        };

        processor.verifyResult(new Payment("P-001", PaymentStatus.FAILED));
        assertTrue(wasAlerted.get());
    }
}
```

---

## 4. Wrap Class (Decorator)

**When:** You can't modify the original class or want to add behavior to all calls transparently.

### Legacy Code

```java
public class LegacyLogger {
    public void log(String message) {
        System.out.println(message);
    }
}
```

### Need: Add timestamp and level to every log entry

### Wrap Class (Decorator)

```java
public class TimestampedLogger extends LegacyLogger {
    private final LegacyLogger innerLogger;

    public TimestampedLogger(LegacyLogger logger) {
        this.innerLogger = logger;
    }

    @Override
    public void log(String message) {
        String timestampedMessage = "[" + java.time.Instant.now() + "] " + message;
        innerLogger.log(timestampedMessage);
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class TimestampedLoggerTest {

    static class CapturingLogger extends LegacyLogger {
        String lastMessage;

        @Override
        public void log(String message) {
            lastMessage = message;
        }
    }

    @Test
    public void testLog_addsTimestamp() {
        CapturingLogger capturing = new CapturingLogger();
        TimestampedLogger logger = new TimestampedLogger(capturing);

        logger.log("Test message");

        assertNotNull(capturing.lastMessage);
        assertTrue(capturing.lastMessage.startsWith("["));
        assertTrue(capturing.lastMessage.contains("Test message"));
    }
}
```

### Test — Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class TimestampedLoggerTest {

    @Test
    void log_addsTimestampToMessage() {
        var capturedMessages = new java.util.ArrayList<String>();

        var baseLogger = new LegacyLogger() {
            @Override
            public void log(String message) {
                capturedMessages.add(message);
            }
        };

        var logger = new TimestampedLogger(baseLogger);
        logger.log("Important event");

        assertAll(
            () -> assertEquals(1, capturedMessages.size()),
            () -> assertTrue(capturedMessages.get(0).startsWith("[")),
            () -> assertTrue(capturedMessages.get(0).contains("Important event"))
        );
    }
}
```
