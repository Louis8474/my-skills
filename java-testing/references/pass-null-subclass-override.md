# Pass Null, Subclass and Override, Break Out Method Object — Multi-Version

From *Working Effectively with Legacy Code*, Chapters 9 and 25 (Michael Feathers).

These techniques focus on **getting a class instantiated and testable** when constructors or methods are too complex. They complement the basic catalog in `dependency-breaking.md`.

---

## 1. Pass Null

**When:** The method you want to test does not use a specific constructor parameter. Instead of building a complex object, just pass `null`.

**Warning:** Only use when you are SURE the parameter will not be accessed during the test. If it is, you get a `NullPointerException` — which is actually useful: it tells you exactly which dependency the method really needs.

### Legacy Code

```java
public class InvoiceProcessor {
    private final CustomerRepository customerRepo;
    private final AuditLog auditLog;
    private final TaxCalculator taxCalculator;

    public InvoiceProcessor(CustomerRepository customerRepo,
                            AuditLog auditLog,
                            TaxCalculator taxCalculator) {
        this.customerRepo = customerRepo;
        this.auditLog = auditLog;
        this.taxCalculator = taxCalculator;
    }

    // This method only uses taxCalculator
    public double calculateTotal(double baseAmount) {
        double tax = taxCalculator.computeTax(baseAmount);
        return baseAmount + tax;
    }

    // This method uses customerRepo and auditLog
    public void processInvoice(String customerId, double amount) {
        Customer customer = customerRepo.findById(customerId);
        auditLog.record("Processing invoice for " + customer.getName());
        // ... more logic
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class InvoiceProcessorTest {

    @Test
    public void testCalculateTotal_addsTaxToBase() {
        TaxCalculator taxCalc = mock(TaxCalculator.class);
        when(taxCalc.computeTax(100.0)).thenReturn(21.0);

        // Pass null for customerRepo and auditLog — calculateTotal never touches them
        InvoiceProcessor processor = new InvoiceProcessor(null, null, taxCalc);

        double total = processor.calculateTotal(100.0);

        assertEquals(121.0, total, 0.01);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class InvoiceProcessorTest {

    @Test
    void calculateTotal_addsTaxToBase() {
        var taxCalc = mock(TaxCalculator.class);
        when(taxCalc.computeTax(100.0)).thenReturn(21.0);

        // Pass null for unused dependencies
        var processor = new InvoiceProcessor(null, null, taxCalc);

        var total = processor.calculateTotal(100.0);

        assertEquals(121.0, total, 0.01);
    }

    @Test
    void calculateTotal_nullDependencyCausesNPE_ifAccessed() {
        var taxCalc = mock(TaxCalculator.class);
        when(taxCalc.computeTax(50.0)).thenReturn(10.5);
        var processor = new InvoiceProcessor(null, null, taxCalc);

        // This works fine — customerRepo and auditLog are never accessed
        assertEquals(60.5, processor.calculateTotal(50.0), 0.01);

        // But this would throw NullPointerException because processInvoice uses customerRepo
        assertThrows(NullPointerException.class, () -> processor.processInvoice("C001", 50.0));
    }
}
```

---

## 2. Subclass and Override Method (General Pattern)

**When:** A method in the class does something you cannot tolerate in a test (sends email, writes to disk, calls external API). Override it in a testing subclass to neutralize or capture the behavior.

This is the GENERAL pattern behind Extract and Override Call, Extract and Override Factory Method, and similar techniques. Use it when you need fine-grained control over what happens inside the class.

### Legacy Code

```java
public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public String placeOrder(String product, int quantity) {
        String orderId = generateOrderId();
        orderRepository.save(new Order(orderId, product, quantity));
        sendConfirmationEmail(orderId, product);
        return orderId;
    }

    // Talks to a real SMTP server — cannot run in tests
    protected void sendConfirmationEmail(String orderId, String product) {
        SmtpClient client = new SmtpClient("smtp.company.com");
        client.send("orders@company.com",
                    "New order " + orderId + " for " + product);
    }

    protected String generateOrderId() {
        return "ORD-" + System.currentTimeMillis();
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class OrderServiceTest {

    @Mock
    OrderRepository orderRepository;

    // Testing subclass: overrides problematic methods
    static class TestableOrderService extends OrderService {
        List<String> sentEmails = new ArrayList<>();
        String fixedOrderId = "ORD-TEST-001";

        TestableOrderService(OrderRepository repo) {
            super(repo);
        }

        @Override
        protected void sendConfirmationEmail(String orderId, String product) {
            // Capture instead of sending
            sentEmails.add(orderId + ":" + product);
        }

        @Override
        protected String generateOrderId() {
            return fixedOrderId; // Deterministic for testing
        }
    }

    @Test
    public void testPlaceOrder_savesOrderAndSendsEmail() {
        TestableOrderService service = new TestableOrderService(orderRepository);

        String orderId = service.placeOrder("Widget", 5);

        assertEquals("ORD-TEST-001", orderId);
        verify(orderRepository).save(any(Order.class));
        assertEquals(1, service.sentEmails.size());
        assertEquals("ORD-TEST-001:Widget", service.sentEmails.get(0));
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.ArrayList;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    OrderRepository orderRepository;

    @Test
    void placeOrder_savesOrderAndCapturesEmail() {
        var sentEmails = new ArrayList<String>();

        // Anonymous subclass: override both methods inline
        var service = new OrderService(orderRepository) {
            @Override
            protected void sendConfirmationEmail(String orderId, String product) {
                sentEmails.add(orderId + ":" + product);
            }

            @Override
            protected String generateOrderId() {
                return "ORD-FIXED-42";
            }
        };

        var orderId = service.placeOrder("Gadget", 3);

        assertEquals("ORD-FIXED-42", orderId);
        verify(orderRepository).save(any(Order.class));
        assertEquals(1, sentEmails.size());
        assertEquals("ORD-FIXED-42:Gadget", sentEmails.get(0));
    }
}
```

