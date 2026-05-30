from django.db import models

from student_management.models import Student, Subject
from accounts.models import User


class Mark(models.Model):

    EXAM_CHOICES = (
        ('midterm', 'Midterm'),
        ('final', 'Final'),
        ('unit_test', 'Unit Test'),
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE
    )

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name='marks'
    )

    exam_type = models.CharField(
        max_length=20,
        choices=EXAM_CHOICES
    )

    marks_obtained = models.IntegerField()

    total_marks = models.IntegerField()

    graded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.student} - {self.subject}"