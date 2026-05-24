# Inline Class

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A class does almost nothing — it doesn't justify its existence. It may be the result of previous refactorings that moved too much out of it.

## Motivation

When a class has too little behavior to earn its place, fold all its features into another class and remove it. This is the inverse of Extract Class, and is also useful as a first step before re-extracting in a better way.

## Java 8 Example

```java
// BEFORE: TelephoneNumber class with almost no behavior
class TelephoneNumber {
    private String areaCode;
    private String number;
    String getAreaCode() { return areaCode; }
    String getNumber() { return number; }
}

class Person {
    private TelephoneNumber officeTelephone;
    String getAreaCode() { return officeTelephone.getAreaCode(); }
    String getPhoneNumber() { return officeTelephone.getNumber(); }
}

// AFTER: TelephoneNumber inlined back into Person
class Person {
    private String officeAreaCode;
    private String officeNumber;
    String getAreaCode() { return officeAreaCode; }
    String getPhoneNumber() { return officeNumber; }
}
```

## Related Smells

Lazy Class, Speculative Generality

## Inverse

Extract Class (technique #10)