---

## 3. Break Out Method Object

**When:** A method is so long and tangled with local variables that Extract Method is painful. Move the entire method body into its own class, where local variables become fields and method parameters become constructor parameters. The new class is testable independently.

### Steps

1. Create a new class named after the method (e.g., `calculatePrice` becomes `PriceCalculation`).
2. Add a constructor that takes the original method's parameters plus a reference to the original object (if needed).
3. Turn local variables into fields.
4. Copy the method body into a `run()` (or `execute()`) method.
5. Replace the original method with delegation to the new class.

### Legacy Code

```java
public class ShippingCalculator {

    private final WarehouseService warehouse;

    public ShippingCalculator(WarehouseService warehouse) {
        this.warehouse = warehouse;
    }

    // Long method with many local variables — hard to extract smaller methods
    public double calculateShipping(Order order) {
        double baseWeight = 0.0;
        double volumetricWeight = 0.0;
        double insuranceSurcharge = 0.0;
        double distanceFactor = 1.0;
        boolean isFragile = false;

        for (Item item : order.getItems()) {
            baseWeight += item.getWeight();
            volumetricWeight += (item.getLength() * item.getWidth() * item.getHeight()) / 5000.0;
            if (item.isFragile()) {
                isFragile = true;
                insuranceSurcharge += item.getValue() * 0.02;
            }
        }

        double effectiveWeight = Math.max(baseWeight, volumetricWeight);
        String zone = warehouse.getZoneFor(order.getDestination());

        if ("REMOTE".equals(zone)) {
            distanceFactor = 2.5;
        } else if ("SUBURBAN".equals(zone)) {
            distanceFactor = 1.5;
        }

        double cost = effectiveWeight * 1.50 * distanceFactor;
        cost += insuranceSurcharge;

        if (isFragile) {
            cost += 15.0; // Flat fragile handling fee
        }

        return Math.round(cost * 100.0) / 100.0;
    }
}
```

### Refactoring — Method Object

