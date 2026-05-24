# Mockito Patterns — Multi-Version Guide

Quick reference for Mockito with Java 8/JUnit 4, Java 11/JUnit 5, and Java 17+/JUnit 5.

---

## Setup by Version

### Java 8 + JUnit 4 + Mockito 2-3

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>3.12.4</version>
    <scope>test</scope>
</dependency>
```

```java
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.MockitoJUnitRunner;
import static org.mockito.Mockito.*;
import static org.junit.Assert.*;

@RunWith(MockitoJUnitRunner.class)
public class MyClassTest {
    @Mock
    Dependency mockDep;

    @InjectMocks
    MyClass sut; // System Under Test

    @Test
    public void testSomething() {
        when(mockDep.method()).thenReturn("value");
        // ...
    }
}
```

### Java 11+ + JUnit 5 + Mockito 4+

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-core</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>
```

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MyClassTest {
    @Mock
    Dependency mockDep;

    @InjectMocks
    MyClass sut;

    @Test
    void something() {
        when(mockDep.method()).thenReturn("value");
        // ...
    }
}
```

---

## Common Patterns for Legacy Code

### 1. Verify a Method Was Called (Sensing)

```java
// JUnit 4
@Test
public void testProcess_sendsNotification() {
    when(mockService.process(any())).thenReturn(true);

    sut.execute();

    verify(mockService).process(any());
    verify(mockService, times(1)).process(any());
}

// JUnit 5 (identical but without public)
@Test
void process_sendsNotification() {
    when(mockService.process(any())).thenReturn(true);

    sut.execute();

    verify(mockService).process(any());
}
```

### 2. Verify It Was NOT Called

```java
// JUnit 4
@Test
public void testProcess_noData_doesNotCallService() {
    sut.execute(Collections.emptyList());
    verify(mockService, never()).process(any());
}

// JUnit 5
@Test
void process_noData_doesNotCallService() {
    sut.execute(List.of());
    verify(mockService, never()).process(any());
}
```

### 3. Capture Arguments (Argument Captor)

Useful for verifying WHAT was passed to the dependency.

```java
// JUnit 4
@Test
public void testProcess_sendsCorrectAmountToBank() {
    ArgumentCaptor<Double> captor = ArgumentCaptor.forClass(Double.class);

    sut.processPayment(150.0);

    verify(mockBank).charge(captor.capture());
    assertEquals(150.0, captor.getValue(), 0.01);
}

// JUnit 5 with @Captor
@Captor
ArgumentCaptor<Double> amountCaptor;

@Test
void processPayment_sendsCorrectAmountToBank() {
    sut.processPayment(150.0);

    verify(mockBank).charge(amountCaptor.capture());
    assertEquals(150.0, amountCaptor.getValue(), 0.01);
}
```

### 4. Simulate Exceptions

```java
// JUnit 4
@Test(expected = ConnectionException.class)
public void testProcess_networkError_throwsException() {
    when(mockService.connect()).thenThrow(new ConnectionException("Timeout"));
    sut.process();
}

// JUnit 5
@Test
void process_networkError_throwsException() {
    when(mockService.connect()).thenThrow(new ConnectionException("Timeout"));

    assertThrows(ConnectionException.class, () -> sut.process());
}

// JUnit 5 with message verification
@Test
void process_networkError_descriptiveMessage() {
    when(mockService.connect()).thenThrow(new ConnectionException("Timeout"));

    var ex = assertThrows(ConnectionException.class, () -> sut.process());
    assertTrue(ex.getMessage().contains("Timeout"));
}
```

### 5. Mock Void Methods

```java
// All versions: doNothing, doThrow, doAnswer for void methods
@Test
void save_withError_logsAndContinues() {
    doThrow(new IOException("Disk full")).when(mockRepo).save(any());

    // If the SUT handles the exception internally:
    assertDoesNotThrow(() -> sut.trySave(data));
    verify(mockLogger).error(contains("Disk full"));
}
```

### 6. Mock with Dynamic Responses (Answer)

Useful for simulating complex legacy behavior.

```java
// JUnit 4
@Test
public void testProcess_dynamicResponse() {
    when(mockRepo.find(anyString())).thenAnswer(invocation -> {
        String id = invocation.getArgument(0);
        if (id.startsWith("VIP-")) {
            return new Customer(id, CustomerType.VIP);
        }
        return new Customer(id, CustomerType.NORMAL);
    });

    Result result = sut.process("VIP-001");
    assertTrue(result.hasDiscount());
}

