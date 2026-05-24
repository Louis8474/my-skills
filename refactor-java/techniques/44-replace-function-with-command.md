# Replace Function with Command

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11

## Problem

A function needs capabilities that a simple function cannot provide: undo, logging, queuing, complex lifecycle, or a rich set of configuration parameters.

## Motivation

The Command pattern encapsulates a function invocation as an object. This enables undo/redo, queuing, logging, and complex parameter setup. Use it when a plain method is too limited. But don't overuse it — if a simple method works, keep the simple method.

## Java 8 Example

```java
// BEFORE: complex scoring function with many locals
int score(Candidate candidate, MedicalExam exam, ScoringGuide guide) {
    int result = 0;
    int healthLevel = 0;
    // ... 30 lines of scoring logic
    return result;
}

// AFTER: Command Object — can now add undo, logging, etc.
class Scorer {
    private final Candidate candidate;
    private final MedicalExam exam;
    private final ScoringGuide guide;
    private int result;
    private int healthLevel;

    Scorer(Candidate candidate, MedicalExam exam, ScoringGuide guide) {
        this.candidate = candidate;
        this.exam = exam;
        this.guide = guide;
    }

    int execute() {
        result = 0;
        healthLevel = 0;
        scoreSmoking();
        scoreBMI();
        scoreExercise();
        return result;
    }

    private void scoreSmoking() { /* extract freely — fields are shared */ }
    private void scoreBMI() { /* ... */ }
    private void scoreExercise() { /* ... */ }
}
```

## Inverse

Replace Command with Function — when the command object is trivial, use a simple method instead.

## Related Smells

Long Method, Long Parameter List
