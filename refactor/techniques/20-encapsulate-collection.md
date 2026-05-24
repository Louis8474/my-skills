# Encapsulate Collection

**Category:** Organizing Data
**Sources:** Fowler Ch.7, Shvets Ch.7

## Problem

A getter returns a raw, mutable collection (list, set, map). Callers can freely add, remove, or replace elements in the collection, bypassing any invariants the owning class should enforce. The class loses control over its own data.

## Motivation

When a getter hands out a direct reference to an internal collection, the owning object cannot enforce business rules about that collection. For example, a course enrollment limit becomes unenforceable if callers can add courses directly to the list. Encapsulating the collection means providing controlled `add`/`remove` methods and returning a read-only view or copy from the getter.

## When to Apply

- A getter returns a mutable list, set, or map that clients modify directly
- Business rules about collection contents (size limits, uniqueness, validation) are bypassed
- The setter replaces the entire collection, losing control over transitions
- You need to react to collection changes (logging, events, validation)

## Mechanics

1. Encapsulate the collection field (make it private)
2. Provide `add` and `remove` methods on the owning class
3. Have the getter return a read-only view, copy, or frozen/immutable version
4. Remove the collection setter (or have it copy elements into the internal collection)
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Student:
    def __init__(self, name: str):
        self.name = name
        self.courses: list[str] = []

    def get_courses(self) -> list[str]:
        return self.courses  # exposes internal list

# Client can mutate freely:
# student.get_courses().append("Math")
# student.courses.clear()

# AFTER
class Student:
    def __init__(self, name: str):
        self.name = name
        self._courses: list[str] = []

    @property
    def courses(self) -> tuple[str, ...]:
        return tuple(self._courses)  # return immutable copy

    def add_course(self, course: str) -> None:
        if course in self._courses:
            raise ValueError(f"Already enrolled in {course}")
        self._courses.append(course)

    def remove_course(self, course: str) -> None:
        self._courses.remove(course)

    @property
    def num_courses(self) -> int:
        return len(self._courses)
```

### TypeScript

```typescript
// BEFORE
class Student {
  public courses: string[] = [];

  constructor(public name: string) {}

  getCourses(): string[] {
    return this.courses; // exposes internal array
  }
}

// Client can mutate freely:
// student.getCourses().push("Math");

// AFTER
class Student {
  private _courses: string[] = [];

  constructor(public readonly name: string) {}

  get courses(): readonly string[] {
    return [...this._courses]; // return copy
  }

  addCourse(course: string): void {
    if (this._courses.includes(course)) {
      throw new Error(`Already enrolled in ${course}`);
    }
    this._courses.push(course);
  }

  removeCourse(course: string): void {
    const index = this._courses.indexOf(course);
    if (index === -1) {
      throw new Error(`Not enrolled in ${course}`);
    }
    this._courses.splice(index, 1);
  }

  get numCourses(): number {
    return this._courses.length;
  }
}
```

### Go

```go
// BEFORE
type Student struct {
	Name    string
	Courses []string // public, anyone can mutate
}

func (s *Student) GetCourses() []string {
	return s.Courses // exposes internal slice
}

// AFTER
type Student struct {
	Name    string
	courses []string
}

func NewStudent(name string) *Student {
	return &Student{Name: name}
}

func (s *Student) Courses() []string {
	result := make([]string, len(s.courses))
	copy(result, s.courses)
	return result // return copy
}

func (s *Student) AddCourse(course string) error {
	for _, c := range s.courses {
		if c == course {
			return fmt.Errorf("already enrolled in %s", course)
		}
	}
	s.courses = append(s.courses, course)
	return nil
}

func (s *Student) RemoveCourse(course string) error {
	for i, c := range s.courses {
		if c == course {
			s.courses = append(s.courses[:i], s.courses[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("not enrolled in %s", course)
}

func (s *Student) NumCourses() int {
	return len(s.courses)
}
```

### Rust

```rust
// BEFORE
struct Student {
    name: String,
    pub courses: Vec<String>, // public, anyone can mutate
}

impl Student {
    fn get_courses(&self) -> &Vec<String> {
        &self.courses // exposes internal vec
    }
}

// AFTER
struct Student {
    name: String,
    courses: Vec<String>,
}

impl Student {
    fn new(name: impl Into<String>) -> Self {
        Self { name: name.into(), courses: Vec::new() }
    }

    fn courses(&self) -> &[String] {
        &self.courses // immutable slice — caller cannot modify
    }

    fn add_course(&mut self, course: impl Into<String>) -> Result<(), String> {
        let course = course.into();
        if self.courses.contains(&course) {
            return Err(format!("Already enrolled in {course}"));
        }
        self.courses.push(course);
        Ok(())
    }

    fn remove_course(&mut self, course: &str) -> Result<(), String> {
        if let Some(pos) = self.courses.iter().position(|c| c == course) {
            self.courses.remove(pos);
            Ok(())
        } else {
            Err(format!("Not enrolled in {course}"))
        }
    }

    fn num_courses(&self) -> usize {
        self.courses.len()
    }
}
```

## Related Smells

Mutable Data

## Inverse

(none)
