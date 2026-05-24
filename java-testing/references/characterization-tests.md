# Characterization Tests — Multi-Version Guide

From *Working Effectively with Legacy Code*, Chapters 13 and 22 (Michael Feathers).

Characterization Tests document what the code does **right now**, not what it should do. They are the safety net before any refactoring — what Feathers calls **the Software Vise** (a clamp that holds the code's behavior in place while you work on it).

## Why Characterization Tests, Not Specification Tests

In legacy code, the specification is often lost, outdated, or never existed. The only "truth" is what the code actually does today. Characterization tests don't judge whether the code is correct — they **anchor** the current behavior so you'll know immediately if a refactoring changes something unintentionally.

## Heuristic for Writing Characterization Tests

1. Instantiate the class and call the method you're interested in
2. Write an assertion you know will fail (expect `0` or `null`)
3. Run the test: the error tells you the truth ("Expected 0 but was 150")
4. Adjust the assertion to the actual value
5. Repeat with edge cases and boundary conditions

**Rule about bugs:** If you discover a bug during characterization, do NOT fix it. Document the bug with the test as-is. Other parts of the system may depend on the buggy behavior. Fix it later, once you have the full safety net in place, and update the test at that point.

**Targeted Testing:** Don't try to characterize the entire system at once. Focus only on the area where you need to make changes. Characterize that small zone, make your change, and move on.

---

## Example 1: Basic Characterization of a Calculation

### Legacy Code (common to all versions)

```java
// Legacy class that computes taxes with obscure logic
public class TaxCalculator {
    public double calculate(double amount, boolean isImported) {
        double rate = 0.15;
        if (amount > 1000) rate += 0.05;
        if (isImported) rate += 0.10;
        return amount * rate;
    }
}
```

### Java 8 + JUnit 4

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class TaxCalculatorTest {

    // Characterization Test: we "pin" what the code does TODAY
    @Test
    public void testCalculate_amountBelow1000_notImported() {
        TaxCalculator calc = new TaxCalculator();
        // Step 1: Guess wrong → assertEquals(0, calc.calculate(500, false), 0.01);
        // Step 2: Test fails with "Expected 0.0 but was 75.0"
        // Step 3: Pin the actual value
        assertEquals(75.0, calc.calculate(500, false), 0.01);
    }

    @Test
    public void testCalculate_amountAbove1000_imported() {
        TaxCalculator calc = new TaxCalculator();
        // 1500 * (0.15 + 0.05 + 0.10) = 1500 * 0.30 = 450.0
        assertEquals(450.0, calc.calculate(1500, true), 0.01);
    }

    @Test
    public void testCalculate_exactlyAt1000_notImported() {
        TaxCalculator calc = new TaxCalculator();
        // Edge case: amount == 1000, the > 1000 condition is NOT met
        assertEquals(150.0, calc.calculate(1000, false), 0.01);
    }
}
```

### Java 11 + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.*;

class TaxCalculatorTest {

    @Test
    @DisplayName("Characterization: low amount, not imported")
    void calculate_amountBelow1000_notImported() {
        var calc = new TaxCalculator();
        assertEquals(75.0, calc.calculate(500, false), 0.01);
    }

    // JUnit 5 allows parameterized tests to characterize multiple cases
    @ParameterizedTest(name = "amount={0}, imported={1}, expected={2}")
    @DisplayName("Full characterization of calculate()")
    @CsvSource({
        "500,   false, 75.0",
        "1500,  true,  450.0",
        "1000,  false, 150.0",
        "1001,  false, 200.2",
        "0,     true,  0.0"
    })
    void calculate_multipleCases(double amount, boolean imported, double expected) {
        var calc = new TaxCalculator();
        assertEquals(expected, calc.calculate(amount, imported), 0.01);
    }
}
```

### Java 17+ + JUnit 5

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import static org.junit.jupiter.api.Assertions.*;

import java.util.stream.Stream;

class TaxCalculatorTest {

    // Java 17: Use records for test data
    record TaxCase(double amount, boolean imported, double expected, String description) {}

    static Stream<TaxCase> testCases() {
        return Stream.of(
            new TaxCase(500, false, 75.0, "low amount, not imported"),
            new TaxCase(1500, true, 450.0, "high amount, imported"),
            new TaxCase(1000, false, 150.0, "boundary at exactly 1000"),
            new TaxCase(1001, false, 200.2, "just above the threshold"),
            new TaxCase(0, true, 0.0, "zero amount, imported")
        );
    }

    @ParameterizedTest(name = "{3}")
    @MethodSource("testCases")
    @DisplayName("Full characterization of calculate()")
    void calculate_characterization(double amount, boolean imported, double expected, String desc) {
        var calc = new TaxCalculator();
        assertEquals(expected, calc.calculate(amount, imported), 0.01,
            () -> "Failed on case: " + desc);
    }
}
```

---

## Example 2: Characterization with ApprovalTests (Golden Master)

When the output is complex (HTML, JSON, reports), using ApprovalTests is more effective.

**Prerequisite:** Before adding ApprovalTests dependencies or approving Golden Master files, read `approvaltests-setup.md` for reporters, CI behavior, scrubbers, approved vs received files, and baseline review rules. If dependencies are missing or unclear, use `dependency-setup.md` first so setup follows the project's Maven/Gradle conventions.

### Legacy Code

```java
public class ReportGenerator {
    public String generate(String client, double total) {
        return "CLIENT: " + client + "\n" +
               "NET TOTAL: " + total + "\n" +
               "TAXES: " + (total * 0.21) + "\n" +
               "GRAND TOTAL: " + (total * 1.21) + "\n" +
               "----------------END";
    }
}
```

### Java 8 + JUnit 4 with ApprovalTests

```java
import org.approvaltests.Approvals;
import org.junit.Test;

public class ReportGeneratorTest {

    @Test
    public void testGoldenMasterReport() {
        ReportGenerator gen = new ReportGenerator();
        String result = gen.generate("ACME Corp", 1000.0);

        // First run: FAILS and generates a .received.txt file
        // Review the file; if correct, rename it to .approved.txt
        // Future runs: compares against the .approved.txt
        Approvals.verify(result);
    }
}
```

### Java 11+ / JUnit 5 with ApprovalTests

```java
import org.approvaltests.Approvals;
import org.junit.jupiter.api.Test;

class ReportGeneratorTest {

    @Test
    void goldenMaster_fullReport() {
        var gen = new ReportGenerator();
        var result = gen.generate("ACME Corp", 1000.0);
        Approvals.verify(result);
    }

    @Test
    void goldenMaster_highAmountReport() {
        var gen = new ReportGenerator();
        var result = gen.generate("MegaCorp", 50000.0);
        Approvals.verify(result);
    }
}
```

---

## Example 3: Characterization with Sensing

When the code produces invisible side effects (writes to console, sends emails), you need a "sensor."

### Legacy Code

```java
public class AlarmSystem {
    private final Alert alert;

    public AlarmSystem(Alert alert) {
        this.alert = alert;
    }

    public void checkSensors(int motionLevel) {
        if (motionLevel > 10) {
            alert.trigger();
        }
    }
}

public interface Alert {
    void trigger();
}
```

### Java 8 + JUnit 4 (Manual Fake)

```java
import org.junit.Test;
import static org.junit.Assert.*;

public class AlarmSystemTest {

    // Fake for sensing: captures the side effect
    static class FakeAlert implements Alert {
        boolean wasTriggered = false;

        @Override
        public void trigger() {
            wasTriggered = true;
        }
    }

    @Test
    public void testCheck_highMotion_triggersAlarm() {
        FakeAlert fake = new FakeAlert();
        AlarmSystem system = new AlarmSystem(fake);

        system.checkSensors(15);

        assertTrue("Alarm should have been triggered with motion > 10", fake.wasTriggered);
    }

    @Test
    public void testCheck_lowMotion_doesNotTriggerAlarm() {
        FakeAlert fake = new FakeAlert();
        AlarmSystem system = new AlarmSystem(fake);

        system.checkSensors(5);

        assertFalse("Alarm should NOT have been triggered with motion <= 10", fake.wasTriggered);
    }
}
```

### Java 11 + JUnit 5 + Mockito

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlarmSystemTest {

    @Mock
    Alert alertMock;

    @Test
    void check_highMotion_triggersAlarm() {
        var system = new AlarmSystem(alertMock);

        system.checkSensors(15);

        verify(alertMock).trigger();
    }

    @Test
    void check_lowMotion_doesNotTriggerAlarm() {
        var system = new AlarmSystem(alertMock);

        system.checkSensors(5);

        verify(alertMock, never()).trigger();
    }
}
```

### Java 17+ + JUnit 5 + Mockito (with Records)

```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.stream.Stream;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlarmSystemTest {

    @Mock
    Alert alertMock;

    // Java 17: record for test cases
    record AlarmCase(int level, boolean shouldTrigger, String description) {}

    static Stream<AlarmCase> alarmCases() {
        return Stream.of(
            new AlarmCase(15, true, "high motion triggers"),
            new AlarmCase(11, true, "just above threshold triggers"),
            new AlarmCase(10, false, "exactly at threshold does NOT trigger"),
            new AlarmCase(5, false, "low motion does NOT trigger"),
            new AlarmCase(0, false, "no motion does NOT trigger")
        );
    }

    @ParameterizedTest(name = "{2}")
    @MethodSource("alarmCases")
    void check_fullCharacterization(int level, boolean shouldTrigger, String desc) {
        var system = new AlarmSystem(alertMock);

        system.checkSensors(level);

        if (shouldTrigger) {
            verify(alertMock).trigger();
        } else {
            verify(alertMock, never()).trigger();
        }
    }
}
```
