from django.urls import path

from .views import (
    add_mark,
    get_marks,
    student_marks,
)

urlpatterns = [

    path('add/', add_mark),

    path('all/', get_marks),

    path('student/<int:student_id>/', student_marks),
]