```java
// New class: the method body becomes testable in isolation
public class ShippingCostCalculation {
    private final WarehouseService warehouse;
    private final Order order;

    // Former local variables are now fields
    private double baseWeight = 0.0;
    private double volumetricWeight = 0.0;
    private double insuranceSurcharge = 0.0;
    private double distanceFactor = 1.0;
    private boolean isFragile = false;

    public ShippingCostCalculation(WarehouseService warehouse, Order order) {
        this.warehouse = warehouse;
        this.order = order;
    }

    public double execute() {
        computeWeightsAndInsurance();
        computeDistanceFactor();
        return computeFinalCost();
    }

    // Now we CAN extract methods easily — locals are fields
    private void computeWeightsAndInsurance() {
        for (Item item : order.getItems()) {
            baseWeight += item.getWeight();
            volumetricWeight += (item.getLength() * item.getWidth() * item.getHeight()) / 5000.0;
            if (item.isFragile()) {
                isFragile = true;
                insuranceSurcharge += item.getValue() * 0.02;
            }
        }
    }

    private void computeDistanceFactor() {
        String zone = warehouse.getZoneFor(order.getDestination());
        if ("REMOTE".equals(zone)) {
            distanceFactor = 2.5;
        } else if ("SUBURBAN".equals(zone)) {
            distanceFactor = 1.5;
        }
    }

    private double computeFinalCost() {
        double effectiveWeight = Math.max(baseWeight, volumetricWeight);
        double cost = effectiveWeight * 1.50 * distanceFactor;
        cost += insuranceSurcharge;
        if (isFragile) {
            cost += 15.0;
        }
        return Math.round(cost * 100.0) / 100.0;
    }
}

// Original class delegates to the method object
public class ShippingCalculator {
    private final WarehouseService warehouse;

    public ShippingCalculator(WarehouseService warehouse) {
        this.warehouse = warehouse;
    }

    public double calculateShipping(Order order) {
        return new ShippingCostCalculation(warehouse, order).execute();
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import java.util.Arrays;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class ShippingCostCalculationTest {

    @Test
    public void testExecute_remoteZoneWithFragileItems() {
        WarehouseService warehouse = mock(WarehouseService.class);
        when(warehouse.getZoneFor("Alaska")).thenReturn("REMOTE");

        Item fragileItem = mock(Item.class);
        when(fragileItem.getWeight()).thenReturn(2.0);
        when(fragileItem.getLength()).thenReturn(10.0);
        when(fragileItem.getWidth()).thenReturn(10.0);
        when(fragileItem.getHeight()).thenReturn(10.0);
        when(fragileItem.isFragile()).thenReturn(true);
        when(fragileItem.getValue()).thenReturn(500.0);

        Order order = mock(Order.class);
        when(order.getItems()).thenReturn(Arrays.asList(fragileItem));
        when(order.getDestination()).thenReturn("Alaska");

        ShippingCostCalculation calc = new ShippingCostCalculation(warehouse, order);
        double result = calc.execute();

        // effectiveWeight = max(2.0, 0.2) = 2.0
        // cost = 2.0 * 1.50 * 2.5 = 7.50
        // insuranceSurcharge = 500.0 * 0.02 = 10.0
        // fragile fee = 15.0
        // total = 7.50 + 10.0 + 15.0 = 32.50
        assertEquals(32.50, result, 0.01);
    }

    @Test
    public void testExecute_localZoneNoFragileItems() {
        WarehouseService warehouse = mock(WarehouseService.class);
        when(warehouse.getZoneFor("Downtown")).thenReturn("LOCAL");

        Item normalItem = mock(Item.class);
        when(normalItem.getWeight()).thenReturn(5.0);
        when(normalItem.getLength()).thenReturn(20.0);
        when(normalItem.getWidth()).thenReturn(20.0);
        when(normalItem.getHeight()).thenReturn(20.0);
        when(normalItem.isFragile()).thenReturn(false);

        Order order = mock(Order.class);
        when(order.getItems()).thenReturn(Arrays.asList(normalItem));
        when(order.getDestination()).thenReturn("Downtown");

        ShippingCostCalculation calc = new ShippingCostCalculation(warehouse, order);
        double result = calc.execute();

        // effectiveWeight = max(5.0, 1.6) = 5.0
        // cost = 5.0 * 1.50 * 1.0 = 7.50
        assertEquals(7.50, result, 0.01);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ShippingCostCalculationTest {

    @Test
    void execute_remoteZoneWithFragileItem_includesAllSurcharges() {
        var warehouse = mock(WarehouseService.class);
        when(warehouse.getZoneFor("Alaska")).thenReturn("REMOTE");

        var fragileItem = mock(Item.class);
        when(fragileItem.getWeight()).thenReturn(2.0);
        when(fragileItem.getLength()).thenReturn(10.0);
        when(fragileItem.getWidth()).thenReturn(10.0);
        when(fragileItem.getHeight()).thenReturn(10.0);
        when(fragileItem.isFragile()).thenReturn(true);
        when(fragileItem.getValue()).thenReturn(500.0);

        var order = mock(Order.class);
        when(order.getItems()).thenReturn(List.of(fragileItem));
        when(order.getDestination()).thenReturn("Alaska");

        var calc = new ShippingCostCalculation(warehouse, order);
        var result = calc.execute();

        // effectiveWeight=2.0, cost=2.0*1.50*2.5=7.50, insurance=10.0, fragile=15.0
        assertEquals(32.50, result, 0.01);
    }

    @Test
    void execute_suburbanZoneNormalItem_appliesSuburbanFactor() {
        var warehouse = mock(WarehouseService.class);
        when(warehouse.getZoneFor("Suburb")).thenReturn("SUBURBAN");

        var item = mock(Item.class);
        when(item.getWeight()).thenReturn(4.0);
        when(item.getLength()).thenReturn(10.0);
        when(item.getWidth()).thenReturn(10.0);
        when(item.getHeight()).thenReturn(10.0);
        when(item.isFragile()).thenReturn(false);

        var order = mock(Order.class);
        when(order.getItems()).thenReturn(List.of(item));
        when(order.getDestination()).thenReturn("Suburb");

        var calc = new ShippingCostCalculation(warehouse, order);
        var result = calc.execute();

        // effectiveWeight=max(4.0, 0.2)=4.0, cost=4.0*1.50*1.5=9.0
        assertEquals(9.0, result, 0.01);
    }
}
```