// JUnit 5 (identical)
@Test
void process_vipCustomer_appliesDiscount() {
    when(mockRepo.find(anyString())).thenAnswer(inv -> {
        var id = (String) inv.getArgument(0);
        return id.startsWith("VIP-")
            ? new Customer(id, CustomerType.VIP)
            : new Customer(id, CustomerType.NORMAL);
    });

    var result = sut.process("VIP-001");
    assertTrue(result.hasDiscount());
}
```

### 7. Spy (Partial Mock) — For Legacy

When you need most of the object to work for real, but want to intercept 1-2 methods.

```java
// JUnit 4
@Test
public void testProcess_spyToInterceptExternalCall() {
    LegacyProcessor spy = spy(new LegacyProcessor());

    // Override ONLY the method that connects to the outside
    doNothing().when(spy).sendToExternalService(any());

    spy.processComplete(data);

    // Verify internal logic ran
    verify(spy).validate(data);
    // And that the external call was "simulated"
    verify(spy).sendToExternalService(any());
}

// JUnit 5
@Test
void processComplete_withSpy_neutralizesExternalSend() {
    var spy = spy(new LegacyProcessor());
    doNothing().when(spy).sendToExternalService(any());

    spy.processComplete(data);

    verify(spy).validate(data);
    verify(spy).sendToExternalService(any());
}
```

### 8. Call Order Verification (InOrder)

```java
// JUnit 5
@Test
void process_callsInCorrectOrder() {
    sut.processOrder(order);

    var inOrder = inOrder(mockValidator, mockInventory, mockPayment);
    inOrder.verify(mockValidator).validate(order);
    inOrder.verify(mockInventory).reserve(order);
    inOrder.verify(mockPayment).charge(order);
}
```

---

## Mockito with Final Classes and Static Methods (Java 11+)

Starting with Mockito 3.4+, you can mock final classes and static methods using `mockito-inline`.

```xml
<dependency>
    <groupId>org.mockito</groupId>
    <artifactId>mockito-inline</artifactId>
    <version>5.2.0</version>
    <scope>test</scope>
</dependency>
```

### Mocking a Static Method

```java
import org.mockito.MockedStatic;

@Test
void process_mockStaticMethod() {
    try (MockedStatic<LegacyUtil> mockUtil = mockStatic(LegacyUtil.class)) {
        mockUtil.when(() -> LegacyUtil.getDate()).thenReturn("2024-01-01");

        var result = sut.process();

        assertEquals("2024-01-01", result.getDate());
    }
    // Outside the try-with-resources, original behavior is restored
}
```

### Mocking a Final Class

```java
// With mockito-inline, this simply works:
@Mock
LegacyFinalClass mockFinal; // No longer throws an error

@Test
void process_withFinalClass() {
    when(mockFinal.calculate()).thenReturn(42);
    assertEquals(42, sut.use(mockFinal));
}
```

---

## Compatibility Summary

| Feature | Mockito 2-3 (JUnit 4) | Mockito 4-5 (JUnit 5) |
|---------|------------------------|------------------------|
| `@Mock`, `@Spy` | ✅ | ✅ |
| `@InjectMocks` | ✅ | ✅ |
| `@Captor` | ✅ | ✅ |
| Runner | `@RunWith(MockitoJUnitRunner.class)` | `@ExtendWith(MockitoExtension.class)` |
| Static mocking | ❌ (needs PowerMock) | ✅ (with mockito-inline) |
| Final class mocking | ❌ (needs PowerMock) | ✅ (with mockito-inline) |
| `assertThrows` | ❌ (use `@Test(expected=)`) | ✅ |
| `assertAll` | ❌ | ✅ |
| Parameterized tests | `@Parameterized` (runner) | `@ParameterizedTest` (more flexible) |
