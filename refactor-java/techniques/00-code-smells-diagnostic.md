# Code Smells Diagnostic Guide

This is your starting point. Before refactoring, identify which smells are present in the code. Each smell maps to specific techniques that address it.

## The 24 Code Smells → Technique Mapping

### Bloaters (code that has grown too large)

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Long Method** | Method > 15-20 lines, does multiple things | Extract Method, Replace Temp with Query, Introduce Parameter Object, Decompose Conditional, Split Loop |
| **Large Class** | Class with too many fields/methods/responsibilities | Extract Class, Extract Superclass, Extract Interface |
| **Long Parameter List** | Method with 3+ parameters | Introduce Parameter Object, Preserve Whole Object, Replace Parameter with Query |
| **Primitive Obsession** | Using String/int/double where domain objects belong | Replace Primitive with Object, Replace Type Code with Subclasses, Introduce Parameter Object |
| **Data Clumps** | Groups of data that always appear together | Extract Class, Introduce Parameter Object |

### Object-Orientation Abusers

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Repeated Switches** | Same switch/if-type in multiple places | Replace Conditional with Polymorphism |
| **Temporary Field** | Fields only set in certain circumstances | Extract Class, Introduce Special Case |
| **Refused Bequest** | Subclass doesn't use most inherited methods | Replace Subclass with Delegate, Replace Superclass with Delegate |
| **Alternative Classes with Different Interfaces** | Two classes do the same thing differently | Change Function Declaration, Extract Superclass, Extract Interface |

### Change Preventers (changes ripple across the codebase)

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Divergent Change** | One class changes for multiple different reasons | Extract Class, Extract Function, Split Phase |
| **Shotgun Surgery** | One change requires editing many classes | Move Method, Move Field, Inline Class |
| **Parallel Inheritance Hierarchies** | Adding a subclass in one hierarchy forces adding one in another | Move Method, Move Field |

### Dispensables (unnecessary code)

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Comments** (as smell) | Comments explaining bad code instead of improving it | Extract Method, Rename, Introduce Assertion |
| **Duplicated Code** | Same logic in multiple places | Extract Method, Pull Up Method, Slide Statements |
| **Lazy Class / Lazy Element** | A class/function that does almost nothing | Inline Class, Inline Function, Collapse Hierarchy |
| **Data Class** | Class with only fields and getters/setters, no behavior | Encapsulate Record, Move Function (move behavior to the data) |
| **Dead Code** | Code that is never executed | Remove Dead Code |
| **Speculative Generality** | Abstractions "just in case" that are never used | Collapse Hierarchy, Inline Function/Class, Remove Dead Code |

### Couplers (excessive coupling between classes)

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Feature Envy** | A method uses more data from another class than its own | Move Method, Extract Method |
| **Inappropriate Intimacy / Insider Trading** | Classes accessing each other's private details | Move Method, Move Field, Hide Delegate, Extract Class |
| **Message Chains** | `a.getB().getC().getD().doThing()` | Hide Delegate, Extract Method |
| **Middle Man** | A class that only delegates to another | Remove Middle Man, Inline Function |

### Data Integrity

| Smell | What It Looks Like | Recommended Techniques |
|-------|-------------------|----------------------|
| **Global Data** | Globally accessible mutable data | Encapsulate Variable |
| **Mutable Data** | Data that changes unpredictably | Encapsulate Variable, Change Reference to Value, Replace Derived Variable with Query |

## Quick Decision Flowchart

```
Is the method too long?
  → Extract Method, Split Loop, Decompose Conditional

Is the class too big?
  → Extract Class, Extract Superclass

Are parameters too many?
  → Introduce Parameter Object, Preserve Whole Object

Is there duplicated logic?
  → Extract Method, Pull Up Method

Are there repeated switch/if statements?
  → Replace Conditional with Polymorphism

Is there a lot of null checking?
  → Introduce Special Case (Null Object)

Is the code hard to test?
  → Extract Method, Inject Dependencies, Replace Inheritance with Delegation

Are names confusing?
  → Rename Method/Variable/Field/Class

Is there Feature Envy?
  → Move Method to where the data lives
```
