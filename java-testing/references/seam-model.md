# The Seam Model — Multi-Version Guide

Based on Chapter 4 of *Working Effectively with Legacy Code* by Michael Feathers.

The Seam Model is the foundational concept for testing legacy code. Understanding seams lets you break dependencies and get code under test **without modifying the code at the point you want to change behavior**.

---

## Core Definitions

### What Is a Seam?

A **seam** is a place where you can alter the behavior of your program without editing the code at that place.

In legacy code, the biggest obstacle to testing is dependencies: classes that create database connections, call external APIs, read files, or use singletons. A seam is any point where you can substitute that dependency with a test-friendly alternative.

> "A seam is a place where you can alter behavior in your program without editing in that place." — Michael Feathers, WELC Chapter 4

### What Is an Enabling Point?

Every seam has an **enabling point**: the place where you decide which behavior to use.

The enabling point is where you make the choice between the production behavior and the test behavior. It is physically separate from the seam itself. For example, if a method call is the seam (because it can be overridden), the enabling point is where the object is created — because that is where you choose between the real class and a test subclass.

---

## The Three Types of Seams

| Type | Mechanism | Enabling Point | Java Relevance |
|---|---|---|---|
| **Object Seam** | Polymorphism (override methods) | Where the object is created or injected | Primary technique |
| **Link Seam** | Classpath / build configuration swaps implementations | Build script, classpath order, dependency scope | Occasionally useful |
| **Preprocessing Seam** | Macros (`#define`, `#ifdef`) | Preprocessor directives | Not applicable to Java |

---

## 1. Object Seams

Object seams are the most important seam type in Java. They exploit polymorphism: if a method is not `final`, `static`, or `private`, it can be overridden in a subclass. That method call is a seam, and the place where the object is created is the enabling point.

### Why This Matters

In legacy code, you often encounter classes where the problematic dependency is accessed through a regular method call. That method call IS the seam — you do not need to change it. You only need to ensure that, during testing, a different object (one that overrides that method) is used instead.

### Legacy Code

```java
package com.example.orders;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class OrderProcessor {

    public double calculateTotal(int orderId) throws SQLException {
        // Hard-coded dependency: connects to a real database
        Connection conn = DriverManager.getConnection(
            "jdbc:postgresql://prod-server:5432/orders", "admin", "secret");

        PreparedStatement stmt = conn.prepareStatement(
            "SELECT price, quantity FROM order_items WHERE order_id = ?");
        stmt.setInt(1, orderId);
        ResultSet rs = stmt.executeQuery();

        double total = 0.0;
        while (rs.next()) {
            total += rs.getDouble("price") * rs.getInt("quantity");
        }

        rs.close();
        stmt.close();
        conn.close();
        return total;
    }
}
```

This class cannot be tested as-is: it connects to a production database. But notice that `DriverManager.getConnection(...)` is a static call buried inside the method. We cannot override it directly. The key insight: **extract the database access into a protected method, creating an explicit seam**.

### Refactoring: Expose the Seam

```java
package com.example.orders;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class OrderProcessor {

    public double calculateTotal(int orderId) throws SQLException {
        List<double[]> items = fetchOrderItems(orderId);

        double total = 0.0;
        for (double[] item : items) {
            total += item[0] * item[1]; // price * quantity
        }
        return total;
    }

    // SEAM: this method call can be overridden in a subclass.
    // The enabling point is where OrderProcessor is instantiated.
    protected List<double[]> fetchOrderItems(int orderId) throws SQLException {
        Connection conn = DriverManager.getConnection(
            "jdbc:postgresql://prod-server:5432/orders", "admin", "secret");
        PreparedStatement stmt = conn.prepareStatement(
            "SELECT price, quantity FROM order_items WHERE order_id = ?");
        stmt.setInt(1, orderId);
        ResultSet rs = stmt.executeQuery();

        List<double[]> items = new ArrayList<>();
        while (rs.next()) {
            items.add(new double[]{rs.getDouble("price"), rs.getInt("quantity")});
        }
        rs.close();
        stmt.close();
        conn.close();
        return items;
    }
}
```

