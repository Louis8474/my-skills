# Supersede Instance Variable, Primitivize Parameter, Skin and Wrap — Multi-Version

From *Working Effectively with Legacy Code*, Chapters 9, 14, and 25 (Michael Feathers).

These techniques focus on **structural and API-level dependency breaking** — replacing internal state after construction, simplifying method signatures, and isolating third-party APIs. They complement the basic catalog in `dependency-breaking.md` and the instantiation techniques in `pass-null-subclass-override.md`.

---

## 1. Supersede Instance Variable

**When:** You cannot change the constructor, but you need to replace an internally created dependency AFTER construction.

### Steps

1. Identify the instance variable that holds the problematic dependency.
2. Add a package-private or protected setter method that allows replacing it.
3. In the test, construct the object normally, then call the setter to inject the test double.

**Warning:** This is a temporary measure — a "smell." It introduces temporal coupling (the object is in an invalid state between construction and the setter call). Plan to refactor toward constructor injection later.

### Legacy Code

```java
public class NotificationService {
    private EmailGateway emailGateway;
    private SmsGateway smsGateway;

    // Constructor creates real gateways — cannot change its signature
    // (e.g., instantiated by a framework via reflection)
    public NotificationService() {
        this.emailGateway = new EmailGateway("smtp.prod.com", 587);
        this.smsGateway = new SmsGateway("https://sms-api.prod.com");
    }

    public boolean notifyUser(String userId, String message) {
        boolean emailSent = emailGateway.send(userId + "@company.com", message);
        boolean smsSent = smsGateway.send(userId, message);
        return emailSent || smsSent;
    }
}
```

### Refactoring

```java
public class NotificationService {
    private EmailGateway emailGateway;
    private SmsGateway smsGateway;

    public NotificationService() {
        this.emailGateway = new EmailGateway("smtp.prod.com", 587);
        this.smsGateway = new SmsGateway("https://sms-api.prod.com");
    }

    // Supersede methods — package-private so only tests in the same package can call them
    void supersedeEmailGateway(EmailGateway gateway) {
        this.emailGateway = gateway;
    }

    void supersedeSmsGateway(SmsGateway gateway) {
        this.smsGateway = gateway;
    }

    public boolean notifyUser(String userId, String message) {
        boolean emailSent = emailGateway.send(userId + "@company.com", message);
        boolean smsSent = smsGateway.send(userId, message);
        return emailSent || smsSent;
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class NotificationServiceTest {

    private NotificationService service;
    private EmailGateway mockEmail;
    private SmsGateway mockSms;

    @Before
    public void setup() {
        service = new NotificationService();

        // Supersede the internally created gateways with mocks
        mockEmail = mock(EmailGateway.class);
        mockSms = mock(SmsGateway.class);
        service.supersedeEmailGateway(mockEmail);
        service.supersedeSmsGateway(mockSms);
    }

    @Test
    public void testNotifyUser_bothSucceed_returnsTrue() {
        when(mockEmail.send("user1@company.com", "Hello")).thenReturn(true);
        when(mockSms.send("user1", "Hello")).thenReturn(true);

        boolean result = service.notifyUser("user1", "Hello");

        assertTrue(result);
        verify(mockEmail).send("user1@company.com", "Hello");
        verify(mockSms).send("user1", "Hello");
    }

    @Test
    public void testNotifyUser_onlyEmailSucceeds_returnsTrue() {
        when(mockEmail.send("user2@company.com", "Alert")).thenReturn(true);
        when(mockSms.send("user2", "Alert")).thenReturn(false);

        assertTrue(service.notifyUser("user2", "Alert"));
    }

    @Test
    public void testNotifyUser_bothFail_returnsFalse() {
        when(mockEmail.send("user3@company.com", "Down")).thenReturn(false);
        when(mockSms.send("user3", "Down")).thenReturn(false);

        assertFalse(service.notifyUser("user3", "Down"));
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationServiceTest {

    private NotificationService service;
    private EmailGateway mockEmail;
    private SmsGateway mockSms;

    @BeforeEach
    void setup() {
        service = new NotificationService();

        // Supersede after construction
        mockEmail = mock(EmailGateway.class);
        mockSms = mock(SmsGateway.class);
        service.supersedeEmailGateway(mockEmail);
        service.supersedeSmsGateway(mockSms);
    }

    @Test
    void notifyUser_bothSucceed_returnsTrue() {
        when(mockEmail.send("user1@company.com", "Hello")).thenReturn(true);
        when(mockSms.send("user1", "Hello")).thenReturn(true);

        var result = service.notifyUser("user1", "Hello");

        assertTrue(result);
        verify(mockEmail).send("user1@company.com", "Hello");
        verify(mockSms).send("user1", "Hello");
    }

    @Test
    void notifyUser_onlySmsFails_stillReturnsTrue() {
        when(mockEmail.send("u@company.com", "Hi")).thenReturn(true);
        when(mockSms.send("u", "Hi")).thenReturn(false);

        assertTrue(service.notifyUser("u", "Hi"));
    }

    @Test
    void notifyUser_bothFail_returnsFalse() {
        when(mockEmail.send("x@company.com", "Bye")).thenReturn(false);
        when(mockSms.send("x", "Bye")).thenReturn(false);

        assertFalse(service.notifyUser("x", "Bye"));
    }
}
```

