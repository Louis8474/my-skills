# Sensing and Separation — The Two Reasons to Break Dependencies

From *Working Effectively with Legacy Code*, Chapter 3 (Michael Feathers).

There are exactly **two reasons** to break dependencies in legacy code:

1. **Sensing** — to detect/observe what the code does (side effects, internal state)
2. **Separation** — to isolate the code from things that prevent it from running in a test (databases, networks, hardware)

Every dependency-breaking technique you apply serves one or both of these goals. Before picking a technique, ask: "Am I unable to **see** what happened, or am I unable to **run** this code at all?"

---

## 1. Sensing

Sensing is needed when the code under test produces effects we **cannot observe** from within a test:

- Writes to console or log files
- Sends emails or push notifications
- Updates a GUI widget
- Calls an external API or message queue
- Modifies shared/global state that the test cannot inspect

The solution is to introduce a **sensor** — a fake or mock collaborator that **captures** what happened so the test can verify it.

### Example: Sensing with a Fake (Java 8 + JUnit 4)

Production code — a service that sends notifications through a collaborator:

```java
// --- Production code ---

package com.example.notifications;

public interface Notifier {
    void send(String recipient, String message);
}
```

```java
package com.example.notifications;

public class SmtpNotifier implements Notifier {
    @Override
    public void send(String recipient, String message) {
        // Connects to SMTP server and sends a real email
        // We cannot observe this in a unit test
    }
}
```

```java
package com.example.notifications;

public class OrderService {
    private final Notifier notifier;

    public OrderService(Notifier notifier) {
        this.notifier = notifier;
    }

    public void placeOrder(String customerEmail, String item) {
        // ... business logic to persist the order ...
        notifier.send(customerEmail, "Your order for " + item + " has been placed.");
    }
}
```

Test code — a hand-written fake that **captures** every message sent:

```java
// --- Test code ---

package com.example.notifications;

import java.util.ArrayList;
import java.util.List;

// The Fake: implements the production interface but stores calls instead of sending
public class FakeNotifier implements Notifier {
    // This is the "sensor face" — visible only to the test
    private final List<SentMessage> sentMessages = new ArrayList<>();

    @Override
    public void send(String recipient, String message) {
        sentMessages.add(new SentMessage(recipient, message));
    }

    // Accessors for verification
    public List<SentMessage> getSentMessages() {
        return sentMessages;
    }

    public int messageCount() {
        return sentMessages.size();
    }

    // Simple value object to hold captured data
    public static class SentMessage {
        public final String recipient;
        public final String message;

        public SentMessage(String recipient, String message) {
            this.recipient = recipient;
            this.message = message;
        }
    }
}
```

```java
package com.example.notifications;

import org.junit.Test;
import static org.junit.Assert.*;

public class OrderServiceTest {

    @Test
    public void shouldSendConfirmationEmailWhenOrderPlaced() {
        // Given
        FakeNotifier fakeNotifier = new FakeNotifier();
        OrderService service = new OrderService(fakeNotifier);

        // When
        service.placeOrder("alice@example.com", "Running Shoes");

        // Then — we can now SENSE what happened
        assertEquals(1, fakeNotifier.messageCount());
        FakeNotifier.SentMessage sent = fakeNotifier.getSentMessages().get(0);
        assertEquals("alice@example.com", sent.recipient);
        assertTrue(sent.message.contains("Running Shoes"));
    }
}
```

### Example: Sensing with Mockito (Java 11+ + JUnit 5)

Same scenario, but using Mockito `verify()` and `ArgumentCaptor` instead of a hand-written fake:

```java
package com.example.notifications;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    Notifier notifier;

    @InjectMocks
    OrderService service;

    @Captor
    ArgumentCaptor<String> recipientCaptor;

    @Captor
    ArgumentCaptor<String> messageCaptor;

    @Test
    void shouldSendConfirmationEmailWhenOrderPlaced() {
        // When
        service.placeOrder("alice@example.com", "Running Shoes");

        // Then — verify the interaction happened with the right arguments
        verify(notifier).send(recipientCaptor.capture(), messageCaptor.capture());
        assertThat(recipientCaptor.getValue()).isEqualTo("alice@example.com");
        assertThat(messageCaptor.getValue()).contains("Running Shoes");
    }
}
```

---

## 2. Separation

Separation is needed when the code **cannot run at all** in a test environment because of heavy dependencies:

- The constructor opens a database connection
- A method requires a running HTTP server
- The class talks to hardware (sensors, printers, card readers)
- Static initialization loads a huge configuration file from a fixed path

The solution is to **break the link** between the class and the heavy dependency so you can substitute a lightweight alternative in tests.