Now `fetchOrderItems` is the seam, and **where we create the `OrderProcessor` instance** is the enabling point. In the test, we create a subclass that overrides `fetchOrderItems` to return canned data.

### Test — Java 8 + JUnit 4

```java
package com.example.orders;

import org.junit.Test;
import static org.junit.Assert.*;

import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;

public class OrderProcessorTest {

    // Test subclass that overrides the seam
    static class TestableOrderProcessor extends OrderProcessor {
        private final List<double[]> fakeItems;

        TestableOrderProcessor(List<double[]> fakeItems) {
            this.fakeItems = fakeItems;
        }

        @Override
        protected List<double[]> fetchOrderItems(int orderId) {
            // No database access — the seam is replaced with test data
            return fakeItems;
        }
    }

    @Test
    public void testCalculateTotal_multipliesAndSums() throws SQLException {
        // Enabling point: we choose the test subclass here
        List<double[]> items = Arrays.asList(
            new double[]{10.0, 2},  // price=10, qty=2 -> 20
            new double[]{5.50, 3}   // price=5.50, qty=3 -> 16.50
        );
        OrderProcessor processor = new TestableOrderProcessor(items);

        double total = processor.calculateTotal(42);

        assertEquals(36.50, total, 0.01);
    }

    @Test
    public void testCalculateTotal_emptyOrder_returnsZero() throws SQLException {
        List<double[]> noItems = Arrays.asList();
        OrderProcessor processor = new TestableOrderProcessor(noItems);

        double total = processor.calculateTotal(99);

        assertEquals(0.0, total, 0.01);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
package com.example.orders;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;

import java.sql.SQLException;
import java.util.List;

class OrderProcessorTest {

    @Test
    @DisplayName("Object Seam: override fetchOrderItems to avoid database")
    void calculateTotal_multipliesAndSums() throws SQLException {
        // Enabling point: anonymous subclass overrides the seam
        var processor = new OrderProcessor() {
            @Override
            protected List<double[]> fetchOrderItems(int orderId) {
                return List.of(
                    new double[]{10.0, 2},  // 20.0
                    new double[]{5.50, 3}   // 16.50
                );
            }
        };

        var total = processor.calculateTotal(42);

        assertEquals(36.50, total, 0.01);
    }

    @Test
    void calculateTotal_emptyOrder_returnsZero() throws SQLException {
        var processor = new OrderProcessor() {
            @Override
            protected List<double[]> fetchOrderItems(int orderId) {
                return List.of();
            }
        };

        assertEquals(0.0, processor.calculateTotal(99), 0.01);
    }
}
```

### How to Recognize Object Seams in Existing Code

Look for method calls that are:
- Not `static` — instance methods can be overridden
- Not `final` — final methods cannot be overridden
- Not `private` — private methods are not visible to subclasses
- Called on `this` (implicitly or explicitly) — these are candidates for override

Every non-static, non-final, non-private method call in a class is a potential seam.

---

## 2. Link Seams

A link seam uses the build system or classpath to substitute one implementation for another. In Java, this works because the JVM resolves classes at runtime by searching the classpath in order. If two classes have the same fully qualified name, the one found first wins.

The **enabling point** is the build configuration: the classpath order, Maven/Gradle dependency scopes, or source set configuration.

### How It Works in Java

Suppose production code depends on a class `com.vendor.api.PaymentGateway`. You cannot modify this class, and it connects to a real payment provider. You can create a test-only class with the exact same fully qualified name in a test source folder. When tests run, the test version is found first on the classpath.

### Production Code