---

## 2. Primitivize Parameter

**When:** A method receives a complex object but only reads primitive data from it. Change the method signature to accept primitives directly, making the method easier to test without constructing (or mocking) the complex object.

### Legacy Code

```java
public class DiscountCalculator {

    public double calculateDiscount(Customer customer) {
        String tier = customer.getLoyaltyTier();
        int yearsActive = customer.getYearsActive();
        double totalSpent = customer.getTotalSpent();

        if ("GOLD".equals(tier) && yearsActive > 5) {
            return totalSpent * 0.15;
        } else if ("SILVER".equals(tier) || yearsActive > 3) {
            return totalSpent * 0.10;
        }
        return totalSpent * 0.05;
    }
}
```

### Refactoring

```java
public class DiscountCalculator {

    // Original method delegates to the primitivized version
    public double calculateDiscount(Customer customer) {
        return calculateDiscount(
            customer.getLoyaltyTier(),
            customer.getYearsActive(),
            customer.getTotalSpent()
        );
    }

    // Primitivized version: easy to test, no Customer dependency
    public double calculateDiscount(String loyaltyTier, int yearsActive, double totalSpent) {
        if ("GOLD".equals(loyaltyTier) && yearsActive > 5) {
            return totalSpent * 0.15;
        } else if ("SILVER".equals(loyaltyTier) || yearsActive > 3) {
            return totalSpent * 0.10;
        }
        return totalSpent * 0.05;
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class DiscountCalculatorTest {

    private final DiscountCalculator calculator = new DiscountCalculator();

    @Test
    public void testCalculateDiscount_goldTierOver5Years_15Percent() {
        double discount = calculator.calculateDiscount("GOLD", 6, 1000.0);
        assertEquals(150.0, discount, 0.01);
    }

    @Test
    public void testCalculateDiscount_silverTier_10Percent() {
        double discount = calculator.calculateDiscount("SILVER", 1, 1000.0);
        assertEquals(100.0, discount, 0.01);
    }

    @Test
    public void testCalculateDiscount_bronzeTierOver3Years_10Percent() {
        double discount = calculator.calculateDiscount("BRONZE", 4, 1000.0);
        assertEquals(100.0, discount, 0.01);
    }

    @Test
    public void testCalculateDiscount_bronzeTierUnder3Years_5Percent() {
        double discount = calculator.calculateDiscount("BRONZE", 2, 1000.0);
        assertEquals(50.0, discount, 0.01);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class DiscountCalculatorTest {

    private final DiscountCalculator calculator = new DiscountCalculator();

    @ParameterizedTest
    @CsvSource({
        "GOLD,   6, 1000.0, 150.0",
        "GOLD,   5, 1000.0, 100.0",
        "SILVER, 1,  800.0,  80.0",
        "BRONZE, 4,  600.0,  60.0",
        "BRONZE, 2,  400.0,  20.0"
    })
    void calculateDiscount_variousTiersAndYears(String tier, int years, double spent, double expected) {
        var discount = calculator.calculateDiscount(tier, years, spent);
        assertEquals(expected, discount, 0.01);
    }

    @Test
    void calculateDiscount_goldOver5Years_applies15Percent() {
        // No need to construct a Customer object at all
        assertEquals(150.0, calculator.calculateDiscount("GOLD", 6, 1000.0), 0.01);
    }
}
```

---

## 3. Skin and Wrap the API

**When:** Your code is deeply coupled to a third-party API that you cannot mock — static methods, final classes, or classes with complex constructors. Create a thin interface ("skin") with only the methods you need, then wrap the real API behind it.

### Steps

1. Identify which methods of the third-party API your code actually calls.
2. Create an interface with only those methods.
3. Create a production wrapper class that implements the interface and delegates to the real API.
4. Change your code to depend on the interface instead of the API directly.
5. In tests, mock the interface.

