from django.urls import path

from .views import (
    mark_attendance,
    get_attendance,
    student_attendance,
)

urlpatterns = [

    path('mark/', mark_attendance),

    path('all/', get_attendance),

    path('student/<int:student_id>/', student_attendance),
]