```java
package com.example.checkout;

import com.vendor.api.PaymentGateway;
import com.vendor.api.PaymentResult;

public class CheckoutService {

    public boolean completePurchase(String customerId, double amount) {
        // Direct usage of the vendor class — no interface, no injection
        PaymentGateway gateway = new PaymentGateway();
        PaymentResult result = gateway.charge(customerId, amount);
        return result.isSuccess();
    }
}
```

### Link Seam: Test-Only Replacement

Create the same class in the test source tree:

**File:** `src/test/java/com/vendor/api/PaymentGateway.java`

```java
package com.vendor.api;

/**
 * Link Seam: this class has the same fully qualified name as the production
 * PaymentGateway. When tests run, the test classpath takes precedence,
 * so this version is loaded instead of the real one.
 */
public class PaymentGateway {

    // Track calls for verification
    public static String lastCustomerId;
    public static double lastAmount;
    public static boolean shouldSucceed = true;

    public static void reset() {
        lastCustomerId = null;
        lastAmount = 0.0;
        shouldSucceed = true;
    }

    public PaymentResult charge(String customerId, double amount) {
        lastCustomerId = customerId;
        lastAmount = amount;
        return new PaymentResult(shouldSucceed);
    }
}
```

**File:** `src/test/java/com/vendor/api/PaymentResult.java`

```java
package com.vendor.api;

public class PaymentResult {
    private final boolean success;

    public PaymentResult(boolean success) {
        this.success = success;
    }

    public boolean isSuccess() {
        return success;
    }
}
```

### Test — Java 8 + JUnit 4

```java
package com.example.checkout;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import com.vendor.api.PaymentGateway;
import static org.junit.Assert.*;

public class CheckoutServiceTest {

    @Before
    public void setup() {
        PaymentGateway.reset();
    }

    @After
    public void tearDown() {
        PaymentGateway.reset();
    }

    @Test
    public void testCompletePurchase_success() {
        PaymentGateway.shouldSucceed = true;
        CheckoutService service = new CheckoutService();

        boolean result = service.completePurchase("CUST-001", 99.99);

        assertTrue(result);
        assertEquals("CUST-001", PaymentGateway.lastCustomerId);
        assertEquals(99.99, PaymentGateway.lastAmount, 0.01);
    }

    @Test
    public void testCompletePurchase_failure() {
        PaymentGateway.shouldSucceed = false;
        CheckoutService service = new CheckoutService();

        boolean result = service.completePurchase("CUST-002", 50.00);

        assertFalse(result);
    }
}
```

### Test — Java 11+ + JUnit 5

```java
package com.example.checkout;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import com.vendor.api.PaymentGateway;
import static org.junit.jupiter.api.Assertions.*;

class CheckoutServiceTest {

    @BeforeEach
    void setup() {
        PaymentGateway.reset();
    }

    @AfterEach
    void tearDown() {
        PaymentGateway.reset();
    }

    @Test
    void completePurchase_success_chargesCorrectAmount() {
        PaymentGateway.shouldSucceed = true;
        var service = new CheckoutService();

        var result = service.completePurchase("CUST-001", 99.99);

        assertAll(
            () -> assertTrue(result),
            () -> assertEquals("CUST-001", PaymentGateway.lastCustomerId),
            () -> assertEquals(99.99, PaymentGateway.lastAmount, 0.01)
        );
    }

    @Test
    void completePurchase_failure_returnsFalse() {
        PaymentGateway.shouldSucceed = false;
        var service = new CheckoutService();

        assertFalse(service.completePurchase("CUST-002", 50.00));
    }
}
```

### Maven/Gradle Test Scope as a Link Seam

Build tools provide a natural link seam through dependency scoping:

**Maven** — the `<scope>test</scope>` ensures a dependency is only on the classpath during test compilation and execution:

```xml
<dependency>
    <groupId>com.example</groupId>
    <artifactId>fake-payment-gateway</artifactId>
    <version>1.0.0</version>
    <scope>test</scope>
</dependency>
```

**Gradle** — `testImplementation` serves the same purpose:

```groovy
dependencies {
    implementation 'com.vendor:payment-gateway:2.0'
    testImplementation 'com.example:fake-payment-gateway:1.0'
}
```

When the test variant of a library provides classes with the same fully qualified names as the production library, the test classpath wins. This is the enabling point: the build configuration determines which implementation the JVM loads.

### When to Use Link Seams

- When you cannot modify the production class at all (vendor code, sealed JARs)
- When the dependency is accessed via `new` and there is no way to inject an alternative
- As a temporary measure until you can introduce a proper Object Seam

### Risks of Link Seams

- Fragile: classpath order can change between build tool versions
- Confusing: two classes with the same name in different source sets
- Hard to maintain: the fake must track changes in the real class API
- Prefer Object Seams whenever possible

---

## 3. Preprocessing Seams

Preprocessing seams use a language preprocessor (like the C/C++ preprocessor) to swap code before compilation. The **enabling point** is the preprocessor directive (`#define`, `#ifdef`).

### C/C++ Example (for reference)

```c
// production.h
#ifndef TESTING
#define db_connect() real_db_connect()
#else
#define db_connect() fake_db_connect()
#endif

void process_order(int order_id) {
    Connection* conn = db_connect();  // SEAM: resolved by preprocessor
    // ...
}
```

The `#define` directive is the enabling point. In production builds, `db_connect()` calls the real function. In test builds (compiled with `-DTESTING`), it calls the fake.

### Why Preprocessing Seams Do Not Apply to Java

Java has no preprocessor. The language was designed to eliminate the complexity and fragility of macro-based code substitution. In Java, you achieve the same goal through:

- **Object Seams** — polymorphism and dependency injection (preferred)
- **Link Seams** — classpath manipulation (when you cannot modify the code)
- **Annotation processing** — compile-time code generation (advanced, not a direct equivalent)

If you encounter legacy Java code that uses preprocessor-like patterns (e.g., `if (DEBUG)` constants, or conditional compilation via build profiles), treat the constant or build profile as the enabling point and refactor toward a proper Object Seam.

---

## How Seams Enable Testing Without Modifying Code Under Test

The power of the Seam Model is that it provides a mental framework for answering the question: **"How can I test this code without changing it?"**

### The Decision Process

```
1. Identify the dependency that prevents testing
2. Find a seam — a point where behavior can be substituted
3. Locate the enabling point — where the choice is made
4. Use the enabling point to select test behavior
```

### Seam Selection Guide

| Situation | Best Seam Type | Technique |
|---|---|---|
| Method calls a collaborator on `this` | Object Seam | Extract and Override (see dependency-breaking.md) |
| Constructor creates dependencies with `new` | Object Seam | Parameterize Constructor, Extract Factory Method |
| Code calls a static method on a class you own | Object Seam | Wrap the static call in an instance method, then override |
| Code uses a vendor class you cannot modify | Link Seam | Same-name class in test source tree |
| Code uses `Singleton.getInstance()` | Object Seam | Introduce Static Setter or Extract and Override |
| Code accesses a global variable | Object Seam | Replace Global Reference with Getter |

### Key Principle

The seam itself is **in** the code under test, but you never edit the seam. You only act at the **enabling point**, which is outside the code under test (typically in the test setup or build configuration). This is what makes seams safe: you break the dependency for testing without altering the logic you are trying to characterize.

---

## Summary

| Concept | Definition |
|---|---|
| **Seam** | A place where you can alter behavior without editing the code at that place |
| **Enabling Point** | The place where you decide which behavior to use (production vs test) |
| **Object Seam** | Based on polymorphism; override a method in a subclass. Enabling point = object creation site |
| **Link Seam** | Based on classpath/build config; swap implementations at build time. Enabling point = build script |
| **Preprocessing Seam** | Based on macros; swap code before compilation. Not applicable to Java |

Object Seams are the primary tool for testing legacy Java code. Master them first, and reach for Link Seams only when Object Seams are not possible.