### Legacy Code

```java
public class AlertService {

    public void sendCriticalAlert(String message) {
        // CloudMessaging is a third-party class with only static methods
        // Cannot be mocked with standard Mockito
        CloudMessaging.initialize("api-key-prod-12345");
        CloudMessaging.setUrgency("CRITICAL");
        CloudMessaging.broadcast(message);
        String deliveryId = CloudMessaging.getLastDeliveryId();
        System.out.println("Delivered: " + deliveryId);
    }

    public int getPendingAlertCount() {
        CloudMessaging.initialize("api-key-prod-12345");
        return CloudMessaging.getPendingCount();
    }
}
```

### Refactoring

```java
// Step 1-2: Interface ("skin") with only the methods we need
public interface MessagingService {
    void initialize(String apiKey);
    void setUrgency(String level);
    void broadcast(String message);
    String getLastDeliveryId();
    int getPendingCount();
}

// Step 3: Production wrapper that delegates to the real static API
public class CloudMessagingWrapper implements MessagingService {

    @Override
    public void initialize(String apiKey) {
        CloudMessaging.initialize(apiKey);
    }

    @Override
    public void setUrgency(String level) {
        CloudMessaging.setUrgency(level);
    }

    @Override
    public void broadcast(String message) {
        CloudMessaging.broadcast(message);
    }

    @Override
    public String getLastDeliveryId() {
        return CloudMessaging.getLastDeliveryId();
    }

    @Override
    public int getPendingCount() {
        return CloudMessaging.getPendingCount();
    }
}

// Step 4: AlertService depends on the interface
public class AlertService {
    private final MessagingService messaging;

    // Production constructor
    public AlertService() {
        this(new CloudMessagingWrapper());
    }

    // Testable constructor
    public AlertService(MessagingService messaging) {
        this.messaging = messaging;
    }

    public void sendCriticalAlert(String message) {
        messaging.initialize("api-key-prod-12345");
        messaging.setUrgency("CRITICAL");
        messaging.broadcast(message);
        String deliveryId = messaging.getLastDeliveryId();
        System.out.println("Delivered: " + deliveryId);
    }

    public int getPendingAlertCount() {
        messaging.initialize("api-key-prod-12345");
        return messaging.getPendingCount();
    }
}
```

### Test — Java 8 + JUnit 4

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.MockitoJUnitRunner;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

@RunWith(MockitoJUnitRunner.class)
public class AlertServiceTest {

    @Mock
    MessagingService mockMessaging;

    @Test
    public void testSendCriticalAlert_initializesAndBroadcasts() {
        when(mockMessaging.getLastDeliveryId()).thenReturn("DEL-001");
        AlertService service = new AlertService(mockMessaging);

        service.sendCriticalAlert("Server is down!");

        InOrder inOrder = inOrder(mockMessaging);
        inOrder.verify(mockMessaging).initialize("api-key-prod-12345");
        inOrder.verify(mockMessaging).setUrgency("CRITICAL");
        inOrder.verify(mockMessaging).broadcast("Server is down!");
        inOrder.verify(mockMessaging).getLastDeliveryId();
    }

    @Test
    public void testGetPendingAlertCount_returnsPendingCount() {
        when(mockMessaging.getPendingCount()).thenReturn(42);
        AlertService service = new AlertService(mockMessaging);

        int count = service.getPendingAlertCount();

        assertEquals(42, count);
        verify(mockMessaging).initialize("api-key-prod-12345");
    }
}
```

### Test — Java 11+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertServiceTest {

    @Mock
    MessagingService mockMessaging;

    @Test
    void sendCriticalAlert_initializesThenSetsUrgencyThenBroadcasts() {
        when(mockMessaging.getLastDeliveryId()).thenReturn("DEL-001");
        var service = new AlertService(mockMessaging);

        service.sendCriticalAlert("Database unreachable!");

        var inOrder = inOrder(mockMessaging);
        inOrder.verify(mockMessaging).initialize("api-key-prod-12345");
        inOrder.verify(mockMessaging).setUrgency("CRITICAL");
        inOrder.verify(mockMessaging).broadcast("Database unreachable!");
        inOrder.verify(mockMessaging).getLastDeliveryId();
    }

    @Test
    void getPendingAlertCount_delegatesToMessagingService() {
        when(mockMessaging.getPendingCount()).thenReturn(7);
        var service = new AlertService(mockMessaging);

        assertEquals(7, service.getPendingAlertCount());
        verify(mockMessaging).initialize("api-key-prod-12345");
    }
}
```