### Example: Separation via Parameterize Constructor (Java 8 + JUnit 4)

The problem — the constructor creates the heavy dependency internally, so you cannot instantiate the class in a test at all:

```java
// --- Legacy production code (BEFORE) ---

package com.example.reporting;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ReportGenerator {
    private final Connection connection;

    public ReportGenerator() {
        // This constructor CANNOT run in a test — it needs a live database
        try {
            this.connection = DriverManager.getConnection(
                "jdbc:postgresql://prod-server:5432/reports", "user", "pass"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Cannot connect to reporting database", e);
        }
    }

    public String generateMonthlyReport(int month) {
        // Uses this.connection to query the database
        // ... business logic ...
        return "Report for month " + month;
    }
}
```

Refactored — add a second constructor that accepts the dependency. The original constructor still works for production:

```java
// --- Refactored production code (AFTER) ---

package com.example.reporting;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class ReportGenerator {
    private final Connection connection;

    // Original constructor — production code keeps calling this
    public ReportGenerator() {
        this(createDefaultConnection());
    }

    // New constructor — tests use this to inject a fake/mock
    public ReportGenerator(Connection connection) {
        this.connection = connection;
    }

    public String generateMonthlyReport(int month) {
        // Uses this.connection to query the database
        // ... business logic ...
        return "Report for month " + month;
    }

    private static Connection createDefaultConnection() {
        try {
            return DriverManager.getConnection(
                "jdbc:postgresql://prod-server:5432/reports", "user", "pass"
            );
        } catch (SQLException e) {
            throw new RuntimeException("Cannot connect to reporting database", e);
        }
    }
}
```

Now the test can instantiate the class without a real database:

```java
// --- Test code ---

package com.example.reporting;

import org.junit.Test;

import java.sql.Connection;

import static org.junit.Assert.*;
import static org.mockito.Mockito.mock;

public class ReportGeneratorTest {

    @Test
    public void shouldGenerateReportForGivenMonth() {
        // Given — we can now SEPARATE from the real database
        Connection fakeConnection = mock(Connection.class);
        ReportGenerator generator = new ReportGenerator(fakeConnection);

        // When
        String report = generator.generateMonthlyReport(3);

        // Then
        assertNotNull(report);
        assertTrue(report.contains("3"));
    }
}
```

### Example: Separation via Extract Interface (Java 11+ + JUnit 5)

The problem — the class depends on a concrete class that is expensive to construct:

```java
// --- Legacy production code (BEFORE) ---

package com.example.inventory;

public class HardwareScanner {
    public HardwareScanner() {
        // Initializes USB driver, opens serial port — cannot run without hardware
    }

    public String scanBarcode() {
        // Reads from physical scanner
        return "REAL-BARCODE-12345";
    }

    public boolean isDeviceReady() {
        // Checks hardware status
        return true;
    }
}
```

```java
package com.example.inventory;

public class InventoryService {
    private final HardwareScanner scanner;

    public InventoryService() {
        this.scanner = new HardwareScanner(); // Cannot instantiate without hardware
    }

    public String checkIn() {
        if (!scanner.isDeviceReady()) {
            return "Scanner not ready";
        }
        String barcode = scanner.scanBarcode();
        // ... persist to inventory database ...
        return "Checked in: " + barcode;
    }
}
```

Refactored — extract an interface from `HardwareScanner`, then depend on the interface:

```java
// --- Refactored production code (AFTER) ---

package com.example.inventory;

// Step 1: Extract interface with the methods the client actually uses
public interface BarcodeScanner {
    String scanBarcode();
    boolean isDeviceReady();
}
```

```java
package com.example.inventory;

// Step 2: The original class implements the new interface (no other changes)
public class HardwareScanner implements BarcodeScanner {
    public HardwareScanner() {
        // Initializes USB driver, opens serial port
    }

    @Override
    public String scanBarcode() {
        return "REAL-BARCODE-12345";
    }

    @Override
    public boolean isDeviceReady() {
        return true;
    }
}
```

```java
package com.example.inventory;

// Step 3: The service depends on the interface, not the concrete class
public class InventoryService {
    private final BarcodeScanner scanner;

    // Production constructor
    public InventoryService() {
        this(new HardwareScanner());
    }

    // Testable constructor
    public InventoryService(BarcodeScanner scanner) {
        this.scanner = scanner;
    }

    public String checkIn() {
        if (!scanner.isDeviceReady()) {
            return "Scanner not ready";
        }
        String barcode = scanner.scanBarcode();
        return "Checked in: " + barcode;
    }
}
```

Now the test can run without any hardware:

