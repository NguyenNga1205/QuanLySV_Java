package vn.edu.qlsv.controller;

import jakarta.validation.Valid;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.qlsv.model.Student;
import vn.edu.qlsv.model.StudentStatus;

@RestController
@RequestMapping("/api/students")
public class StudentController {
    private final Map<Long, Student> students = new ConcurrentHashMap<>();
    private final AtomicLong sequence = new AtomicLong(0);

    @GetMapping
    public List<Student> getAll(@RequestParam(required = false) String keyword) {
        return students.values().stream()
                .filter(s -> keyword == null || keyword.isBlank()
                        || s.getFullName().toLowerCase().contains(keyword.toLowerCase())
                        || s.getEmail().toLowerCase().contains(keyword.toLowerCase()))
                .sorted(Comparator.comparing(Student::getId))
                .toList();
    }

    @GetMapping("/{id}")
    public Student getById(@PathVariable Long id) {
        return findStudent(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Student create(@Valid @RequestBody Student input) {
        long id = sequence.incrementAndGet();
        Student student = new Student(id, input.getFullName(), input.getEmail(),
                input.getPhoneNumber(), input.getStatus() == null ? StudentStatus.STUDYING : input.getStatus());
        students.put(id, student);
        return student;
    }

    @PutMapping("/{id}")
    public Student update(@PathVariable Long id, @Valid @RequestBody Student input) {
        findStudent(id);
        Student updated = new Student(id, input.getFullName(), input.getEmail(),
                input.getPhoneNumber(), input.getStatus());
        students.put(id, updated);
        return updated;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (students.remove(id) == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sinh viên");
        }
    }

    private Student findStudent(Long id) {
        Student student = students.get(id);
        if (student == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sinh viên");
        }
        return student;
    }
}