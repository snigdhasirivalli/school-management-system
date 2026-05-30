from django.db import models

from student_management.models import Student


class Fee(models.Model):

    STATUS_CHOICES = (
        ('paid', 'Paid'),
        ('partial', 'Partial'),
        ('pending', 'Pending'),
    )

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE
    )

    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    paid_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    remaining_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    payment_date = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):

        return f"{self.student} - {self.status}"