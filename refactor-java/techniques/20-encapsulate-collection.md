# Encapsulate Collection

**Category:** Organizing Data  
**Sources:** Fowler Ch.7, Ch.9, Shvets Ch.8

## Problem

A getter returns a direct reference to an internal collection. Clients can modify it without the owning object knowing, breaking encapsulation.

## Motivation

Returning an internal collection directly lets callers add, remove, or clear items behind the object's back. This breaks invariants and makes the code unpredictable. Encapsulate Collection provides controlled add/remove methods and makes the getter return an unmodifiable view or a copy.

## Java 8 Example

```java
// BEFORE: mutable collection exposed
class Course {}

class Person {
    private List<Course> courses = new ArrayList<>();
    public List<Course> getCourses() { return courses; } // DANGER: direct access
    public void setCourses(List<Course> courses) { this.courses = courses; }
}
// Client can do: person.getCourses().clear(); // Bypasses any validation!

// AFTER: controlled access
class Person {
    private final List<Course> courses = new ArrayList<>();

    // Controlled mutations
    public void addCourse(Course course) {
        courses.add(Objects.requireNonNull(course));
    }

    public void removeCourse(Course course) {
        if (!courses.remove(course)) {
            throw new IllegalArgumentException("Course not found: " + course);
        }
    }

    // Returns unmodifiable view — clients can read but not modify
    public List<Course> getCourses() {
        return Collections.unmodifiableList(courses);
    }
}
```

## Java 11 Example

```java
// Java 11 style with List.copyOf for true immutable copy
class Team {
    private final List<Member> members = new ArrayList<>();

    public void addMember(Member member) {
        if (members.size() >= 10) throw new IllegalStateException("Team is full");
        members.add(member);
    }

    public boolean removeMember(Member member) {
        return members.remove(member);
    }

    // List.copyOf creates an independent immutable copy (Java 10+)
    public List<Member> getMembers() {
        return List.copyOf(members);
    }

    public int size() { return members.size(); }
}
```

## Related Smells

Mutable Data, Inappropriate Intimacy\n