```java
// --- Test code ---

package com.example.inventory;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    BarcodeScanner scanner;

    @InjectMocks
    InventoryService service;

    @Test
    void shouldCheckInItemWhenScannerIsReady() {
        // Given — we are now SEPARATED from the hardware
        when(scanner.isDeviceReady()).thenReturn(true);
        when(scanner.scanBarcode()).thenReturn("TEST-00001");

        // When
        String result = service.checkIn();

        // Then
        assertThat(result).isEqualTo("Checked in: TEST-00001");
    }

    @Test
    void shouldReportScannerNotReadyWhenDeviceUnavailable() {
        // Given
        when(scanner.isDeviceReady()).thenReturn(false);

        // When
        String result = service.checkIn();

        // Then
        assertThat(result).isEqualTo("Scanner not ready");
    }
}
```

---

## 3. Fake Objects vs Mock Objects

Both fakes and mocks replace real collaborators, but they serve different verification styles.

### Fake Object

A **fake** is a simple, working implementation of an interface that replaces the real one. It has **two faces**:

| Face | Purpose |
|---|---|
| **System face** | Implements the production interface so the code under test can call it normally |
| **Test face** | Exposes accessors (`getSentMessages()`, `getStoredRecords()`) that let the test inspect what happened |

Fakes are **state-based**: the test checks the fake's internal state after the action.

```java
// Fake with two faces
public class FakeUserRepository implements UserRepository {

    // --- System face (implements the interface) ---
    private final Map<String, User> store = new HashMap<>();

    @Override
    public void save(User user) {
        store.put(user.getId(), user);
    }

    @Override
    public User findById(String id) {
        return store.get(id);
    }

    // --- Test face (lets the test inspect state) ---
    public int storedCount() {
        return store.size();
    }

    public boolean contains(String id) {
        return store.containsKey(id);
    }
}
```

### Mock Object

A **mock** is a smart object configured with **expectations**. It verifies that specific methods were called with specific arguments. Mocks are **interaction-based**: the test checks *what was called*, not *what state resulted*.

```java
// Mock with Mockito
@Mock
UserRepository repository;

@Test
void shouldSaveUserToRepository() {
    User user = new User("u-1", "Alice");

    service.register(user);

    // Interaction-based: verify the call happened
    verify(repository).save(user);
    verify(repository, never()).findById(any());
}
```

### When to Use Each

| Use a Fake when... | Use a Mock when... |
|---|---|
| You need to verify **accumulated state** (e.g., "3 messages were captured") | You need to verify a **specific call** happened (e.g., "`send()` was called once with these args") |
| The collaborator has simple semantics you can replicate in a few lines | The collaborator has many methods but you only care about one or two interactions |
| You want tests that are **resilient to refactoring** — they break only if behavior changes | You want to assert the **exact protocol** between objects |
| You plan to reuse the same fake across many tests | The verification is unique to this one test |

### Combined Example — Sensing with Both Styles

Suppose `AuditService` must log every login attempt:

```java
public interface AuditLog {
    void record(String event, String userId);
}
```

**With a fake** (state-based sensing):

```java
public class FakeAuditLog implements AuditLog {
    private final List<String> events = new ArrayList<>();

    @Override
    public void record(String event, String userId) {
        events.add(event + ":" + userId);
    }

    public List<String> getEvents() {
        return Collections.unmodifiableList(events);
    }
}

@Test
void shouldRecordLoginEvent() {
    FakeAuditLog auditLog = new FakeAuditLog();
    AuthService auth = new AuthService(auditLog);

    auth.login("u-42");

    assertThat(auditLog.getEvents()).containsExactly("LOGIN:u-42");
}
```

**With a mock** (interaction-based sensing):

```java
@Mock
AuditLog auditLog;

@InjectMocks
AuthService auth;

@Test
void shouldRecordLoginEvent() {
    auth.login("u-42");

    verify(auditLog).record("LOGIN", "u-42");
}
```

Both tests verify the same behavior. The fake test is more resilient if `record()` gains a third parameter later (the fake just ignores it). The mock test is more precise about the exact arguments.

---

## Quick Decision Checklist

Before breaking a dependency, answer these two questions:

1. **Can I run this code in a test?**
   - No -> You have a **Separation** problem. Break the dependency so the code can execute.
   - Yes -> Move to question 2.

2. **Can I observe the result from the test?**
   - No -> You have a **Sensing** problem. Introduce a fake or mock to capture effects.
   - Yes -> You may not need to break this dependency at all.

Often you face **both** problems at once: the code cannot run (Separation) *and* its effects are invisible (Sensing). Fix Separation first — get the code running in a test harness — then address Sensing to verify behavior.
